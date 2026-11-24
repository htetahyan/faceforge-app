import { GoogleGenAI } from '@google/genai';
import storageService from '../storage.ts';
import { addWatermark } from '../../utils/watermark.ts';
import { GenerateParams, AiGenerator, checkIsFreeUser } from '../ai.ts';

function getValidEnv(name: string): string | undefined {
  const val = process.env[name];
  if (!val || val.includes('placeholder') || val.trim() === '') {
    return undefined;
  }
  return val;
}

export class GeminiAiGenerator implements AiGenerator {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    const isVertex = 
      process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true' || 
      process.env.VERTEXAI === 'true' || 
      !!getValidEnv('VERTEX_API_KEY') || 
      !!getValidEnv('VERTEX_PROJECT_ID');

    const aiOptions: any = {};

    if (isVertex) {
      aiOptions.vertexai = true;
      const vertexApiKey = getValidEnv('VERTEX_API_KEY') || getValidEnv('GEMINI_API_KEY');
      if (vertexApiKey) {
        aiOptions.apiKey = vertexApiKey;
      } else {
        const projectId = getValidEnv('GOOGLE_PROJECT_ID') || getValidEnv('VERTEX_PROJECT_ID');
        if (projectId) aiOptions.project = projectId;
        const location = getValidEnv('GOOGLE_LOCATION') || getValidEnv('VERTEX_LOCATION') || 'us-central1';
        if (location) aiOptions.location = location;
      }
    } else {
      const apiKey = getValidEnv('GEMINI_API_KEY');
      if (apiKey) {
        aiOptions.apiKey = apiKey;
      }
    }

    if (aiOptions.apiKey || (aiOptions.project && aiOptions.location)) {
      this.aiClient = new GoogleGenAI(aiOptions);
    }
  }

  async generate(params: GenerateParams): Promise<void> {
    console.log(`[GeminiAI] Launching generation task ${params.taskId} with prompt: "${params.prompt}"`);

    if (!this.aiClient) {
      throw new Error('Gemini/Vertex AI client is not initialized. Check API keys.');
    }

    // Execute in background
    this.executeGenAiCall(params).catch((err) => {
      console.error(`[GeminiAI] Generation task ${params.taskId} failed:`, err);
      this.reportFailure(params.taskId, params.callbackUrl, this.cleanErrorMessage(err));
    });
  }

  private async executeGenAiCall(params: GenerateParams): Promise<void> {
    const isFree = await checkIsFreeUser(params.taskId);
    const numImages = 1; // 1 image per generation task (batching is handled by the caller creating multiple tasks)

    console.log(`[GeminiAI] Requesting ${numImages} image(s) from Google GenAI SDK for task ${params.taskId}...`);
    
    // 1. Fetch face URLs and convert to base64 inlineData
    const imageParts = await Promise.all(
      params.faceUrls.slice(0, 10).map(async (url) => {
        try {
          if (url.startsWith('data:image/')) {
            const [mimeType, base64Data] = url.split(',');
            const actualMimeType = mimeType.split(':')[1].split(';')[0];
            return {
              inlineData: {
                data: base64Data,
                mimeType: actualMimeType,
              },
            };
          } else {
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            return {
              inlineData: {
                data: Buffer.from(buffer).toString("base64"),
                mimeType: response.headers.get("content-type") || "image/jpeg",
              },
            };
          }
        } catch (e) {
          console.error(`[GeminiAI] Failed to process face image: ${url}`, e);
          return null;
        }
      })
    );
 
    let validImageParts = imageParts.filter(p => p !== null);

    // Parse prompt parameters (concept/expression/aspectRatio)
    const rawPrompt = params.prompt || 'Professional Studio Portrait';
    const promptParts = rawPrompt.split('|').map((s) => s.trim());
    const conceptOrStyle = promptParts[0] || 'Professional Studio Portrait';
    const expression = promptParts[1] || 'smile';

    const expressionDirective = expression === 'smile'
      ? 'display a subtle, natural, effortless Instagram lifestyle smile with soft expressive eyes'
      : expression === 'glamour'
      ? 'display a captivating, confident, chic Instagram editorial gaze'
      : expression === 'cinematic'
      ? 'display a dramatic, moody cinematic facial expression looking slightly off-camera'
      : expression === 'professional'
      ? 'display a serene, confident, polished executive portrait expression'
      : `display a subtle, aesthetic ${expression} expression`;

    const fullPrompt = `
      Style Concept: ${conceptOrStyle}
      Expression Directive: ${expressionDirective}

      CRITICAL PORTRAIT & LIKENESS ENHANCEMENTS:
      - Highly detailed professional Instagram lifestyle photography, 8k resolution, shot on 85mm f/1.8 lens, natural lighting, sharp focus, hyper-realistic skin textures, natural skin pores, realistic human eyes.
      - ${validImageParts.length > 0 ? "FACE LIKENESS & HAIRSTYLE CONSISTENCY: Preserve the subject's facial structure, eye shape, nose shape, and skin tone from the reference face image. The AI may style the hair to complement the fashion aesthetic, but the hair color, hair length, and general hairstyle MUST remain 100% identical and consistent across all photos in this carousel shoot." : ""}
      - EXPRESSION STYLE: Natural, chic, aesthetic Instagram lifestyle portrait expression (subtle soft smile or calm confident gaze, NEVER overly exaggerated laughing or forced open-mouth expression).

      NEGATIVE CONSTRAINTS (STRICTLY AVOID):
      - Low resolution, blurry faces, distorted anatomy, warped fingers, extra limbs, plastic or airbrushed skin, CGI looks, cartoons, low quality, digital artifacting, generic faces, inconsistent hair across slides, open mouth laughing, screaming.
      - ${params.negativePrompt ? params.negativePrompt : ""}
    `;

    // 2. Call generateContent matching graphicdesign-app's proven Vertex AI config
    let lastError: any = null;
    let result: any = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await this.aiClient!.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: [
            {
              role: 'user',
              parts: [
                { text: fullPrompt },
                ...(validImageParts as any)
              ]
            }
          ],
          config: {
            temperature: 0.2,
            topP: 0.9,
            topK: 30,
            imageConfig: {
              aspectRatio: params.aspectRatio || '1:1',
              imageSize: '1K',
            }
          } as any
        });
        
        // Debug: log full response structure to understand what we get
        const parts = result?.candidates?.[0]?.content?.parts || [];
        const candidate = result?.candidates?.[0];
        console.log(`[GeminiAI] Response has ${parts.length} parts. finishReason: ${candidate?.finishReason || 'N/A'}`);
        
        // Check for image in response (matching graphicdesign-app's pattern)
        const imagePart = parts.find((p: any) => p.inlineData || p.inline_data);
        if (imagePart) {
          break; // Got an image, success!
        } else {
          const finishReason = candidate?.finishReason || 'UNKNOWN';
          console.warn(`[GeminiAI] No image part generated. finishReason: ${finishReason}. Candidate info:`, JSON.stringify(candidate, null, 2));
          lastError = new Error(`Image generation was blocked (${finishReason}). Please try a different photo or prompt.`);
          break; // NEVER RETRY if the model returned 0 parts (blocked by safety/policy), as retrying causes 429 quota exhaustion!
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err.message || err);
        console.warn(`[GeminiAI] Attempt ${attempt} failed: ${errMsg}`);
        if (errMsg.includes('safety') || errMsg.includes('SAFETY')) {
          break; // Do not retry on content safety blocks
        }
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
          if (attempt < 3) {
            const waitMs = attempt * 4000;
            console.log(`[GeminiAI] Rate limit (429) hit on attempt ${attempt}. Waiting ${waitMs}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue;
          }
          break;
        }
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (!result) {
      throw new Error(`Google Gemini API failed after 3 attempts. Last Error: ${lastError?.message || 'No output returned'}`);
    }

    // Extract image parts — check both camelCase (SDK) and snake_case (raw API) property names
    const allParts = result.candidates?.[0]?.content?.parts || [];
    const outputParts = allParts.filter((p: any) => p.inlineData || p.inline_data);

    if (outputParts.length === 0) {
      console.error("[GeminiAI] No images in final response. Full response:", JSON.stringify(result, null, 2));
      throw new Error("Gemini failed to generate an image.");
    }

    // 3. Process watermarking and storage upload in PARALLEL
    const publicUrls = await Promise.all(
      outputParts.map(async (part: any, i: number) => {
        const imgData = part.inlineData || part.inline_data;
        let buffer = Buffer.from(imgData.data ?? "", "base64");
        if (isFree) {
          console.log(`[GeminiAI] Applying GlowUp watermark for Free user on task ${params.taskId} (Image ${i})...`);
          buffer = (await addWatermark(buffer)) as any;
        }
        const suffix = outputParts.length > 1 ? `_${i}` : '';
        const outputKey = `outputs/${params.taskId}${suffix}.jpg`;
        return storageService.uploadFile(outputKey, buffer, 'image/jpeg');
      })
    );

    const finalOutputUrl = publicUrls.join(',');

    // Call our webhook callback to mark the task completed
    await this.triggerWebhook(params.callbackUrl, {
      taskId: params.taskId,
      status: 'completed',
      outputUrl: finalOutputUrl,
    });
  }

  private cleanErrorMessage(err: any): string {
    const rawMsg = String(err?.message || err || '');
    const lower = rawMsg.toLowerCase();

    if (lower.includes('invalid_argument') || lower.includes('invalid argument') || lower.includes('bad request') || lower.includes('400')) {
      return 'Image generation encountered an issue with the style or parameters. Please try again.';
    }
    if (lower.includes('429') || lower.includes('rate limit') || lower.includes('quota') || lower.includes('503') || lower.includes('unavailable') || lower.includes('deadline') || lower.includes('timeout') || lower.includes('fetch failed')) {
      return 'AI server is currently busy. Please try again in a moment.';
    }
    if (lower.includes('safety') || lower.includes('blocked') || lower.includes('policy') || lower.includes('harmful') || lower.includes('person')) {
      return 'Generation was paused due to content safety guidelines. Please try a different photo or template.';
    }
    return 'Image generation failed. Please try again.';
  }

  private async reportFailure(taskId: string, callbackUrl: string, message: string): Promise<void> {
    const safeMessage = this.cleanErrorMessage(message);
    await this.triggerWebhook(callbackUrl, {
      taskId,
      status: 'failed',
      error: safeMessage,
    }).catch((err) => console.error('Failed to trigger failure webhook:', err));
  }

  private async triggerWebhook(url: string, body: any): Promise<void> {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
}
