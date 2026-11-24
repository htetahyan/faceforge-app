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

const SEED_PROMPT = `
  A professional high-fidelity fashion studio model portrait of a young woman with a fair complexion.
  
  Hair: She has straight, light brown hair parted down the middle, falling just past her shoulders with shorter framing layers.
  Face: She is looking directly into the camera with a neutral, soft expression, light grey-blue eyes, defined eyebrows, a slender nose, and light pink lips. Her makeup is extremely minimal and natural.
  
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
`;

const TEMPLATE_PROMPT_TEMPLATE = `
  A professional high-fidelity fashion portrait of a young woman with a fair complexion, straight light brown hair parted down the middle falling just past her shoulders with shorter face-framing layers. She has light-colored eyes, defined eyebrows, a slender nose, and light pink lips. She is looking directly into the camera. She is standing with her body angled slightly toward the left, left arm raised, bent at the elbow, with her hand resting behind her neck, pulling her hair slightly back, right hand tucked into her pocket. She is standing on a paved walkway of reddish-brown rectangular bricks in front of a flat light grey wall of architectural panels with covered pillars on the left.
`;

async function run() {
  console.log('🚀 Starting Calvin Custom Template seeding script...');

  try {
    // 1. Fetch first available category to link template
    console.log('Fetching template categories from database...');
    const categories = await db.select().from(templateCategories).limit(1);
    const categoryId = categories[0]?.id || null;
    console.log(`Linked Category ID: ${categoryId}`);

    // 2. Generate initial mockup thumbnail using Gemini
    let publicUrl = 'https://pub-9698b0199a0b4da4bfd731baa7f1771b.r2.dev/templates/calvin-urban-chic-1783775063538.jpg';
    try {
      console.log('Generating high-quality template thumbnail using Gemini-3.1...');
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: SEED_PROMPT,
        config: {
          imageConfig: {
            aspectRatio: '1:1',
            numberOfImages: 1
          }
        } as any
      });

      const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (part && part.inlineData && part.inlineData.data) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        
        // 3. Upload thumbnail to storage
        console.log('Uploading thumbnail image to cloud storage container...');
        const key = `templates/calvin-urban-chic-${Date.now()}.jpg`;
        publicUrl = await storageService.uploadFile(key, buffer, 'image/jpeg');
        console.log(`Uploaded Thumbnail URL: ${publicUrl}`);
      } else {
        console.log('⚠️ No generated image data returned, using high-fidelity pre-uploaded R2 fallback...');
      }
    } catch (e: any) {
      console.log(`⚠️ Gemini API rate-limited or error: ${e.message || e}. Falling back to pre-uploaded R2 asset: ${publicUrl}`);
    }

    // 4. Save template in database
    console.log('Saving new template record into PostgreSQL database...');
    const inserted = await db.insert(templates).values({
      title: 'Urban Chic Streetwear',
      description: 'High-fashion street portrait featuring a chic black mock-neck long-sleeve top, designer cargo trousers, and an urban brick walkway.',
      thumbnailUrl: publicUrl,
      categoryId: categoryId,
      faceSlots: ['Subject A'],
      promptTemplate: TEMPLATE_PROMPT_TEMPLATE,
      negativePrompt: 'blurry, low resolution, extra fingers, warped, cartoon, low quality',
      aspectRatio: '1:1',
      outputType: 'image',
      isActive: true,
    }).returning();

    console.log('✅ Success! Calvin Urban Chic template is fully seeded!');
    console.log(JSON.stringify(inserted[0], null, 2));

  } catch (error: any) {
    console.error('❌ Failed to seed template:', error.message || error);
    process.exit(1);
  }

  process.exit(0);
}

run();
