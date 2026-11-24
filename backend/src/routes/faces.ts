import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/client.ts';
import { faceProfiles } from '../db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';
import { authGuard, AuthVariables } from '../middlewares/auth.ts';
import storageService from '../services/storage.ts';

const facesRouter = new Hono<{ Variables: AuthVariables }>();

// All routes in this router require JWT Authentication
facesRouter.use('*', authGuard);

/**
 * 1. Get List of Saved Face Profiles for the User
 */
facesRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    const whereClause = eq(faceProfiles.userId, userId);

    const list = await db
      .select({
        id: faceProfiles.id,
        userId: faceProfiles.userId,
        name: faceProfiles.name,
        r2Keys: faceProfiles.r2Keys,
        createdAt: faceProfiles.createdAt,
      })
      .from(faceProfiles)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${faceProfiles.createdAt} DESC`);

    const facesWithUrls = await Promise.all(
      list.map(async (face) => {
        const viewUrls = await storageService.getPresignedGetUrls(face.r2Keys);
        return {
          ...face,
          viewUrls,
          viewUrl: viewUrls[0] || '',
        };
      })
    );

    const [totalCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(faceProfiles)
      .where(whereClause);

    const total = totalCountResult?.count || 0;

    return c.json({
      faces: facesWithUrls,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + list.length < total,
      },
    });
  } catch (err) {
    console.error('Failed to query face profiles:', err);
    return c.json({ error: 'Server error retrieving face profiles' }, 500);
  }
});

/**
 * 2. Request Presigned R2 PUT URLs to Upload New Faces (up to 3)
 */
const requestUploadSchema = z.object({
  name: z.string().min(1).max(50),
  count: z.number().min(1).max(3).default(1),
});

facesRouter.post('/upload-url', zValidator('json', requestUploadSchema), async (c) => {
  const userId = c.get('userId');
  const { name, count } = c.req.valid('json');

  try {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(faceProfiles)
      .where(eq(faceProfiles.userId, userId));

    const currentCount = countResult?.count || 0;
    if (currentCount >= 5) {
      return c.json({
        error: 'Limit reached: You can store a maximum of 5 face profiles.',
        code: 'FACE_LIMIT_EXCEEDED',
      }, 400);
    }

    const faceId = crypto.randomUUID();
    const slots = [];

    for (let i = 0; i < count; i++) {
      const r2Key = `users/${userId}/faces/${faceId}_${i}.jpg`;
      const uploadUrl = await storageService.getPresignedPutUrl(r2Key, 'image/jpeg');
      slots.push({ r2Key, uploadUrl });
    }

    return c.json({
      id: faceId,
      name,
      slots,
    });
  } catch (err) {
    console.error('Failed to generate upload URLs:', err);
    return c.json({ error: 'Server error preparing upload slots' }, 500);
  }
});

/**
 * 3. Confirm Successful File Upload and Create DB Record
 */
const confirmUploadSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  r2Keys: z.array(z.string()).min(1).max(3),
});

facesRouter.post('/confirm', zValidator('json', confirmUploadSchema), async (c) => {
  const userId = c.get('userId');
  const { id, name, r2Keys } = c.req.valid('json');

  try {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(faceProfiles)
      .where(eq(faceProfiles.userId, userId));

    const currentCount = countResult?.count || 0;
    if (currentCount >= 5) {
      return c.json({
        error: 'Limit reached: You can store a maximum of 5 face profiles.',
        code: 'FACE_LIMIT_EXCEEDED',
      }, 400);
    }

    const [newFace] = await db
      .insert(faceProfiles)
      .values({
        id,
        userId,
        name,
        r2Keys,
      })
      .returning();

    const viewUrls = await Promise.all(
      newFace.r2Keys.map(async (key) => storageService.getPresignedGetUrl(key))
    );

    return c.json({
      face: {
        ...newFace,
        viewUrls,
        viewUrl: viewUrls[0] || '',
      },
    }, 201);
  } catch (err) {
    console.error('Failed to save face profile:', err);
    return c.json({ error: 'Server error creating face profile record' }, 500);
  }
});

const deleteFaceParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * 4. Delete a Face Profile
 */
facesRouter.delete('/:id', zValidator('param', deleteFaceParamSchema), async (c) => {
  const userId = c.get('userId');
  const { id: faceId } = c.req.valid('param');

  try {
    const [deletedFace] = await db
      .delete(faceProfiles)
      .where(and(eq(faceProfiles.id, faceId), eq(faceProfiles.userId, userId)))
      .returning();

    if (!deletedFace) {
      return c.json({ error: 'Face profile not found or access denied' }, 404);
    }

    // Delete all stored image files from storage bucket
    deletedFace.r2Keys.forEach((key) => {
      storageService.deleteFile(key).catch((err) => {
        console.error(`[Faces] Failed to delete file ${key} for face ${faceId}:`, err);
      });
    });

    return c.json({ success: true, deleted: deletedFace });
  } catch (err) {
    console.error('Failed to delete face profile:', err);
    return c.json({ error: 'Server error deleting face profile' }, 500);
  }
});

export default facesRouter;
