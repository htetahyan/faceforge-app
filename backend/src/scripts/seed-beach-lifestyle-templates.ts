import 'dotenv/config';
import { db } from '../db/client.ts';
import { templates, templateCategories } from '../db/schema.ts';
import { eq, sql } from 'drizzle-orm';
import { generateAndUploadThumbnail } from './helpers/ai-thumbnail.ts';

interface TemplateSeed {
  title: string;
  categorySlug: string;
  categoryName: string;
  categoryEmoji: string;
  description: string;
  faceSlots: string[];
  promptTemplate: string;
  negativePrompt: string;
  previewUrl: string;
  isPremium: boolean;
  aspectRatio: string;
}

const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    title: 'Lofi Dusk Glow Portrait',
    categorySlug: 'trending',
    categoryName: 'Trending',
    categoryEmoji: '🔥',
    description: 'Realistic Signature Lofi Dusk Glow portrait with dark muted dusk/night background and glowing backlight.',
    faceSlots: ['face_1'],
    promptTemplate: `Transform the uploaded photo into a realistic Signature Lofi Dusk Glow portrait. Keep the subject’s exact face, natural expression, hairstyle, outfit, pose, body shape, and identity unchanged. Do not reshape the face, do not change the facial structure, and keep the person fully recognizable. Create a dark muted dusk/night background with faded black tones, soft shadows, and a dreamy low-light atmosphere. Add a strong white backlight behind the subject, creating a glowing rim around the hair, shoulders, arms, clothing edges, and full body outline. The glow should look like real camera light, not neon or fantasy. Use a direct but soft front flash to make the face and outfit visible, with warm peachy skin highlights, realistic skin texture, slight flash brightness, and natural shadows. Add soft bloom, gentle halation, mild haze, fine film grain, low-light CCD sensor noise, faded blacks, muted colors, shallow depth of field, and a nostalgic Instagram Y2K night-photo look. The final image should feel raw, aesthetic, cinematic, viral, and realistic like a real Lofi Dusk filter portrait.`,
    negativePrompt: `Avoid changing the face, different identity, face reshaping, changed eyes, changed nose, changed lips, fake beauty filter, over-smoothed skin, plastic skin, cartoon style, anime style, neon glow, fantasy aura, excessive brightness, extreme darkness, washed-out face, blurry face, distorted hands, extra fingers, missing fingers, bad anatomy, unrealistic body shape, oversaturated colors, fake background, watermark, text, logo, duplicate subject, low-quality details.`,
    previewUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    isPremium: true,
    aspectRatio: '1:1',
  },
  {
    title: 'Walking Near Waves — Natural Back Pose',
    categorySlug: 'beach-lifestyle',
    categoryName: 'Beach & Lifestyle',
    categoryEmoji: '🏖️',
    description: 'Walking slowly near the shoreline with clean white linen shirt and golden hour sunset light.',
    faceSlots: ['face_1'],
    promptTemplate: `Use the uploaded portrait only as an identity reference. The final boy must look like the same real person. Show the boy walking slowly near the shoreline, with his back mostly toward the camera and his face slightly turned to the side. The pose should feel candid, relaxed, and naturally clicked. Dress him in a clean white linen shirt, full sleeves slightly rolled, paired with beige relaxed trousers and simple sandals or barefoot beach styling. Keep the look modern, stylish, modest, and Pinterest-inspired. Use golden hour sunset light, soft waves, wet sand reflections, and a calm ocean background. Camera angle: full-body eye-level back-side shot. Camera: Sony A7IV, 50mm lens, natural depth of field, realistic colors, no over-editing.`,
    negativePrompt: `no text, no watermark, no logo, no distorted face, no extra limbs, no artificial body shape, no outfit inconsistency. Make the final image look naturally human-taken, candid, realistic, simple, softly aesthetic, and not overly edited or artificial. Preserve the same face identity exactly.`,
    previewUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop',
    isPremium: false,
    aspectRatio: '1:1',
  },
  {
    title: 'Sitting on Rock — Calm Beach Portrait',
    categorySlug: 'beach-lifestyle',
    categoryName: 'Beach & Lifestyle',
    categoryEmoji: '🏖️',
    description: 'Sitting naturally on a beach rock looking toward the ocean in a soft beige kurta-style shirt.',
    faceSlots: ['face_1'],
    promptTemplate: `Transform the uploaded boy portrait into a natural beach lifestyle photo, preserving the exact facial identity, hairstyle, skin tone, expression, and realistic details. Show the boy sitting naturally on a beach rock, one arm resting on his knee, looking toward the ocean with a calm thoughtful expression. The photo should feel like a real candid portrait. Dress him in a soft beige kurta-style shirt with full sleeves and straight off-white trousers. Keep the styling clean, modern, minimal, and softly South Asian / Indian-inspired. Use late afternoon soft light, gentle ocean blur, and natural shadows. Camera angle: mid-distance side-front angle. Camera: Canon EOS R6, 85mm lens, soft background blur, realistic skin texture.`,
    negativePrompt: `no heavy editing, no dramatic pose, no fake muscles, no distorted face, no watermark. Make the final image look naturally human-taken, candid, realistic, simple, softly aesthetic, and not overly edited or artificial. Preserve the same face identity exactly.`,
    previewUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop',
    isPremium: false,
    aspectRatio: '1:1',
  },
  {
    title: 'Coffee Cup Beach Morning — Simple Candid',
    categorySlug: 'beach-lifestyle',
    categoryName: 'Beach & Lifestyle',
    categoryEmoji: '🏖️',
    description: 'Standing near the beach holding a coffee cup in soft morning light with light blue cotton shirt.',
    faceSlots: ['face_1'],
    promptTemplate: `Transform the uploaded boy portrait into a simple natural beach morning portrait, preserving the exact face identity, hairstyle, skin tone, and natural expression. Show the boy standing near the beach holding a coffee cup, looking slightly away from the camera. The moment should feel casual, peaceful, and human-taken. Dress him in a light blue cotton shirt, full sleeves, paired with cream chinos and minimal styling. Keep the look clean, modern, Pinterest-style, and natural. Use soft morning light, pale blue sky, calm sea, and light sand background. Camera angle: waist-up eye-level portrait, slightly side-front. Camera: iPhone 15 Pro portrait mode, realistic depth blur, natural colors.`,
    negativePrompt: `no text, no logo, no artificial glow, no changed face, no extra fingers. Make the final image look naturally human-taken, candid, realistic, simple, softly aesthetic, and not overly edited or artificial. Preserve the same face identity exactly.`,
    previewUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop',
    isPremium: false,
    aspectRatio: '1:1',
  },
  {
    title: 'Peaceful Side Profile',
    categorySlug: 'beach-lifestyle',
    categoryName: 'Beach & Lifestyle',
    categoryEmoji: '🏖️',
    description: 'Standing near the shoreline looking at the ocean in a white full-sleeve linen shirt.',
    faceSlots: ['face_1'],
    promptTemplate: `Transform the uploaded boy portrait into a portrait-size beach side-profile photo, preserving the exact facial identity, skin tone, hairstyle, expression, and realistic human details. Show the boy standing near the shoreline and looking at the ocean, not directly at the camera. Keep the pose calm, masculine, simple, and naturally captured. Dress him in a white full-sleeve linen shirt with sand-colored trousers. The shirt can be slightly loose for a relaxed beach look. Keep styling minimal and classy. Use soft evening light, warm sky tones, and a clean beach background. Camera angle: side-profile mid to full-body shot. Camera: Sony A7C, 85mm lens, sharp subject, softly blurred background.`,
    negativePrompt: `no over-styled pose, no sunglasses covering identity, no text, no watermark, no face distortion. Make the final image look naturally human-taken, candid, realistic, simple, softly aesthetic, and not overly edited or artificial. Preserve the same face identity exactly.`,
    previewUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop',
    isPremium: true,
    aspectRatio: '1:1',
  },
  {
    title: 'Sitting on Sand — Relaxed Portrait',
    categorySlug: 'beach-lifestyle',
    categoryName: 'Beach & Lifestyle',
    categoryEmoji: '🏖️',
    description: 'Sitting on the sand with knees slightly bent in warm sunset lighting and cream casual kurta shirt.',
    faceSlots: ['face_1'],
    promptTemplate: `Transform the uploaded boy portrait into a natural beach sitting portrait, preserving the exact identity, hairstyle, skin tone, and realistic facial details. Show the boy sitting on the sand, knees slightly bent, one hand resting on the sand, looking relaxed and natural. The photo should feel like a real casual beach moment. Dress him in a cream casual kurta shirt with full sleeves and light beige trousers. Keep the outfit simple, modest, modern, and softly ethnic. Use warm sunset lighting, soft shadows, and blurred ocean in the background. Camera angle: eye-level mid shot, natural framing. Camera: Fujifilm X-T5, 56mm lens, natural colors, soft depth.`,
    negativePrompt: `no fake pose, no heavy filter, no logo, no distorted anatomy. Make the final image look naturally human-taken, candid, realistic, simple, softly aesthetic, and not overly edited or artificial. Preserve the same face identity exactly.`,
    previewUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop',
    isPremium: false,
    aspectRatio: '1:1',
  },
  {
    title: 'Walking Barefoot — Candid Beach Lifestyle',
    categorySlug: 'beach-lifestyle',
    categoryName: 'Beach & Lifestyle',
    categoryEmoji: '🏖️',
    description: 'Walking barefoot on wet sand during golden hour sunlight with light olive casual shirt.',
    faceSlots: ['face_1'],
    promptTemplate: `Transform the uploaded boy portrait into a natural full-body beach walking photo, preserving the exact face identity, hairstyle, skin tone, expression, and realistic human features. Show the boy walking barefoot on wet sand, looking slightly down with a relaxed expression. One hand can be in pocket, the other relaxed by his side. The pose should feel candid and effortless. Dress him in a light olive casual shirt, full sleeves rolled neatly, with off-white relaxed trousers. Keep styling modern, clean, simple, and Pinterest aesthetic. Use golden hour sunlight reflecting on the water and sand. Camera angle: full-body slight side-front angle. Camera: Sony A7III, 50mm lens, realistic beach tones, soft background blur.`,
    negativePrompt: `no text, no watermark, no unnatural face, no extra limbs, no over-edited body. Make the final image look naturally human-taken, candid, realistic, simple, softly aesthetic, and not overly edited or artificial. Preserve the same face identity exactly.`,
    previewUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=800&auto=format&fit=crop',
    isPremium: false,
    aspectRatio: '1:1',
  },
  {
    title: 'Holding Sunglasses — Modern Pinterest Look',
    categorySlug: 'beach-lifestyle',
    categoryName: 'Beach & Lifestyle',
    categoryEmoji: '🏖️',
    description: 'Holding sunglasses in one hand near the beach in soft sunset glow with white textured cotton shirt.',
    faceSlots: ['face_1'],
    promptTemplate: `Transform the uploaded boy portrait into a modern natural beach portrait, preserving the exact facial identity, hairstyle, skin tone, expression, and realistic features. Show the boy holding sunglasses in one hand, standing near the beach with a relaxed posture. He should not wear sunglasses on his face, so identity remains clear. His expression should be calm and confident. Dress him in a white textured cotton shirt, full sleeves, paired with khaki trousers. Keep the look simple, masculine, clean, and Pinterest-style. Use soft sunset glow, warm highlights, and beach background with gentle blur. Camera angle: knee-up eye-level portrait, slight front-side angle. Camera: Sony A7IV, 85mm lens, crisp face, soft background.`,
    negativePrompt: `no sunglasses covering eyes, no fake face, no watermark, no text, no over-glam look. Make the final image look naturally human-taken, candid, realistic, simple, softly aesthetic, and not overly edited or artificial. Preserve the same face identity exactly.`,
    previewUrl: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?q=80&w=800&auto=format&fit=crop',
    isPremium: true,
    aspectRatio: '1:1',
  },
  {
    title: 'Close-Up Wind Portrait — Clean Masculine Look',
    categorySlug: 'beach-lifestyle',
    categoryName: 'Beach & Lifestyle',
    categoryEmoji: '🏖️',
    description: 'Close-up beach portrait with hair moving slightly in the breeze and soft diffused beach light.',
    faceSlots: ['face_1'],
    promptTemplate: `Transform the uploaded boy portrait into a natural close-up beach portrait, preserving the exact facial identity, hairstyle, skin tone, expression, and realistic details. Show the boy in a clean close-up portrait, facing slightly toward the camera, with a soft natural expression. Hair should move slightly in the beach breeze. Keep the background simple and blurred. Dress him in a cream linen shirt with full sleeves and clean collar. Keep the look minimal, stylish, and natural. Use soft diffused beach light, natural skin texture, and subtle warm tones. Camera angle: close-up eye-level three-quarter angle. Camera: Canon EOS R6, 85mm lens, sharp face details, soft bokeh background.`,
    negativePrompt: `no over-smoothing, no face distortion, no logo, no text, no artificial glow. Make the final image look naturally human-taken, candid, realistic, simple, softly aesthetic, and not overly edited or artificial. Preserve the same face identity exactly.`,
    previewUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    isPremium: false,
    aspectRatio: '1:1',
  },
  {
    title: 'Wooden Deck Beach Shot — Clean Lifestyle',
    categorySlug: 'beach-lifestyle',
    categoryName: 'Beach & Lifestyle',
    categoryEmoji: '🏖️',
    description: 'Standing on a wooden beach deck or stairs in late afternoon sunlight with soft grey linen shirt.',
    faceSlots: ['face_1'],
    promptTemplate: `Transform the uploaded boy portrait into a natural beach lifestyle portrait, preserving the exact facial identity, hairstyle, skin tone, and realistic details. Show the boy standing on a wooden beach deck or stairs, one hand lightly touching the railing, looking toward the side. The pose should feel unforced and real. Dress him in a soft grey linen shirt, full sleeves, paired with beige trousers and simple clean footwear. Keep the look modern, minimal, and classy. Use late afternoon sunlight, soft shadows on the wooden deck, and ocean blur in the background. Camera angle: full-body eye-level shot, slight side angle. Camera: Canon EOS R5, 50mm lens, natural detail, soft depth.`,
    negativePrompt: `no studio look, no over-sharpening, no logo, no distorted hands. Make the final image look naturally human-taken, candid, realistic, simple, softly aesthetic, and not overly edited or artificial. Preserve the same face identity exactly.`,
    previewUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
    isPremium: false,
    aspectRatio: '1:1',
  },
  {
    title: 'Phone Candid — Real In-Between Moment',
    categorySlug: 'beach-lifestyle',
    categoryName: 'Beach & Lifestyle',
    categoryEmoji: '🏖️',
    description: 'Standing near the beach looking at phone in soft evening light as a natural in-between moment.',
    faceSlots: ['face_1'],
    promptTemplate: `Transform the uploaded boy portrait into a simple candid beach photo, preserving the exact identity, face shape, hairstyle, skin tone, and natural expression. Show the boy standing near the beach and looking at his phone, as if someone captured a natural in-between moment. Keep the pose relaxed and realistic. Dress him in a pastel beige shirt, full sleeves, with white trousers. Styling should be minimal, clean, modern, and natural. Use soft evening light, realistic outdoor shadows, and ocean blur in the background. Camera angle: mid-shot eye-level, slightly from the side. Camera: iPhone 15 Pro portrait mode, natural colors, human-taken feel.`,
    negativePrompt: `no fake phone screen text, no watermark, no face distortion, no extra fingers. Make the final image look naturally human-taken, candid, realistic, simple, softly aesthetic, and not overly edited or artificial. Preserve the same face identity exactly.`,
    previewUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop',
    isPremium: false,
    aspectRatio: '1:1',
  },
];

async function seedBeachLifestyleTemplates() {
  console.log('🏖️ Seeding 11 Beach & Lifestyle / Trending Templates with AI Preview Images...');

  await db.execute(sql.raw(`ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "is_premium" boolean DEFAULT false NOT NULL;`));

  const categoryMap: Record<string, string> = {};

  for (const item of TEMPLATE_SEEDS) {
    let catId = categoryMap[item.categorySlug];
    if (!catId) {
      let existingCat = await db.query.templateCategories.findFirst({
        where: eq(templateCategories.slug, item.categorySlug),
      });

      if (!existingCat) {
        const [newCat] = await db
          .insert(templateCategories)
          .values({
            name: item.categoryName,
            slug: item.categorySlug,
            iconEmoji: item.categoryEmoji,
            displayOrder: item.categorySlug === 'trending' ? 0 : 2,
          })
          .returning();
        existingCat = newCat;
      }
      catId = existingCat.id;
      categoryMap[item.categorySlug] = catId;
    }

    const existingTpl = await db.query.templates.findFirst({
      where: eq(templates.title, item.title),
    });

    const isUnsplash = !existingTpl || existingTpl.thumbnailUrl.includes('unsplash.com');
    const thumbnailUrl = isUnsplash
      ? await generateAndUploadThumbnail(item.title, item.promptTemplate, item.previewUrl)
      : existingTpl.thumbnailUrl;

    if (!existingTpl) {
      await db.insert(templates).values({
        categoryId: catId,
        title: item.title,
        description: item.description,
        faceSlots: item.faceSlots,
        promptTemplate: item.promptTemplate.trim(),
        negativePrompt: item.negativePrompt.trim(),
        thumbnailUrl,
        isPremium: item.isPremium,
        aspectRatio: item.aspectRatio,
        isActive: true,
      });
      console.log(`  └─ ✅ Added template: "${item.title}" (${item.isPremium ? 'PRO' : 'FREE'})`);
    } else {
      if (thumbnailUrl !== existingTpl.thumbnailUrl) {
        await db
          .update(templates)
          .set({ thumbnailUrl })
          .where(eq(templates.id, existingTpl.id));
        console.log(`  └─ 🔄 Updated "${item.title}" preview image with AI generated R2 URL.`);
      } else {
        console.log(`  └─ ℹ️ Template "${item.title}" already has R2 AI preview URL.`);
      }
    }
  }

  console.log('✅ 11 Beach & Lifestyle Templates seeded successfully!');
}

if (process.argv[1] && process.argv[1].includes('seed-beach-lifestyle-templates')) {
  seedBeachLifestyleTemplates().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export default seedBeachLifestyleTemplates;
