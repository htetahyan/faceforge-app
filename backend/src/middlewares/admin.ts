import { MiddlewareHandler } from 'hono';
import { db } from '../db/client.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { AuthVariables } from './auth.ts';

export const adminGuard: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({ error: 'Unauthorized: Authentication required' }, 401);
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: 'Unauthorized: User not found' }, 401);
    }

    if (user.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    // User is an admin, proceed to next handler
    await next();
  } catch (err) {
    console.error('[Admin Guard Error]', err);
    return c.json({ error: 'Internal server error checking admin privileges' }, 500);
  }
};
