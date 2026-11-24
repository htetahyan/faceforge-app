import { db } from '../db/client.ts';
import { generationTasks, templates, faceProfiles } from '../db/schema.ts';
import { eq, and, inArray, asc, sql } from 'drizzle-orm';
import storageService from './storage.ts';
import aiService from './ai.ts';

class QueueService {
  private readonly CONCURRENCY_LIMIT = 1;
  private isProcessingNext = false; // Lock to prevent overlapping ticks

  /**
   * 1. Register a newly created task into the scheduler.
   * Decides whether to immediately execute or queue the task, and returns the queue position.
   */
  async enqueueTask(taskId: string): Promise<{ status: 'processing' | 'pending'; queuePosition: number }> {
    console.log(`[Queue] Evaluating scheduling slot for task ${taskId}...`);

    // Fetch the target task details
    const task = await db.query.generationTasks.findFirst({
      where: eq(generationTasks.id, taskId),
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found during scheduling`);
    }

    // Get current count of tasks actively generating (status = processing)
    const activeTasks = await db.query.generationTasks.findMany({
      where: eq(generationTasks.status, 'processing'),
    });

    const activeCount = activeTasks.length;

    if (activeCount < this.CONCURRENCY_LIMIT) {
      console.log(`[Queue] Concurrency limit not reached (${activeCount}/${this.CONCURRENCY_LIMIT}). Fast-tracking task ${taskId} immediately!`);
      
      // Update status to processing and trigger generation asynchronously
      await db
        .update(generationTasks)
        .set({ status: 'processing', updatedAt: new Date() })
        .where(eq(generationTasks.id, taskId));

      // Trigger generation in background
      this.triggerGeneration(taskId).catch((err) => {
        console.error(`[Queue] Background generation failure on fast-track for task ${taskId}:`, err);
      });

      return { status: 'processing', queuePosition: 0 };
    }

    // Otherwise, calculate the pending queue position
    console.log(`[Queue] Concurrency limit reached (${activeCount}/${this.CONCURRENCY_LIMIT}). Queuing task ${taskId}.`);
    
    // Count how many 'pending' tasks exist that were created before (or equal to) this task
    const pendingBefore = await db.query.generationTasks.findMany({
      where: and(
        eq(generationTasks.status, 'pending'),
        sql`${generationTasks.createdAt} <= ${task.createdAt}`
      ),
    });

    const queuePosition = pendingBefore.length;

    return {
      status: 'pending',
      queuePosition: queuePosition > 0 ? queuePosition : 1,
    };
  }

  /**
   * 2. Trigger the next oldest pending task in line when a slot frees up.
   * This is triggered by webhook completion or failures.
   */
  async processNext(): Promise<void> {
    if (this.isProcessingNext) return; // Prevent overlapping runs
    this.isProcessingNext = true;

    try {
      // Check active processing count
      const activeTasks = await db.query.generationTasks.findMany({
        where: eq(generationTasks.status, 'processing'),
      });

      let activeCount = activeTasks.length;
      console.log(`[Queue Tick] Current active tasks: ${activeCount}/${this.CONCURRENCY_LIMIT}`);

      while (activeCount < this.CONCURRENCY_LIMIT) {
        // Query all pending tasks along with their user's subscription tier
        const pendingTasks = await db.query.generationTasks.findMany({
          where: eq(generationTasks.status, 'pending'),
          with: {
            user: {
              columns: {
                subscriptionTier: true,
              },
            },
          },
        });

        if (pendingTasks.length === 0) {
          console.log('[Queue Tick] No more pending tasks in queue.');
          break;
        }

        // Sort: premium (3) > pro (2) > free (1). Tie-breaker: oldest task first
        const tierPriority = { premium: 3, pro: 2, free: 1 };
        pendingTasks.sort((a, b) => {
          const priorityA = tierPriority[a.user?.subscriptionTier as keyof typeof tierPriority] || 1;
          const priorityB = tierPriority[b.user?.subscriptionTier as keyof typeof tierPriority] || 1;

          if (priorityA !== priorityB) {
            return priorityB - priorityA; // Higher priority first
          }
          return a.createdAt.getTime() - b.createdAt.getTime(); // Oldest first
        });

        const nextTask = pendingTasks[0];
        console.log(`[Queue Tick] Promoting task ${nextTask.id} (Tier: ${nextTask.user?.subscriptionTier}) from pending to processing!`);

        // Promote task in DB first to reserve the slot
        await db
          .update(generationTasks)
          .set({ status: 'processing', updatedAt: new Date() })
          .where(eq(generationTasks.id, nextTask.id));

        activeCount++;

        // Trigger AI generation
        this.triggerGeneration(nextTask.id).catch((err) => {
          console.error(`[Queue Tick] Background generation failure during promotion for task ${nextTask.id}:`, err);
        });
      }
    } catch (err) {
      console.error('[Queue Tick] Error inside processNext loop:', err);
    } finally {
      this.isProcessingNext = false;
    }
  }

  /**
   * 3. Download references, sign secure GET URLs, and send to Vertex AI
   */
  private async triggerGeneration(taskId: string): Promise<void> {
    try {
      const task = await db.query.generationTasks.findFirst({
        where: eq(generationTasks.id, taskId),
        with: { template: true },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found during generation trigger`);
      }

      console.log(`[Queue] Compiling secure payload for task ${taskId}...`);

      // Resolve the face profiles mapped
      const faceIds = Object.values(task.faceMappings);
      const userFaces = await db.query.faceProfiles.findMany({
        where: inArray(faceProfiles.id, faceIds),
      });

      // Construct Map for ordered pre-signing matching face placeholders
      const faceMap = new Map(userFaces.map((f) => [f.id, f]));
      const faceUrls: string[] = [];

      const slots = task.template?.faceSlots || Object.keys(task.faceMappings);
      for (const slot of slots) {
        const faceId = task.faceMappings[slot];
        const faceFile = faceMap.get(faceId);
        if (faceFile && faceFile.r2Keys) {
          const keys = Array.isArray(faceFile.r2Keys) ? faceFile.r2Keys : [faceFile.r2Keys];
          const presignedUrls = await storageService.getPresignedGetUrls(keys);
          faceUrls.push(...presignedUrls);
        }
      }

      // Webhook Setup: Webhooks are triggered internally from the backend container itself,
      // so we must use the internal container port (3000) instead of the external BASE_URL (3005).
      const internalPort = process.env.PORT || '3000';
      const webhookSecret = process.env.WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('WEBHOOK_SECRET environment variable is required');
      }
      const callbackUrl = `http://localhost:${internalPort}/api/generate/webhook?secret=${encodeURIComponent(webhookSecret)}`;

      let compiledPrompt = task.template?.promptTemplate || task.customPrompt || 'Professional Studio Portrait';
      let outfitUrl: string | undefined = undefined;
      let expression: string | undefined = undefined;

      let customPromptContent = task.customPrompt;
      let slideIndex = 0;
      let totalSlides = 1;

      // Extract slide metadata (slide:N/M) from custom prompt
      if (customPromptContent) {
        const slideMatch = customPromptContent.match(/slide:(\d+)\/(\d+)/);
        if (slideMatch) {
          slideIndex = parseInt(slideMatch[1], 10) - 1; // 0-based
          totalSlides = parseInt(slideMatch[2], 10);
          customPromptContent = customPromptContent.replace(/\s*\|\s*slide:\d+\/\d+/, '').trim();
        }

        const knownExpressions = ['neutral', 'smile', 'laugh', 'fierce', 'wink', 'glamour', 'cinematic', 'professional'];
        const knownRatios = ['4:5', '1:1', '9:16', '3:4', '16:9'];

        let extractedOutfit = '';
        if (customPromptContent.includes('|')) {
          const parts = customPromptContent.split('|').map((s: string) => s.trim()).filter(Boolean);
          for (const part of parts) {
            const lower = part.toLowerCase();
            if (knownExpressions.includes(lower)) {
              expression = lower;
            } else if (knownRatios.includes(lower) || lower.startsWith('slide:')) {
              // Ignore ratio or slide tokens
            } else if (part !== task.template?.title && !part.startsWith('http://') && !part.startsWith('https://') && !part.startsWith('users/')) {
              extractedOutfit = part;
            } else if (part.startsWith('http://') || part.startsWith('https://') || part.startsWith('users/')) {
              customPromptContent = part;
            }
          }
        } else {
          const lower = customPromptContent.trim().toLowerCase();
          if (knownExpressions.includes(lower)) {
            expression = lower;
          } else if (customPromptContent.trim() !== task.template?.title && !knownRatios.includes(lower)) {
            extractedOutfit = customPromptContent.trim();
          }
        }

        if (customPromptContent && customPromptContent.trim() !== '') {
          if (customPromptContent.startsWith('users/')) {
            outfitUrl = await storageService.getPresignedGetUrl(customPromptContent);
            compiledPrompt = `${compiledPrompt}, performing high-fidelity outfit-swap try-on dressing the subject in the outfit shown in reference`;
          } else if (customPromptContent.startsWith('http://') || customPromptContent.startsWith('https://')) {
            outfitUrl = customPromptContent;
            compiledPrompt = `${compiledPrompt}, performing high-fidelity outfit-swap try-on dressing the subject in the outfit shown in reference`;
          } else if (extractedOutfit) {
            compiledPrompt = `${compiledPrompt}\n\nCUSTOM OUTFIT / STYLE DIRECTIVE: Overwrite and dress the subject in the user's requested outfit and styling: "${extractedOutfit}". Render this custom outfit with high-fashion realism while preserving the background environment and studio lighting.`;
          }
        }
      }

      // Instruct AI model to creatively vary pose, camera angle, and framing per slide for Instagram lifestyle look
      if (totalSlides > 1) {
        compiledPrompt = `${compiledPrompt}\n\nCAROUSEL SLIDE DIRECTION (Slide ${slideIndex + 1} of ${totalSlides}):
- Dynamically generate a unique, authentic, candid Instagram lifestyle pose (e.g. walking, leaning, casually looking away or into lens).
- Keep the facial expression subtle, chic, natural, and effortless (subtle soft smile or calm confident gaze; NEVER overly exaggerated open-mouthed laughing).
- Vary the camera shot angle and framing (medium shot, waist-up, or full-body).`;
      }

      // Always enforce appearance consistency — gender neutral
      compiledPrompt = `${compiledPrompt}\n\nCRITICAL APPEARANCE CONSISTENCY:
- The subject's hairstyle, hair color, hair length, and hair styling MUST be 100% identical and consistent with their reference face image.
- NEVER change haircut or hair color. Ensure natural, photorealistic hair texture.
- The subject's gender, facial features, and body type MUST be preserved exactly as they appear in the reference face image.
- NEVER reassign or change clothing gender: if the reference person appears masculine, dress them in masculine attire appropriate for the scene; if feminine, dress them in feminine attire. Match the apparent gender of the reference photo exactly. Do NOT cross-dress or gender-swap any subject.`;

      // Apply explicit expression override if specified
      if (expression) {
        const expressionDirectives: Record<string, string> = {
          neutral: 'with a cool, nonchalant, chic, neutral Instagram portrait gaze',
          smile: 'with a subtle, natural, effortless Instagram lifestyle smile',
          laugh: 'with a warm, genuine, subtle aesthetic smile',
          fierce: 'with a fierce, dramatic, high-fashion intense editorial expression',
          wink: 'with a playful, charming, confident winking facial expression',
          glamour: 'with a captivating, high-end editorial glamour expression and luminous gaze',
          cinematic: 'with an evocative, moody cinematic expression and dramatic eye focus',
          professional: 'with a poised, sophisticated, highly professional executive expression',
        };
        const directive = expressionDirectives[expression.toLowerCase()];
        if (directive) {
          compiledPrompt = `${compiledPrompt}, ${directive}`;
        }
      }

      // Forward to the AI engine
      await aiService.generateImage({
        taskId: task.id,
        prompt: compiledPrompt,
        faceUrls,
        callbackUrl,
        outfitUrl,
      } as any);

    } catch (err: any) {
      console.error(`[Queue] Failed to execute generation trigger for task ${taskId}:`, err);

      // Save failure in database and tick queue to immediately free up the slot for other users!
      await db
        .update(generationTasks)
        .set({
          status: 'failed',
          error: 'Unable to start image generation. Please try again.',
          updatedAt: new Date(),
        })
        .where(eq(generationTasks.id, taskId));

      // Trigger a queue tick to start the next pending task
      this.processNext().catch((e) => console.error('Failed to process next queue tick after failure', e));
    }
  }
}

export const queueService = new QueueService();
export default queueService;
