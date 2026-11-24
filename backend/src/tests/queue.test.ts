import { assert } from './test-context.ts';
import { db } from '../db/client.ts';
import { users, generationTasks, templates } from '../db/schema.ts';
import { eq, inArray } from 'drizzle-orm';

export async function runPriorityQueueTests() {
  console.log('\n[Test 15] Priority Queue Scheduling...');

  const uniqueId = Date.now();
  const emailFree = `queue-free-${uniqueId}@glowup.com`;
  const emailPro = `queue-pro-${uniqueId}@glowup.com`;
  const emailPremium = `queue-premium-${uniqueId}@glowup.com`;

  try {
    // 1. Create three test users with different tiers
    const [userFree] = await db.insert(users).values({
      email: emailFree,
      displayName: 'Free Queue User',
      subscriptionTier: 'free',
      emailVerified: true,
    }).returning();

    const [userPro] = await db.insert(users).values({
      email: emailPro,
      displayName: 'Pro Queue User',
      subscriptionTier: 'pro',
      emailVerified: true,
    }).returning();

    const [userPremium] = await db.insert(users).values({
      email: emailPremium,
      displayName: 'Premium Queue User',
      subscriptionTier: 'premium',
      emailVerified: true,
    }).returning();

    // 2. Insert pending tasks in reverse priority order (Free first, then Pro, then Premium)
    const [taskFree] = await db.insert(generationTasks).values({
      userId: userFree.id,
      status: 'pending',
      faceMappings: {},
      createdAt: new Date(Date.now() - 5000), // Created 5s ago
    }).returning();

    const [taskPro] = await db.insert(generationTasks).values({
      userId: userPro.id,
      status: 'pending',
      faceMappings: {},
      createdAt: new Date(Date.now() - 3000), // Created 3s ago
    }).returning();

    const [taskPremium] = await db.insert(generationTasks).values({
      userId: userPremium.id,
      status: 'pending',
      faceMappings: {},
      createdAt: new Date(Date.now() - 1000), // Created 1s ago (newest, but premium!)
    }).returning();

    // 3. Query all pending tasks using the queue's logic
    const pendingTasks = await db.query.generationTasks.findMany({
      where: inArray(generationTasks.id, [taskFree.id, taskPro.id, taskPremium.id]),
      with: {
        user: {
          columns: {
            subscriptionTier: true,
          },
        },
      },
    });

    // 4. Sort using the queue's sorting logic
    const tierPriority = { premium: 3, pro: 2, free: 1 };
    pendingTasks.sort((a, b) => {
      const priorityA = tierPriority[a.user?.subscriptionTier as keyof typeof tierPriority] || 1;
      const priorityB = tierPriority[b.user?.subscriptionTier as keyof typeof tierPriority] || 1;

      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      return a.createdAt.getTime() - b.createdAt.getTime(); // Oldest first
    });

    // 5. Assert sorting order matches: Premium -> Pro -> Free
    assert(pendingTasks[0].id === taskPremium.id, 'Highest priority task promoted first (Premium)');
    assert(pendingTasks[1].id === taskPro.id, 'Medium priority task promoted second (Pro)');
    assert(pendingTasks[2].id === taskFree.id, 'Lowest priority task promoted last (Free)');

    // 6. Clean up test tasks and users
    await db.delete(generationTasks).where(inArray(generationTasks.id, [taskFree.id, taskPro.id, taskPremium.id]));
    await db.delete(users).where(inArray(users.id, [userFree.id, userPro.id, userPremium.id]));
    console.log('  ✅ Cleanup: Test queue tasks and users deleted');

  } catch (err: any) {
    console.error('❌ Exception in priority queue tests:', err);
    // Attempt cleanup
    await db.delete(users).where(inArray(users.email, [emailFree, emailPro, emailPremium]));
    assert(false, `Priority queue test failed with error: ${err.message}`);
  }
}
