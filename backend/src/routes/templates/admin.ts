import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { templates } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { authGuard, AuthVariables } from '../../middlewares/auth.ts';
import { adminGuard } from '../../middlewares/admin.ts';
import storageService from '../../services/storage.ts';

const adminTemplatesRouter = new Hono<{ Variables: AuthVariables }>();

// Request a presigned URL for uploading template thumbnails
adminTemplatesRouter.post('/upload-url', authGuard, adminGuard, async (c) => {
  try {
    const filename = `templates/${crypto.randomUUID()}.jpg`;
    const uploadUrl = await storageService.getPresignedPutUrl(filename, 'image/jpeg');
    
    // In local development with fallback, the upload URL from getPresignedPutUrl 
    // will just be our local proxy. The public URL will be the domain + filename
    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN || 'http://localhost:3005/public'}/${filename}`;

    return c.json({ uploadUrl, publicUrl, key: filename });
  } catch (err) {
    console.error('Failed to generate upload URL for template:', err);
    return c.json({ error: 'Server error generating upload URL' }, 500);
  }
});

export const templateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  thumbnailUrl: z.string().url(),
  faceSlots: z.array(z.string().min(1)).min(1),
  promptTemplate: z.string().min(1),
  negativePrompt: z.string().optional().nullable(),
  aspectRatio: z.string().default('1:1'),
  outputType: z.enum(['image', 'video']).default('image'),
  isActive: z.boolean().default(true),
});

adminTemplatesRouter.post('/', authGuard, adminGuard, zValidator('json', templateSchema), async (c) => {
  const payload = c.req.valid('json');

  try {
    const [newTemplate] = await db
      .insert(templates)
      .values(payload)
      .returning();

    return c.json({ template: newTemplate }, 201);
  } catch (err) {
    console.error('Failed to create template:', err);
    return c.json({ error: 'Server error creating template' }, 500);
  }
});

adminTemplatesRouter.put('/:id', authGuard, adminGuard, zValidator('json', templateSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const payload = c.req.valid('json');

  try {
    const existing = await db.query.templates.findFirst({
      where: eq(templates.id, id),
    });

    if (!existing) {
      return c.json({ error: 'Template not found' }, 404);
    }

    const [updatedTemplate] = await db
      .update(templates)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, id))
      .returning();

    return c.json({ template: updatedTemplate });
  } catch (err) {
    console.error(`Failed to update template ${id}:`, err);
    return c.json({ error: 'Server error updating template' }, 500);
  }
});

adminTemplatesRouter.delete('/:id', authGuard, adminGuard, async (c) => {
  const id = c.req.param('id');

  try {
    const existing = await db.query.templates.findFirst({
      where: eq(templates.id, id),
    });

    if (!existing) {
      return c.json({ error: 'Template not found' }, 404);
    }

    await db.delete(templates).where(eq(templates.id, id));

    return c.json({ success: true, message: 'Template deleted successfully' });
  } catch (err) {
    console.error(`Failed to delete template ${id}:`, err);
    return c.json({ error: 'Server error deleting template' }, 500);
  }
});

export default adminTemplatesRouter;
