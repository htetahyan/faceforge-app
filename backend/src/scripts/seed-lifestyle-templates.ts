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

/**
 * 5 new genuine Instagram-inspired lifestyle templates.
 * 
 * Key design rules applied from research:
 * 1. Gender-neutral prompts — uses "The subject" / "They" / "The person" so the 
 *    AI does NOT force gendered clothing on the inserted face.
 * 2. Genuine IG lifestyle feel — not overly staged magazine editorial; 
 *    candid-adjacent poses, real locations, natural light.
 * 3. Diverse style categories: café culture, golden hour beach, rooftop sunset, 
 *    cozy autumn walk, gym/activewear (popular IG niches).
 */
const NEW_TEMPLATES = [
  {
    title: 'Golden Hour Rooftop Hang',
    description: 'Candid golden hour portrait on a sun-drenched city rooftop — classic IG aesthetic with warm bokeh skyline.',
    seedPrompt: `
      A natural lifestyle Instagram portrait photograph. Shot on a city rooftop terrace during golden hour.
      
      The subject is leaning casually against a weathered concrete ledge, arms resting loosely, looking slightly off-camera with a relaxed, soft smile.
      
      Clothing: relaxed-fit light wash denim jeans, a simple fitted white crew-neck cotton tee slightly tucked in at the front. White clean sneakers.
      
      Background: Blurred warm-toned city skyline, rooftop solar panels and water towers softly out of focus. The sky is golden amber and soft pink. 
      
      Lighting: Direct warm golden-hour backlight creating a rim-light glow around the subject, front lit by a natural golden reflector fill. No harsh shadows.
      
      Style: Candid, genuine, not posed. Shallow depth of field. The vibe is effortless cool — like a photo a friend took on their phone but impeccably well-shot.
      Cinematic warm tones. Natural skin texture.
    `,
    promptTemplate: `
      A natural lifestyle Instagram portrait. The subject is leaning casually against a weathered concrete rooftop ledge, arms resting loosely, looking slightly off-camera with a relaxed soft smile. They are wearing relaxed-fit light wash denim jeans, a simple fitted white crew-neck cotton tee slightly tucked at the front, and clean white sneakers. Blurred warm-toned city skyline behind them, water towers and rooftop details softly out of focus. Golden amber and soft pink sky. Warm golden-hour backlight creating a rim-light glow, filled from the front with natural soft golden light. No harsh shadows. Candid and effortless. Shallow depth of field. Cinematic warm tones. Natural skin texture.
    `,
    fallbackUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop',
    keyPrefix: 'golden-hour-rooftop',
  },
  {
    title: 'Café Morning Aesthetic',
    description: 'Cozy morning café lifestyle portrait — latte art, soft window light, minimal wardrobe. The "coffee date" IG staple.',
    seedPrompt: `
      A warm, cozy lifestyle Instagram portrait photograph taken inside a minimalist café.
      
      The subject is sitting at a small round marble café table, hands wrapped around a white ceramic mug with latte art on top. They are looking down at the mug with a calm, content half-smile, then looking up naturally toward the window light.
      
      Clothing: Oversized caramel-brown knit sweater with a relaxed ribbed collar. Dark straight-leg jeans or trousers visible below. Simple small gold jewelry. 
      
      Background: Large café window letting in soft diffused morning light. Out-of-focus barista counter, hanging Edison bulbs, and abstract minimalist wall art in the background. Warm earthy café interior tones — cream, terracotta, sage green.
      
      Lighting: Beautiful, soft, directional window natural light falling across the subject's face and hands. No flash. Film grain texture. Warm color grading.
      
      Style: Authentic, un-staged lifestyle. Like an organic influencer "morning routine" shot. Genuine and approachable.
    `,
    promptTemplate: `
      A warm cozy lifestyle Instagram portrait inside a minimalist café. The subject is sitting at a small round marble table, hands wrapped around a white ceramic mug with latte art, looking content with a calm half-smile. They are wearing an oversized caramel-brown knit ribbed sweater, dark straight-leg trousers, and small gold jewelry. Large café window behind them casting soft diffused morning natural light across their face and hands. Out-of-focus barista counter, hanging Edison bulbs, and abstract wall art in warm earthy tones — cream, terracotta, sage green. No flash. Film grain texture. Warm color grading. Authentic un-staged lifestyle feel.
    `,
    fallbackUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=800&auto=format&fit=crop',
    keyPrefix: 'cafe-morning-aesthetic',
  },
  {
    title: 'Sunset Beach Walk',
    description: 'Barefoot beach walk portrait at golden hour — sun-kissed skin, breezy linen, crashing waves. The ultimate summer IG vibe.',
    seedPrompt: `
      A natural outdoor lifestyle Instagram portrait photograph taken on a beach at sunset.
      
      The subject is walking slowly along the shoreline at low tide, barefoot, shoes held loosely in one hand. They are looking back over one shoulder toward the camera with an effortless, carefree smile.
      
      Clothing: Loose-fitting cream or off-white linen wide-leg trousers with a natural roll at the ankle. A fitted ribbed tan or terracotta sleeveless top. The clothing is gender-neutral and suitable for warm beach weather.
      
      Background: Soft waves gently lapping the shore behind them. The wet sand reflects the vivid warm sunset colors — amber, rose gold, and deep orange. The horizon glows brilliantly. Small foamy surf at their feet.
      
      Lighting: Intense warm sunset backlighting creating a luminous glow and rim light around the silhouette. Their face is warmly illuminated from the soft reflective light bouncing off the wet sand. Motion blur on the waves.
      
      Style: Genuine, carefree, summer lifestyle. Not posed. Natural movement captured mid-walk.
    `,
    promptTemplate: `
      A natural outdoor lifestyle Instagram portrait on a beach at golden hour sunset. The subject is walking along the shoreline barefoot, shoes held loosely in one hand, looking back over one shoulder toward the camera with an effortless carefree smile. They are wearing loose cream linen wide-leg trousers rolled at the ankle and a fitted ribbed terracotta sleeveless top. Soft waves lapping the shore behind them. The wet sand reflects vivid amber, rose gold, and deep orange sunset hues. Intense warm sunset backlighting creating a luminous glow and rim light around the silhouette. Face warmly illuminated by soft light bouncing off the wet sand. Motion blur on the waves. Carefree summer lifestyle feel. Natural movement. Not posed.
    `,
    fallbackUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
    keyPrefix: 'sunset-beach-walk',
  },
  {
    title: 'Autumn Park Stroll',
    description: 'Cozy autumn walk portrait among fallen leaves — warm oversized coat, scarf, and golden foliage. Timeless IG seasonal content.',
    seedPrompt: `
      A natural outdoor lifestyle Instagram portrait taken in a city park in autumn.
      
      The subject is walking on a leaf-covered path through the park, hands tucked into coat pockets, looking straight into the camera with a warm genuine smile.
      
      Clothing: An oversized long camel wool coat slightly open, worn over a chunky cream knit turtleneck sweater. Dark fitted straight-leg trousers or jeans. Brown ankle boots or suede Chelsea boots. A plaid scarf in warm tones (rust, olive, cream) loosely wrapped.
      
      Background: Tall trees with vibrant amber, rust, and golden-yellow autumn foliage. Fallen leaves carpeting the ground in rich warm tones. A blurred park pathway stretches into the distance. Soft bokeh light filtering through the tree canopy above.
      
      Lighting: Soft overcast afternoon light with golden patches of filtered sunlight breaking through the canopy. Warm autumn color palette throughout. Film-like texture and depth.
      
      Style: Genuine, seasonal, lifestyle. Not overly posed. Natural midstride captured energy. The quintessential autumn IG content.
    `,
    promptTemplate: `
      A natural outdoor lifestyle Instagram portrait in a city park in autumn. The subject is walking on a leaf-covered path, hands tucked into coat pockets, looking directly into the camera with a warm genuine smile. They are wearing an oversized long camel wool coat over a chunky cream knit turtleneck sweater, dark fitted straight-leg trousers, brown suede Chelsea boots, and a plaid scarf in rust, olive, and cream loosely wrapped. Tall trees with vibrant amber and golden-yellow autumn foliage behind them. Fallen leaves carpeting the ground. Blurred park pathway stretching into the distance. Soft bokeh light filtering through the tree canopy. Soft overcast afternoon light with warm golden patches. Film-like texture. Genuine seasonal lifestyle feel.
    `,
    fallbackUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=800&auto=format&fit=crop',
    keyPrefix: 'autumn-park-stroll',
  },
  {
    title: 'Studio Gym Activewear',
    description: 'Clean gym studio activewear portrait — athletic lifestyle, natural post-workout glow, minimal background. Top-performing IG niche.',
    seedPrompt: `
      A clean athletic lifestyle Instagram portrait taken inside a modern minimalist gym studio.
      
      The subject is standing in a confident relaxed stance, one hand resting on their hip, looking straight into the camera with a natural, confident, post-workout expression — not overly flexed or serious.
      
      Clothing: High-quality fitted athletic wear appropriate for their body — form-fitting athletic shorts or leggings and a matching athletic tank top or fitted sports tee. Neutral tones: black, slate grey, or dusty mauve. Clean white athletic trainers or gym shoes.
      
      Background: Clean, minimal gym studio with large white concrete walls, a single industrial pendant light above, rubber flooring visible. Optionally a squat rack or weightlifting equipment subtly blurred in the far background.
      
      Lighting: Clean, bright even studio lighting — no harsh shadows. Slightly elevated key light giving natural skin glow. Crisp and fresh aesthetic.
      
      Style: Genuine fitness lifestyle content. Natural post-workout glow, not over-edited. Confident and approachable. Like a real person's gym photo, elevated.
    `,
    promptTemplate: `
      A clean athletic lifestyle Instagram portrait inside a modern minimalist gym studio. The subject is standing in a confident relaxed stance, one hand on their hip, looking directly into the camera with a natural confident post-workout expression. They are wearing high-quality fitted athletic activewear — form-fitting shorts or leggings with a matching athletic tank top or sports tee in neutral tones (black, slate grey, or dusty mauve) and clean white athletic trainers. Clean minimal gym studio behind them — large white concrete walls, industrial pendant light above, rubber flooring. Gym equipment subtly blurred in the far background. Clean bright even studio lighting, no harsh shadows, slightly elevated key light giving natural skin glow. Crisp fresh aesthetic. Genuine fitness lifestyle content. Natural post-workout glow. Confident and approachable.
    `,
    fallbackUrl: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=800&auto=format&fit=crop',
    keyPrefix: 'studio-gym-activewear',
  },
];

async function run() {
  console.log('🚀 Adding 5 new lifestyle IG templates...');

  try {
    // Ensure a category exists
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

    // Seed each template
    for (const item of NEW_TEMPLATES) {
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
          console.warn('Upload failed, using fallback URL:', e.message);
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
        negativePrompt: 'blurry, low resolution, extra fingers, extra limbs, warped, cartoon, low quality, bad anatomy, distorted face, plastic skin, CGI, cross-dressing, gender mismatch, wrong gender clothing',
        aspectRatio: '1:1',
        outputType: 'image',
        isActive: true,
      }).returning();

      console.log(`✅ Seeded: "${inserted.title}" (ID: ${inserted.id})`);
    }

    console.log('\n🎉 Done! 5 lifestyle IG templates added successfully.');
  } catch (error: any) {
    console.error('❌ Failed:', error.message || error);
    process.exit(1);
  }

  process.exit(0);
}

run();
