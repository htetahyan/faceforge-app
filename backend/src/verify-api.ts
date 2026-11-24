import { db } from './db/client.ts';
import { users, faceProfiles } from './db/schema.ts';
import { eq } from 'drizzle-orm';
import { passed, failed, testEmail, userId } from './tests/test-context.ts';
import { runAuthTests, runTokenAndPasswordTests } from './tests/auth.test.ts';
import { runFacesTests } from './tests/faces.test.ts';
import { runFcmTokenTests, runProfileDeletionTests } from './tests/profile.test.ts';
import { runPriorityQueueTests } from './tests/queue.test.ts';
import { runStudioE2ETests } from './tests/e2e-studio.test.ts';
import { runCleanupTests } from './tests/cleanup.test.ts';

async function runTests() {
  console.log('🧪 Starting programmatic API Route Verification (In-Memory Hono Runner)...');

  try {
    console.log(`\nUsing test email: ${testEmail}`);

    // Run suites sequentially
    await runAuthTests();
    await runFacesTests();
    await runFcmTokenTests();
    await runTokenAndPasswordTests();
    await runPriorityQueueTests();
    await runStudioE2ETests();
    await runProfileDeletionTests();
    await runCleanupTests();

    // Print Results
    console.log('\n==================================================');
    console.log(`📊 API Verification Results: ${passed} Passed, ${failed} Failed`);
    console.log('==================================================');

    // Clean up database records (if profile deletion tests failed or skipped)
    await db.delete(faceProfiles).where(eq(faceProfiles.userId, userId));
    await db.delete(users).where(eq(users.id, userId));

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 All in-memory route verification tests passed successfully!');
      process.exit(0);
    }

  } catch (err: any) {
    console.error('❌ Exception occurred during routes verification:', err);
    process.exit(1);
  }
}

// Run the verification
runTests();
export default runTests;
