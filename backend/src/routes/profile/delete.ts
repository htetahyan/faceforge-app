import { Hono } from 'hono';
import { db } from '../../db/client.ts';
import { users } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { authGuard, AuthVariables } from '../../middlewares/auth.ts';

const deleteRouter = new Hono<{ Variables: AuthVariables }>();

deleteRouter.use('*', authGuard);

deleteRouter.delete('/', async (c) => {
  const userId = c.get('userId');

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // 1. Cancel Stripe subscription if active
    if (user.stripeSubscriptionId && user.stripeCustomerId) {
      try {
        const Stripe = (await import('stripe')).default;
        const stripeApiKey = process.env.STRIPE_API_KEY || '';
        if (stripeApiKey && !stripeApiKey.startsWith('placeholder')) {
          const stripe = new Stripe(stripeApiKey, { apiVersion: '2023-10-16' as any });
          await stripe.subscriptions.cancel(user.stripeSubscriptionId);
          console.log(`[GDPR Delete] Canceled Stripe subscription ${user.stripeSubscriptionId} for user ${userId}`);
        }
      } catch (stripeErr) {
        console.error(`[GDPR Delete] Failed to cancel Stripe subscription:`, stripeErr);
      }
    }

    // 2. Delete face files from R2/local storage
    const { faceProfiles: faceProfilesTable } = await import('../../db/schema.ts');
    const { default: storageService } = await import('../../services/storage.ts');
    const faces = await db.query.faceProfiles.findMany({
      where: eq(faceProfilesTable.userId, userId),
    });
    for (const face of faces) {
      if (face.r2Keys && Array.isArray(face.r2Keys)) {
        for (const r2Key of face.r2Keys) {
          storageService.deleteFile(r2Key).catch((err: any) => {
            console.error(`[GDPR Delete] Failed to delete face R2 file ${r2Key}:`, err);
          });
        }
      }
    }

    // 3. Delete user record (cascades to face_profiles, generation_tasks, favorites)
    await db.delete(users).where(eq(users.id, userId));

    console.log(`[GDPR Delete] Permanently deleted account for user ID ${userId} (${user.email})`);
    return c.json({ success: true, message: 'Your account and all associated data have been permanently deleted.' });
  } catch (err) {
    console.error('Account deletion failed:', err);
    return c.json({ error: 'Server error deleting account data' }, 500);
  }
});

export default deleteRouter;
