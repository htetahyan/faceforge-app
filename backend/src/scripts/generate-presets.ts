import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import storageService from '../services/storage.ts';

dotenv.config();

function getValidEnv(name: string): string | undefined {
  const val = process.env[name];
  if (!val || val.includes('placeholder') || val.trim() === '') {
    return undefined;
  }
  return val;
}

const vertexApiKey = getValidEnv('VERTEX_API_KEY');
const geminiApiKey = getValidEnv('GEMINI_API_KEY');
const apiKey = geminiApiKey || vertexApiKey || '';

if (!apiKey) {
  console.error('Error: Neither GEMINI_API_KEY nor VERTEX_API_KEY is defined in environment variables.');
  process.exit(1);
}

const aiOptions: any = {};
if (process.env.VERTEXAI === 'true' || !!vertexApiKey) {
  aiOptions.vertexai = true;
  aiOptions.apiKey = apiKey;
} else {
  aiOptions.apiKey = apiKey;
}

const aiClient = new GoogleGenAI(aiOptions);

const PRESETS_TO_GENERATE = [
  {
    id: 'tux',
    prompt: 'High-fashion premium black cropped mock-neck velvet sweater, snug designer crop top, flat lay apparel design, front view, clean minimalist studio background, professional product photography',
    key: 'presets/tux.jpg'
  },
  {
    id: 'gown',
    prompt: 'Ultra-premium loose baggy low-rise cargo pants in black, designer streetwear trousers sitting low on hips, exposed waistband detail, solid plain background, flat lay catalog apparel photography',
    key: 'presets/gown.jpg'
  },
  {
    id: 'blazer',
    prompt: 'Chic cream linen cropped blazer, relaxed tailored streetwear suit jacket, modern luxury minimalist design, plain solid studio background, front flat lay fashion photography',
    key: 'presets/blazer.jpg'
  },
  {
    id: 'cyber',
    prompt: 'Cropped cyber metallic streetwear puffer bomber jacket, reflective silver and high-fashion neon techwear details, deep dark plain background, studio apparel photography',
    key: 'presets/cyber.jpg'
  },
  {
    id: 'knit',
    prompt: 'Premium knitted low-rise two-piece ribbed set with chic micro crop long-sleeve knit top and matching cargo skirt, high-end neutral olive streetwear apparel design, flat lay front view, studio fashion photography',
    key: 'presets/knit.jpg'
  },
  {
    id: 'corset',
    prompt: 'Luxurious sleek structured denim low-cut corset top with silver metal buckles, premium urban vintage wash streetwear vest, solid background, flat lay catalog fashion photography',
    key: 'presets/corset.jpg'
  }
];

async function run() {
  console.log('🚀 Launching presets generation script using Google Gemini...');

  const fallbacks: Record<string, string> = {
    tux: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop',
    gown: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=600&auto=format&fit=crop',
    blazer: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop',
    cyber: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop',
    knit: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=600&auto=format&fit=crop',
    corset: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
  };

  for (const preset of PRESETS_TO_GENERATE) {
    let buffer: Buffer | null = null;
    try {
      console.log(`\nGenerating image for preset "${preset.id}" using Gemini model 'gemini-3.1-flash-image'...`);
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: preset.prompt,
        config: {
          imageConfig: {
            aspectRatio: '1:1',
            numberOfImages: 1
          }
        } as any
      });

      const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (part && part.inlineData && part.inlineData.data) {
        buffer = Buffer.from(part.inlineData.data, 'base64');
        console.log(`[Gemini] Generated fresh image for preset "${preset.id}".`);
      }
    } catch (error: any) {
      console.warn(`❌ Failed to generate preset "${preset.id}" via Gemini: ${error.message || error}`);
    }

    // Fallback: If Gemini failed (e.g. 429 rate limit), download high-res Unsplash asset
    if (!buffer) {
      try {
        console.log(`⚠️ Downloading high-res stock fallback for preset "${preset.id}" from Unsplash...`);
        const res = await fetch(fallbacks[preset.id]);
        const arrayBuf = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
      } catch (err: any) {
        console.error(`❌ Critical: Failed to download stock fallback for "${preset.id}":`, err.message || err);
        continue;
      }
    }

    try {
      console.log(`Uploading preset "${preset.id}" image to storage bucket under key: ${preset.key}...`);
      const publicUrl = await storageService.uploadFile(preset.key, buffer, 'image/jpeg');
      console.log(`✅ Success! Preset "${preset.id}" is fully uploaded.`);
      console.log(`Public URL: ${publicUrl}`);
    } catch (uploadError: any) {
      console.error(`❌ Failed to save preset image to storage:`, uploadError.message || uploadError);
    }
  }

  console.log('\n✨ Presets generation task complete!');
}

run();
