import { db, pool } from '../db/client.ts';
import { users } from '../db/schema.ts';

async function resetTiers() {
  console.log('Resetting all users to FREE tier...');
  await db.update(users).set({
    subscriptionTier: 'free',
    subscriptionStatus: 'free',
    subscriptionPeriodEnd: null,
    generationsUsedThisPeriod: 0,
  });
  console.log('Successfully reset all users to FREE tier!');
  await pool.end();
}

resetTiers().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
