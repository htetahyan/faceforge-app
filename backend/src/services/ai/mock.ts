import storageService from '../storage.ts';
import { addWatermark } from '../../utils/watermark.ts';
import { GenerateParams, AiGenerator, checkIsFreeUser } from '../ai.ts';

export class MockAiGenerator implements AiGenerator {
  async generate(params: GenerateParams): Promise<void> {
    console.log(`[MockAI] Launching simulated AI task ${params.taskId} with prompt: "${params.prompt}"`);

    // Simulate async network/generation delay (3 seconds)
    setTimeout(async () => {
      try {
        const isFree = await checkIsFreeUser(params.taskId);

        // Find keywords in prompt to download an appropriate beautiful mockup image
        let theme = 'social-media-style-photography';
        const lowercasePrompt = params.prompt.toLowerCase();
        
        if (lowercasePrompt.includes('mirror') || lowercasePrompt.includes('selfie')) {
          theme = 'mirror-selfie';
        } else if (lowercasePrompt.includes('cafe') || lowercasePrompt.includes('reading') || lowercasePrompt.includes('matcha')) {
          theme = 'cafe-soft-aesthetic';
        } else if (lowercasePrompt.includes('daisy') || lowercasePrompt.includes('field')) {
          theme = 'daisy-field-girl';
        } else if (lowercasePrompt.includes('paris') || lowercasePrompt.includes('street') || lowercasePrompt.includes('ootd')) {
          theme = 'paris-fashion-chic';
        } else if (lowercasePrompt.includes('posetano') || lowercasePrompt.includes('polaroid') || lowercasePrompt.includes('vacation')) {
          theme = 'polaroid-retro-lifestyle';
        } else if (lowercasePrompt.includes('jewelry') || lowercasePrompt.includes('luxury') || lowercasePrompt.includes('beauty')) {
          theme = 'luxury-beauty-jewelry';
        } else if (lowercasePrompt.includes('oil painting') || lowercasePrompt.includes('baroque') || lowercasePrompt.includes('rembrandt')) {
          theme = 'classical-oil-painting';
        }

        // Curated fallbacks based on theme
        const mockFallbackImages: Record<string, string> = {
          'mirror-selfie': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
          'cafe-soft-aesthetic': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
          'daisy-field-girl': 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80',
          'paris-fashion-chic': 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80',
          'polaroid-retro-lifestyle': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
          'luxury-beauty-jewelry': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
          'classical-oil-painting': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        };

        const imageUrl = mockFallbackImages[theme] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
        console.log(`[MockAI] Fetching curated mockup image from Unsplash: ${imageUrl}`);

        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Unsplash download failed');

        const arrayBuffer = await response.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);

        // Apply mock watermark if free
        if (isFree) {
          console.log(`[MockAI] Applying GlowUp watermark for Free user on task ${params.taskId}...`);
          buffer = await addWatermark(buffer) as any;
        }

        // Upload/Save final result
        const outputKey = `outputs/${params.taskId}.jpg`;
        const publicUrl = await storageService.uploadFile(outputKey, buffer, 'image/jpeg');

        // Post back to Hono webhook callback
        console.log(`[MockAI] Generation success. Sending callback for task ${params.taskId}`);
        await fetch(params.callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: params.taskId,
            status: 'completed',
            outputUrl: publicUrl,
          }),
        });

      } catch (err: any) {
        console.error(`[MockAI] Error in mock generation worker:`, err);
        // Fallback webhook trigger as failed
        fetch(params.callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: params.taskId,
            status: 'failed',
            error: err.message,
          }),
        }).catch((e) => console.error('Failed to trigger failed webhook callback', e));
      }
    }, 3000);
  }
}
