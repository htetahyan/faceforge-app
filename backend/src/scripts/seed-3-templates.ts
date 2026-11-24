import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { db } from '../db/client.ts';
import { templates, templateCategories } from '../db/schema.ts';
import storageService from '../services/storage.ts';

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

const aiOptions: any = {};
if (process.env.VERTEXAI === 'true' || !!vertexApiKey) {
  aiOptions.vertexai = true;
  aiOptions.apiKey = apiKey;
} else if (apiKey) {
  aiOptions.apiKey = apiKey;
}

const aiClient = apiKey ? new GoogleGenAI(aiOptions) : null;

const TEMPLATES = [
  {
    title: 'Urban Chic Streetwear',
    description: 'High-fashion street portrait featuring a chic black mock-neck long-sleeve top, designer cargo trousers, and an urban brick walkway.',
    seedPrompt: `
      A professional high-fidelity fashion studio model portrait.

      Attire:
      She is wearing a chic solid black long-sleeved mock-neck knit top with clean tailored lines.
      She wears stylish relaxed-fit black designer cargo trousers with structured pocket details.
      A thin black leather belt with a small circular silver metal buckle sits at her waist.

      Pose and Physique:
      She is standing with her body angled slightly toward the left side of the frame, but her face is turned straight forward.
      Her left arm is raised, bent at the elbow, with her hand resting behind her neck, pulling her hair slightly back. Her right arm is down by her side, with her hand tucked casually into the front pocket of her pants.
      Her posture is confident and effortless.

      Environment and Background:
      She is standing on a paved walkway made of reddish-brown rectangular bricks laid out in a staggered, brickwork pattern.
      Immediately behind her to the right is a smooth, flat, light grey wall made of large rectangular architectural panels.
      To her left, there is a covered outdoor walkway supported by dark grey pillars. In the far background, the walkway opens up to an outdoor area where some green trees are visible.
      The lighting is soft, diffused, and even, indicating it is shaded by an overhang with no harsh shadows.
    `,
    promptTemplate: `
      A professional high-fidelity fashion portrait. She is wearing a chic solid black long-sleeved mock-neck top and relaxed-fit black designer cargo trousers. Thin black leather belt with a small circular silver metal buckle at the waist. Standing with body angled slightly toward the left, face turned straight forward to camera, left arm raised bent at the elbow resting behind the neck, right hand tucked casually into the front pocket. Standing on a paved walkway of reddish-brown rectangular bricks in a staggered pattern, flat light grey wall of large rectangular architectural panels behind, covered outdoor walkway with dark grey pillars to the left, soft diffused even studio lighting.
    `,
    fallbackUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    keyPrefix: 'low-rise-urban-chic',
  },
  {
    title: 'Riviera Linen Resort',
    description: 'Mediterranean luxury resort portrait in a cream oversized linen blazer, draped silk sleeveless top, and tailored wide-leg trousers on a sunlit terracotta terrace.',
    seedPrompt: `
      A professional high-fidelity editorial fashion portrait.

      Attire:
      She is wearing an oversized, unstructured cream linen blazer with the sleeves casually pushed up to just below her elbows, revealing her forearms. The blazer is left open, unbuttoned.
      Underneath the blazer, she wears a draped ivory silk sleeveless top with a classic round neckline that catches the light.
      Her trousers are tailored, high-waisted, wide-leg cream linen pants with a clean pressed front crease. A thin woven tan leather belt with a small matte gold rectangular buckle sits at her natural waist.
      On her feet, she wears flat tan leather strappy sandals.
      She wears a single thin gold chain necklace with a small round pendant, and small gold hoop earrings.

      Pose and Physique:
      She is leaning casually against a weathered stone balustrade, one hand resting on the railing and the other lightly touching the lapel of her open blazer.
      Her weight is shifted to one hip, creating a relaxed, editorial silhouette.
      She is looking directly into the camera with a calm, confident, soft expression.

      Environment and Background:
      She is standing on a sunlit terracotta tile terrace overlooking the Mediterranean Sea. The terrace has aged, warm-toned terracotta floor tiles in a square pattern.
      Behind her, the deep azure blue sea stretches to the horizon under a clear pale blue sky.
      To her right, there are lush green trailing bougainvillea vines with bright magenta flowers cascading over a whitewashed stone wall.
      The lighting is warm, natural golden-hour sunlight casting long, soft shadows and illuminating her skin with a warm glow.
    `,
    promptTemplate: `
      A professional high-fidelity editorial fashion portrait. She is wearing an oversized unstructured cream linen blazer with sleeves casually pushed up to just below the elbows, left open and unbuttoned. Underneath, a draped ivory silk sleeveless top with a classic neckline. Tailored high-waisted wide-leg cream linen pants with clean pressed front crease. Thin woven tan leather belt with a small matte gold rectangular buckle at the natural waist. Flat tan leather strappy sandals. Single thin gold chain necklace with a small round pendant, small gold hoop earrings. Leaning casually against a weathered stone balustrade, one hand on the railing, the other lightly touching the lapel of the open blazer. Relaxed editorial posture. Looking directly into the camera with a calm confident soft expression. Standing on a sunlit terracotta tile terrace overlooking the deep azure Mediterranean Sea, trailing bougainvillea vines with bright magenta flowers over a whitewashed stone wall, warm natural golden-hour sunlight with long soft shadows.
    `,
    fallbackUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800&auto=format&fit=crop',
    keyPrefix: 'riviera-linen-resort',
  },
  {
    title: 'Velvet Noir Penthouse',
    description: 'Luxurious evening portrait in a tailored black velvet evening bodice and satin high-waisted trousers, posed against floor-to-ceiling windows reflecting city lights at twilight.',
    seedPrompt: `
      A professional high-fidelity luxury editorial fashion portrait.

      Attire:
      She is wearing a tailored, structured black velvet sleeveless evening bodice with clean lines and classic tailoring. The top is fitted elegantly at the waist.
      Her trousers are high-waisted, straight-leg black satin trousers with a subtle sheen. They have a clean flat front with a single small concealed button closure and no visible pockets. The fabric drapes smoothly from hip to ankle.
      She wears pointed-toe black patent leather stiletto heels.
      A delicate layered gold chain necklace set sits at her neckline. She wears thin gold bangle bracelets stacked on her left wrist.

      Pose and Physique:
      She is standing three-quarter turned toward the camera, her left shoulder closest to the viewer. Her left hand is placed on her hip. Her right arm hangs relaxed at her side, holding a small black clutch purse loosely between her fingers.
      Her chin is slightly lifted, and she gazes directly into the camera with a composed, powerful expression.
      Her posture is straight, shoulders back, emphasizing a sophisticated high-fashion silhouette.

      Environment and Background:
      She is standing inside a modern luxury penthouse apartment. The floor is polished dark marble tile reflecting ambient light.
      Behind her are floor-to-ceiling glass windows revealing a blurred city skyline at blue-hour twilight. The city lights create warm orange and cool blue bokeh dots against the deep indigo sky.
      The interior is minimally furnished — a low-profile charcoal velvet sofa is partially visible to her left. Subtle warm recessed ceiling lighting casts soft, golden downward illumination on her face and shoulders.
      The overall mood is dark, luxurious, and cinematic.
    `,
    promptTemplate: `
      A professional high-fidelity luxury editorial fashion portrait. She is wearing a structured black velvet tailored sleeveless evening bodice and high-waisted straight-leg black satin trousers with subtle sheen, clean flat front with concealed button closure, fabric draping smoothly from hip to ankle. Pointed-toe black patent leather stiletto heels. Delicate layered gold chain necklace set and thin gold bangle bracelets stacked on the left wrist. Standing three-quarter turned toward camera, left hand placed on hip, right arm hanging relaxed holding a small black clutch purse loosely. Chin slightly lifted, gazing directly into camera with a composed powerful expression. Straight posture, shoulders back. Inside a modern luxury penthouse with polished dark marble tile floor. Floor-to-ceiling glass windows revealing a blurred city skyline at blue-hour twilight with warm orange and cool blue bokeh. Minimal interior with a low-profile charcoal velvet sofa partially visible. Subtle warm recessed ceiling lighting casting soft golden downward illumination. Dark luxurious cinematic mood.
    `,
    fallbackUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop',
    keyPrefix: 'velvet-noir-penthouse',
  },
];

async function run() {
  console.log('🚀 Wiping old templates and seeding 3 premium templates...');

  try {
    // 1. Wipe all existing templates
    console.log('🗑️  Purging all existing templates from database...');
    await db.delete(templates);
    console.log('✅ All old templates purged.');

    // 2. Ensure a category exists
    let categories = await db.select().from(templateCategories).limit(1);
    let categoryId = categories[0]?.id;

    if (!categoryId) {
      console.log('Creating default "Trending Fashion" category...');
      const [cat] = await db.insert(templateCategories).values({
        name: 'Trending Fashion',
        slug: 'trending-fashion',
        description: 'High-fashion editorial and urban lifestyle AI portraits',
        iconEmoji: '✨',
        displayOrder: 1,
        isActive: true,
      }).returning();
      categoryId = cat.id;
    }
    console.log(`Category ID: ${categoryId}`);

    // 3. Seed each template
    for (const item of TEMPLATES) {
      console.log(`\n--- Seeding: "${item.title}" ---`);

      let publicUrl = '';
      let imageBuffer: Buffer | null = null;

      if (aiClient) {
        try {
          console.log('Generating thumbnail with Gemini AI...');
          const response = await aiClient.models.generateContent({
            model: 'gemini-3.1-flash-image',
            contents: item.seedPrompt,
            config: { imageConfig: { aspectRatio: '1:1', numberOfImages: 1 } } as any,
          });
          const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
          if (part?.inlineData?.data) {
            imageBuffer = Buffer.from(part.inlineData.data, 'base64');
            console.log('[Gemini] Thumbnail generated.');
          }
        } catch (e: any) {
          console.warn(`[Gemini] Skipped: ${e.message || e}`);
        }
      }

      if (!imageBuffer) {
        try {
          console.log('Downloading stock fallback image...');
          const res = await fetch(item.fallbackUrl);
          imageBuffer = Buffer.from(await res.arrayBuffer());
        } catch (err: any) {
          console.error('Fallback download failed:', err.message);
        }
      }

      if (imageBuffer) {
        try {
          const key = `templates/${item.keyPrefix}-${Date.now()}.jpg`;
          publicUrl = await storageService.uploadFile(key, imageBuffer, 'image/jpeg');
          console.log(`Uploaded: ${publicUrl}`);
        } catch (e: any) {
          publicUrl = item.fallbackUrl;
        }
      } else {
        publicUrl = item.fallbackUrl;
      }

      const [inserted] = await db.insert(templates).values({
        title: item.title,
        description: item.description,
        thumbnailUrl: publicUrl,
        categoryId,
        faceSlots: ['Person A'],
        promptTemplate: item.promptTemplate.trim(),
        negativePrompt: 'blurry, low resolution, extra fingers, extra limbs, warped, cartoon, low quality, bad anatomy, distorted face, plastic skin, CGI',
        aspectRatio: '1:1',
        outputType: 'image',
        isActive: true,
      }).returning();

      console.log(`✅ Seeded: "${inserted.title}" (ID: ${inserted.id})`);
    }

    console.log('\n🎉 Done! 3 premium templates seeded successfully.');
  } catch (error: any) {
    console.error('❌ Failed:', error.message || error);
    process.exit(1);
  }

  process.exit(0);
}

run();
