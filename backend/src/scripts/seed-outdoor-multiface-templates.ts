import 'dotenv/config';
import { db } from '../db/client.ts';
import { templates, templateCategories } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { generateAndUploadThumbnail } from './helpers/ai-thumbnail.ts';

/**
 * 5 High-Realism Outdoor & Multi-Face Lifestyle Templates
 * Inspired by authentic festival, travel, and social lifestyle photography.
 */
const OUTDOOR_MULTIFACE_TEMPLATES = [
  {
    title: 'Coachella Sunset Festival',
    description: 'Authentic golden hour festival moment — boho chic style, warm lens flare, and candid festival crowd atmosphere.',
    faceSlots: ['face_1', 'face_2'],
    seedPrompt: `
      Ultra-realistic candid 35mm film photograph of two friends at a sun-drenched outdoor music festival like Coachella during golden hour.
      Warm natural sunlight with soft lens flare and subtle dust particles floating in the air.
      The subjects are walking through a lively festival field, laughing naturally. Ferris wheel and palm trees softly blurred in the background.
      Wardrobe: Boho-chic festival fashion — fringe suede jacket, crochet top, layered silver necklaces, sun-kissed skin.
      Lighting: Direct warm golden hour backlight creating rim lighting around their hair, soft fill light.
      Style: Authentic, un-staged 35mm film aesthetic, true skin textures, rich color tones, realistic grain, not AI-perfect.
    `,
    promptTemplate: `
      Candid 35mm film festival photo of two friends at an outdoor music festival during golden hour. Warm natural backlight, dust particles, soft lens flare. Blurred ferris wheel and crowd in background. Wearing fringe jackets and crochet tops with silver jewelry. Natural laughter, genuine skin texture, 35mm film grain.
    `,
    previewUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    tags: ['festival', 'coachella', 'outdoor', 'multi-face', 'golden-hour'],
    isPremium: true,
  },
  {
    title: 'Rooftop Sunset Cocktails',
    description: 'Open-air Mediterranean rooftop lounge with golden sunset sky and refreshing drinks.',
    faceSlots: ['face_1', 'face_2'],
    seedPrompt: `
      Candid lifestyle portrait of two friends on a wooden rooftop terrace overlooking a coastal city at golden sunset.
      They are sitting at a low teak lounge table with ice-cold cocktails in hand, sharing a genuine laugh.
      Wardrobe: Casual summer luxury — breathable cream linen button-down shirt, tan halter top, subtle gold jewelry.
      Background: Softly blurred Mediterranean coastline, ocean horizon, and warm dusk sky in hues of amber and violet.
      Lighting: Natural soft golden hour glow reflecting off their faces, warm directional light, no artificial flash.
      Style: Modern Instagram lifestyle portrait, shallow depth of field, authentic candid energy, natural skin details.
    `,
    promptTemplate: `
      Candid lifestyle photo of two friends on a rooftop lounge terrace at sunset holding cocktails. Warm golden backlight, ocean skyline blurred in background. Wearing cream linen shirts and tan tops. Natural smiles, realistic skin highlights, soft depth of field.
    `,
    previewUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800&auto=format&fit=crop',
    tags: ['rooftop', 'sunset', 'drinks', 'multi-face', 'lifestyle'],
    isPremium: true,
  },
  {
    title: 'Campfire Acoustic Night',
    description: 'Cozy evening campfire jam in a pine forest — authentic ambient firelight and twilight sky.',
    faceSlots: ['face_1', 'face_2'],
    seedPrompt: `
      Atmospheric outdoor evening photo of two friends sitting on wooden logs around a crackling campfire in a pine forest at dusk.
      One person is tuning an acoustic guitar while the other warms their hands over the fire, smiling naturally.
      Wardrobe: Rustic outdoor wear — vintage plaid flannel shirt, dark denim jacket, knitted beanie.
      Background: Tall pine trees silhouetted against a deep twilight blue sky with glowing orange embers floating from the fire.
      Lighting: Warm amber firelight illuminating their faces from below, contrasting with cool blue ambient night light.
      Style: Authentic documentary lifestyle photography, natural noise texture, cinematic fire reflections in eyes.
    `,
    promptTemplate: `
      Atmospheric campfire photo of two friends in a pine forest at dusk. Warm flame light illuminating faces from below, acoustic guitar, dark blue twilight sky. Flannel shirts and denim jackets. Real fire embers, un-staged cozy outdoor aesthetic.
    `,
    previewUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=800&auto=format&fit=crop',
    tags: ['campfire', 'outdoors', 'music', 'multi-face', 'night'],
    isPremium: false,
  },
  {
    title: 'Amalfi Coast Yacht Sailing',
    description: 'Golden hour ocean breeze on a wooden sailboat deck off dramatic Mediterranean cliffs.',
    faceSlots: ['face_1', 'face_2'],
    seedPrompt: `
      Sun-drenched outdoor lifestyle photograph of two people on the wooden deck of a yacht sailing along coastal cliffs.
      They are leaning against the boat railing, ocean spray around them, enjoying the sea breeze at golden hour.
      Wardrobe: Italian coastal aesthetic — white linen shirt unbuttoned at collar, nautical striped top, sunglasses tucked into collar.
      Background: Deep blue sea with sparkling golden sun glints, dramatic rocky cliffs in the soft background.
      Lighting: Direct bright golden sunlight bouncing off the water, creating natural catchlights and warm skin tones.
      Style: High-end travel lifestyle photography, candid movement, crisp natural details, vivid organic color grade.
    `,
    promptTemplate: `
      Sun-drenched sailing photo of two friends on a yacht deck at golden hour. Ocean water sparkling, coastal cliffs in background. White linen shirts, ocean breeze in hair, candid smiles. Natural water reflections, bright organic colors.
    `,
    previewUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
    tags: ['yacht', 'sailing', 'travel', 'multi-face', 'ocean'],
    isPremium: true,
  },
  {
    title: 'Tokyo Neon Street Market',
    description: 'Vibrant outdoor night market stroll with ambient neon signs and food stall steam.',
    faceSlots: ['face_1', 'face_2'],
    seedPrompt: `
      Moody urban night photograph of two friends walking through a bustling outdoor street food market in Tokyo.
      They are sharing street food skewers, laughing candidly as they walk past glowing paper lanterns and food stalls.
      Wardrobe: Modern urban streetwear — oversized black bomber jacket, Japanese denim, minimalist sneakers.
      Background: Neon signs in cyan, magenta, and amber reflecting off wet pavement, soft steam rising from food stalls.
      Lighting: Ambient neon and lantern illumination creating rich contrast and cinematic reflections on skin.
      Style: Authentic street photography aesthetic, natural ISO film grain, shallow depth of field, real urban night vibe.
    `,
    promptTemplate: `
      Urban night street photo of two friends in a Tokyo night market. Neon signs and paper lanterns, steam rising from stalls, wet pavement reflections. Oversized bomber jackets, street food, natural candid smiles. Cinematic night grain.
    `,
    previewUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop',
    tags: ['street', 'night', 'tokyo', 'multi-face', 'urban'],
    isPremium: false,
  },
];

async function seedOutdoorTemplates() {
  console.log('🌲 Seeding 5 Outdoor & Multi-Face Templates...');

  // Ensure "Events & Festival" category exists
  let eventCategory = await db.query.templateCategories.findFirst({
    where: eq(templateCategories.slug, 'events-festival'),
  });

  if (!eventCategory) {
    const [newCat] = await db
      .insert(templateCategories)
      .values({
        name: 'Events & Festivals',
        slug: 'events-festival',
        iconEmoji: '⛺',
        displayOrder: 1,
      })
      .returning();
    eventCategory = newCat;
  }

  for (const tplData of OUTDOOR_MULTIFACE_TEMPLATES) {
    const existing = await db.query.templates.findFirst({
      where: eq(templates.title, tplData.title),
    });

    const isUnsplash = !existing || existing.thumbnailUrl.includes('unsplash.com');
    const thumbnailUrl = isUnsplash
      ? await generateAndUploadThumbnail(tplData.title, tplData.promptTemplate, tplData.previewUrl)
      : existing.thumbnailUrl;

    if (!existing) {
      await db.insert(templates).values({
        categoryId: eventCategory.id,
        title: tplData.title,
        description: tplData.description,
        faceSlots: tplData.faceSlots,
        promptTemplate: tplData.promptTemplate.trim(),
        thumbnailUrl,
        isPremium: tplData.isPremium,
        isActive: true,
      });
      console.log(`  └─ Added template: "${tplData.title}"`);
    } else {
      if (thumbnailUrl !== existing.thumbnailUrl) {
        await db
          .update(templates)
          .set({ thumbnailUrl })
          .where(eq(templates.id, existing.id));
        console.log(`  └─ 🔄 Updated "${tplData.title}" preview image with AI generated R2 URL.`);
      } else {
        console.log(`  └─ ℹ️ Template "${tplData.title}" already has R2 AI preview URL.`);
      }
    }
  }

  console.log('✅ 5 Outdoor & Multi-Face Templates seeded successfully!');
}

if (process.argv[1] && process.argv[1].includes('seed-outdoor-multiface-templates')) {
  seedOutdoorTemplates().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export default seedOutdoorTemplates;
