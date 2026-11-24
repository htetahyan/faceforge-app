import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { templates, userFavorites } from '../../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { authGuard, AuthVariables } from '../../middlewares/auth.ts';

const favoritesRouter = new Hono<{ Variables: AuthVariables }>();

favoritesRouter.get('/favorites', authGuard, async (c) => {
  const userId = c.get('userId');

  try {
    const favorites = await db.query.userFavorites.findMany({
      where: eq(userFavorites.userId, userId),
      orderBy: [desc(userFavorites.createdAt)],
      with: {
        template: {
          with: {
            category: {
              columns: {
                name: true,
                slug: true,
                iconEmoji: true,
              },
            },
          },
        },
      },
    });

    const list = favorites.map((f) => f.template).filter(Boolean);
    return c.json({ templates: list });
  } catch (err) {
    console.error('Failed to query favorite templates:', err);
    return c.json({ error: 'Server error retrieving favorite templates' }, 500);
  }
});

const favoriteParamSchema = z.object({
  id: z.string().uuid(),
});

favoritesRouter.post('/:id/favorite', authGuard, zValidator('param', favoriteParamSchema), async (c) => {
  const userId = c.get('userId');
  const { id: templateId } = c.req.valid('param');

  try {
    // Verify template exists
    const template = await db.query.templates.findFirst({
      where: eq(templates.id, templateId),
    });

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Check if already favorited
    const existingFav = await db.query.userFavorites.findFirst({
      where: and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.templateId, templateId)
      ),
    });

    if (existingFav) {
      // Remove favorite
      await db
        .delete(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, userId),
            eq(userFavorites.templateId, templateId)
          )
        );

      return c.json({ favorited: false, message: 'Removed from favorites' });
    } else {
      // Add favorite
      await db
        .insert(userFavorites)
        .values({
          userId,
          templateId,
        });

      return c.json({ favorited: true, message: 'Added to favorites' });
    }
  } catch (err) {
    console.error('Failed to toggle template favorite:', err);
    return c.json({ error: 'Server error toggling template favorite' }, 500);
  }
});

export default favoritesRouter;
