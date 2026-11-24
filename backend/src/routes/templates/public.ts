import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { templates } from '../../db/schema.ts';
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm';

const publicTemplatesRouter = new Hono();

publicTemplatesRouter.get('/', async (c) => {
  const categoryId = c.req.query('categoryId');
  const search = c.req.query('q');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');
  const popular = c.req.query('popular') === 'true';

  try {
    const conditions = [eq(templates.isActive, true)];

    if (categoryId) {
      conditions.push(eq(templates.categoryId, categoryId));
    }

    if (search) {
      conditions.push(
        or(
          ilike(templates.title, `%${search}%`),
          ilike(templates.description, `%${search}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    const list = await db.query.templates.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: popular ? [desc(templates.usageCount)] : [desc(templates.createdAt)],
      with: {
        category: {
          columns: {
            name: true,
            slug: true,
            iconEmoji: true,
          },
        },
      },
    });

    const [totalCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(templates)
      .where(whereClause);

    const total = totalCountResult?.count || 0;

    return c.json({
      templates: list,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + list.length < total,
      },
    });
  } catch (err) {
    console.error('Failed to query templates:', err);
    return c.json({ error: 'Server error retrieving templates' }, 500);
  }
});

const publicTemplateParamSchema = z.object({
  id: z.string().uuid(),
});

publicTemplatesRouter.get('/:id', zValidator('param', publicTemplateParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  try {
    const template = await db.query.templates.findFirst({
      where: eq(templates.id, id),
      with: {
        category: {
          columns: {
            name: true,
            slug: true,
            iconEmoji: true,
          },
        },
      },
    });

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    return c.json({ template });
  } catch (err) {
    console.error(`Failed to find template ${id}:`, err);
    return c.json({ error: 'Server error retrieving template' }, 500);
  }
});

export default publicTemplatesRouter;
