import { Hono } from 'hono';
import { db } from '../../db/client.ts';
import { generationTasks } from '../../db/schema.ts';
import { eq, sql, desc } from 'drizzle-orm';
import { authGuard, AuthVariables } from '../../middlewares/auth.ts';

const historyRouter = new Hono<{ Variables: AuthVariables }>();

historyRouter.use('*', authGuard);

historyRouter.get('/history', async (c) => {
  const userId = c.get('userId');
  const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    const list = await db.query.generationTasks.findMany({
      where: eq(generationTasks.userId, userId),
      limit,
      offset,
      orderBy: [desc(generationTasks.createdAt)],
      with: {
        template: {
          columns: {
            title: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(generationTasks)
      .where(eq(generationTasks.userId, userId));

    const total = totalResult?.count || 0;

    return c.json({
      history: list,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + list.length < total,
      },
    });
  } catch (err) {
    console.error('Failed to query profile history:', err);
    return c.json({ error: 'Server error retrieving generation history' }, 500);
  }
});

export default historyRouter;
