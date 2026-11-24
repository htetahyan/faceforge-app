import { db } from '../db/client.ts';
import { generationTasks } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { GeminiAiGenerator } from './ai/imagen.ts';
import { MockAiGenerator } from './ai/mock.ts';

export interface GenerateParams {
  taskId: string;
  prompt: string;
  faceUrls: string[]; // Signed GET URLs for private face images
  callbackUrl: string;
  aspectRatio?: string; // Optional aspect ratio, e.g. "1:1", "9:16"
  negativePrompt?: string; // Optional negative prompt
  outfitUrl?: string; // Optional signed URL of the try-on outfit photo
}

export interface AiGenerator {
  generate(params: GenerateParams): Promise<void>;
}

/**
 * Helper to check if the user associated with a task is on the Free tier
 */
export async function checkIsFreeUser(taskId: string): Promise<boolean> {
  try {
    const task = await db.query.generationTasks.findFirst({
      where: eq(generationTasks.id, taskId),
      with: {
        user: true,
      },
    });
    return task?.user?.subscriptionTier === 'free';
  } catch (err) {
    console.error(`[AI Service] Failed to lookup user subscription tier for task ${taskId}:`, err);
    return true; // Default to safe/watermarked fallback if lookup fails
  }
}

/**
 * AI Orchestrator Factory
 */
class AiService {
  private generator: AiGenerator | null = null;

  private getGenerator(): AiGenerator {
    if (!this.generator) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VERTEX_API_KEY || '';
      const hasKey = apiKey && !apiKey.includes('placeholder') && apiKey !== '';

      if (hasKey) {
        this.generator = new GeminiAiGenerator();
      } else {
        console.error('⚠️ Gemini/Vertex AI credentials missing or set to placeholder. Failing strictly!');
        throw new Error('AI credentials are required to start the service. Please set GEMINI_API_KEY.');
      }
    }
    return this.generator;
  }

  async generateImage(params: GenerateParams): Promise<void> {
    await this.getGenerator().generate(params);
  }
}

export const aiService = new AiService();
export default aiService;
