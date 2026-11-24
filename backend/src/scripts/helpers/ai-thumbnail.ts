import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import storageService from '../../services/storage.ts';

function getValidEnv(name: string): string | undefined {
  const val = process.env[name];
  if (!val || val.includes('placeholder') || val.trim() === '') return undefined;
  return val;
}

let aiClient: GoogleGenAI | null = null;
const vertexApiKey = getValidEnv('VERTEX_API_KEY');
const geminiApiKey = getValidEnv('GEMINI_API_KEY');
const apiKey = vertexApiKey || geminiApiKey;

if (process.env.VERTEXAI === 'true' || vertexApiKey) {
  aiClient = new GoogleGenAI({ vertexai: true, apiKey: apiKey || '' });
} else if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

export async function generateAndUploadThumbnail(
  title: string,
  prompt: string,
  fallbackUrl: string
): Promise<string> {
  if (!aiClient) {
    console.warn(`  └─ [AI] AI client not configured, using fallback URL for "${title}".`);
    return fallbackUrl;
  }

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      console.log(`  └─ 🎨 [AI] Generating image with Gemini/Vertex for "${title}" (attempt ${attempt})...`);
      const res = await aiClient.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: prompt,
        config: { imageConfig: { aspectRatio: '1:1', numberOfImages: 1 } } as any,
      });

      const part = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (!part?.inlineData?.data) {
        console.warn(`  └─ ⚠️ [AI] No image returned for "${title}", using fallback.`);
        return fallbackUrl;
      }

      const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const key = `templates/seed-${slug}-${Date.now()}.jpg`;

      console.log(`  └─ ☁️ [R2] Uploading generated image (${Math.round(imageBuffer.length / 1024)}KB)...`);
      const publicUrl = await storageService.uploadFile(key, imageBuffer, 'image/jpeg');
      console.log(`  └─ ✅ [Success] AI Preview URL: ${publicUrl}`);
      // Small pause after a success to avoid bursting quota
      await new Promise((r) => setTimeout(r, 3000));
      return publicUrl;
    } catch (err: any) {
      const isRateLimit = err.status === 'RESOURCE_EXHAUSTED' || (err.message && err.message.includes('429'));
      if (isRateLimit && attempt < 4) {
        const waitMs = attempt * 6000;
        console.warn(`  └─ ⏳ [429 Quota] Rate limit hit for "${title}". Waiting ${waitMs / 1000}s before retry...`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      console.warn(`  └─ ⚠️ [AI/R2 Error] "${title}": ${err.message || err}. Using fallback.`);
      return fallbackUrl;
    }
  }
  return fallbackUrl;
}
