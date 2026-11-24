import { Hono } from 'hono';
import { db } from '../db/client.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { authGuard, AuthVariables } from '../middlewares/auth.ts';

const revenueCatRouter = new Hono<{ Variables: AuthVariables }>();

// 1. GET /api/revenuecat/ad-status
revenueCatRouter.get('/ad-status', authGuard, async (c) => {
  const userId = c.get('userId');
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const now = new Date();
    const lastReset = user.adCreditsLastReset ? new Date(user.adCreditsLastReset) : new Date(0);
    const isSameDay = now.getUTCFullYear() === lastReset.getUTCFullYear() &&
                      now.getUTCMonth() === lastReset.getUTCMonth() &&
                      now.getUTCDate() === lastReset.getUTCDate();

    const currentAdCount = isSameDay ? (user.adCreditsToday || 0) : 0;
    const maxDaily = 5;
    const remainingToday = Math.max(0, maxDaily - currentAdCount);

    return c.json({
      adCreditsToday: currentAdCount,
      maxDaily,
      remainingToday,
      canWatchAd: remainingToday > 0,
    });
  } catch (err) {
    console.error('Failed to query ad status:', err);
    return c.json({ error: 'Server error retrieving ad status' }, 500);
  }
});

// 2. POST /api/revenuecat/grant-ad-credit
revenueCatRouter.post('/grant-ad-credit', authGuard, async (c) => {
  const userId = c.get('userId');

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const now = new Date();
    const lastReset = user.adCreditsLastReset ? new Date(user.adCreditsLastReset) : new Date(0);
    const isSameDay = now.getUTCFullYear() === lastReset.getUTCFullYear() &&
                      now.getUTCMonth() === lastReset.getUTCMonth() &&
                      now.getUTCDate() === lastReset.getUTCDate();

    let currentAdCount = isSameDay ? (user.adCreditsToday || 0) : 0;
    const MAX_DAILY_ADS = 5;

    if (currentAdCount >= MAX_DAILY_ADS) {
      return c.json({
        error: 'Daily ad limit reached (5/5). You can watch more ads tomorrow.',
        code: 'DAILY_AD_LIMIT_REACHED',
        adCreditsToday: currentAdCount,
        maxDaily: MAX_DAILY_ADS,
        remainingToday: 0,
      }, 429);
    }

    const newAdCount = currentAdCount + 1;
    const currentUsage = user.generationsUsedThisPeriod;
    const newUsage = Math.max(0, currentUsage - 1);

    await db
      .update(users)
      .set({
        generationsUsedThisPeriod: newUsage,
        adCreditsToday: newAdCount,
        adCreditsLastReset: now,
      })
      .where(eq(users.id, userId));

    return c.json({
      success: true,
      message: 'Ad credit granted successfully! 1 generation added.',
      newUsage,
      adCreditsToday: newAdCount,
      maxDaily: MAX_DAILY_ADS,
      remainingToday: MAX_DAILY_ADS - newAdCount,
    });
  } catch (err) {
    console.error('Failed to grant ad credit:', err);
    return c.json({ error: 'Server error granting ad credit' }, 500);
  }
});

// 3. RevenueCat Server-to-Server Webhook handler
revenueCatRouter.post('/webhook', async (c) => {
  try {
    const body = await c.req.json();
    console.log('[RevenueCat Webhook] Payload received:', JSON.stringify(body, null, 2));

    const event = body.event;
    if (!event) {
      return c.json({ error: 'Missing event payload' }, 400);
    }

    const userId = event.app_user_id;
    const eventType = event.type;
    const entitlementId = event.entitlement_id;

    if (!userId) {
      console.warn('[RevenueCat Webhook] Event received with missing app_user_id');
      return c.json({ error: 'Missing app_user_id' }, 400);
    }

    console.log(`[RevenueCat Webhook] Processing ${eventType} for User: ${userId}, Entitlement: ${entitlementId}`);

    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL': {
        const tier = entitlementId === 'premium' ? 'premium' : 'pro';
        await db
          .update(users)
          .set({
            subscriptionTier: tier,
            subscriptionStatus: 'active',
            subscriptionPeriodEnd: event.expiration_at_ms 
              ? new Date(event.expiration_at_ms) 
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          })
          .where(eq(users.id, userId));
        console.log(`[RevenueCat Webhook] Updated User ${userId} to active entitlement: ${tier}`);
        break;
      }

      case 'CANCELLATION': {
        await db
          .update(users)
          .set({
            subscriptionStatus: 'canceling',
            subscriptionPeriodEnd: event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined,
          })
          .where(eq(users.id, userId));
        console.log(`[RevenueCat Webhook] User ${userId} canceled subscription auto-renew.`);
        break;
      }

      case 'EXPIRATION': {
        await db
          .update(users)
          .set({
            subscriptionTier: 'free',
            subscriptionStatus: 'free',
            subscriptionPeriodEnd: null,
          })
          .where(eq(users.id, userId));
        console.log(`[RevenueCat Webhook] Downgraded User ${userId} to free tier (subscription expired).`);
        break;
      }

      default:
        console.log(`[RevenueCat Webhook] Event type ${eventType} ignored.`);
        break;
    }

    return c.json({ success: true, message: 'Webhook processed successfully' });
  } catch (err: any) {
    console.error('[RevenueCat Webhook] Critical Error:', err);
    return c.json({ error: 'Server webhook parsing error', details: err.message }, 500);
  }
});

export default revenueCatRouter;
