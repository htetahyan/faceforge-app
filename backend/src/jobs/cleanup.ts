import { db } from '../db/client.ts';
import { generationTasks } from '../db/schema.ts';
import { eq, and, lte } from 'drizzle-orm';
import storageService from '../services/storage.ts';

/**
 * Cleanup job that deletes completed generation outputs older than 30 days
 * to save storage space and respect privacy boundaries.
 */
export async function runCleanupJob(): Promise<number> {
  console.log('⏰ Starting GlowUp 30-day AI generation files cleanup job...');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    // 1. Find all completed generation tasks created more than 30 days ago
    const oldTasks = await db.query.generationTasks.findMany({
      where: and(
        eq(generationTasks.status, 'completed'),
        lte(generationTasks.createdAt, thirtyDaysAgo)
      ),
    });

    console.log(`[Cleanup Job] Found ${oldTasks.length} completed tasks older than 30 days.`);

    let deletedCount = 0;

    // 2. Iterate and delete files + database records
    for (const task of oldTasks) {
      if (task.outputUrl) {
        // Extract R2 Key from public URL
        // Example outputUrl: http://localhost:3000/public/outputs/task-uuid.jpg -> key: outputs/task-uuid.jpg
        // Example outputUrl: https://cdn.glowup.com/outputs/task-uuid.jpg -> key: outputs/task-uuid.jpg
        let key = '';
        if (task.outputUrl.includes('/public/')) {
          key = task.outputUrl.split('/public/')[1];
        } else {
          const match = task.outputUrl.match(/outputs\/[a-f0-9-]+\.jpg/);
          if (match) {
            key = match[0];
          }
        }

        if (key) {
          console.log(`[Cleanup Job] Deleting image file for task ${task.id} (key: ${key})...`);
          await storageService.deleteFile(key);
        }
      }

      // 3. Delete database record to keep database tidy
      await db.delete(generationTasks).where(eq(generationTasks.id, task.id));
      deletedCount++;
    }

    console.log(`✅ Cleanup Job completed successfully. Cleaned up ${deletedCount} files & database records.`);
    return deletedCount;
  } catch (err) {
    console.error('❌ Cleanup Job failed:', err);
    throw err;
  }
}

// Support running the cleanup script directly via CLI
if (process.argv[1] && process.argv[1].endsWith('cleanup.ts')) {
  runCleanupJob()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
