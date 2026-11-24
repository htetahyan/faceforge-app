import { Hono } from 'hono';
import { db } from '../../db/client.ts';
import { users } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { authGuard, AuthVariables } from '../../middlewares/auth.ts';
import { signJWT } from '../../services/auth.ts';
import { getCleanUser } from './utils.ts';

const sessionRouter = new Hono<{ Variables: AuthVariables }>();

sessionRouter.get('/me', authGuard, async (c) => {
  const userId = c.get('userId');

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      user: getCleanUser(user),
    });
  } catch (err) {
    console.error('Verify session failed:', err);
    return c.json({ error: 'Server error retrieving current session' }, 500);
  }
});

sessionRouter.post('/refresh', authGuard, async (c) => {
  const userId = c.get('userId');

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const token = await signJWT(user.id, user.email!);

    return c.json({
      user: getCleanUser(user),
      token,
    });
  } catch (err) {
    console.error('Token refresh failed:', err);
    return c.json({ error: 'Server error refreshing session token' }, 500);
  }
});

export default sessionRouter;
