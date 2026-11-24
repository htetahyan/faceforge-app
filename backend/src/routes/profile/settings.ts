import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { users, generationTasks } from '../../db/schema.ts';
import { eq, sql } from 'drizzle-orm';
import { authGuard, AuthVariables } from '../../middlewares/auth.ts';

const settingsRouter = new Hono<{ Variables: AuthVariables }>();

settingsRouter.use('*', authGuard);

settingsRouter.get('/', async (c) => {
  const userId = c.get('userId');

  try {
    const [row] = await db
      .select({
        user: users,
        totalGenerations: sql<number>`count(${generationTasks.id})`,
        completed: sql<number>`sum(case when ${generationTasks.status} = 'completed' then 1 else 0 end)`,
        failed: sql<number>`sum(case when ${generationTasks.status} = 'failed' then 1 else 0 end)`,
      })
      .from(users)
      .leftJoin(generationTasks, eq(generationTasks.userId, users.id))
      .where(eq(users.id, userId))
      .groupBy(users.id);

    if (!row || !row.user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const { user } = row;
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPeriodEnd: user.subscriptionPeriodEnd,
        generationsUsedThisPeriod: user.generationsUsedThisPeriod,
        createdAt: user.createdAt,
      },
      stats: {
        totalGenerations: Number(row.totalGenerations) || 0,
        completed: Number(row.completed) || 0,
        failed: Number(row.failed) || 0,
      },
    });
  } catch (err) {
    console.error('Failed to retrieve profile:', err);
    return c.json({ error: 'Server error retrieving profile' }, 500);
  }
});

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional(),
});

settingsRouter.put('/', zValidator('json', updateProfileSchema), async (c) => {
  const userId = c.get('userId');
  const payload = c.req.valid('json');

  try {
    const [updatedUser] = await db
      .update(users)
      .set(payload)
      .where(eq(users.id, userId))
      .returning();

    return c.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        avatarUrl: updatedUser.avatarUrl,
      },
    });
  } catch (err) {
    console.error('Failed to update profile:', err);
    return c.json({ error: 'Server error updating profile' }, 500);
  }
});

const fcmTokenSchema = z.object({
  fcmToken: z.string().optional(),
  pushToken: z.string().optional(),
});

settingsRouter.post('/fcm-token', zValidator('json', fcmTokenSchema), async (c) => {
  const userId = c.get('userId');
  const { fcmToken, pushToken } = c.req.valid('json');
  const token = fcmToken || pushToken;

  if (!token) {
    return c.json({ error: 'Token is required' }, 400);
  }

  try {
    await db.update(users).set({ fcmToken: token }).where(eq(users.id, userId));
    return c.json({ success: true, message: 'Push token registered successfully' });
  } catch (err) {
    console.error('Failed to register push token:', err);
    return c.json({ error: 'Server error saving device token' }, 500);
  }
});

settingsRouter.post('/push-token', zValidator('json', fcmTokenSchema), async (c) => {
  const userId = c.get('userId');
  const { fcmToken, pushToken } = c.req.valid('json');
  const token = fcmToken || pushToken;

  if (!token) {
    return c.json({ error: 'Token is required' }, 400);
  }

  try {
    await db.update(users).set({ fcmToken: token }).where(eq(users.id, userId));
    return c.json({ success: true, message: 'Push token registered successfully' });
  } catch (err) {
    console.error('Failed to register push token:', err);
    return c.json({ error: 'Server error saving device token' }, 500);
  }
});

const syncSubscriptionSchema = z.object({
  tier: z.enum(['free', 'pro', 'premium']),
  rcUserId: z.string().optional(),
});

settingsRouter.post('/sync-subscription', zValidator('json', syncSubscriptionSchema), async (c) => {
  const userId = c.get('userId');
  const { tier, rcUserId } = c.req.valid('json');

  try {
    const status = 'active';
    await db
      .update(users)
      .set({
        subscriptionTier: tier,
        subscriptionStatus: status,
        subscriptionPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .where(eq(users.id, userId));

    console.log(`[RC Sync] Locally updated user ${userId} to tier: ${tier} (rcUserId: ${rcUserId})`);
    return c.json({ success: true, message: 'Subscription synced successfully' });
  } catch (err) {
    console.error('Failed to sync subscription:', err);
    return c.json({ error: 'Server error syncing subscription state' }, 500);
  }
});

export default settingsRouter;
