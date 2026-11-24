import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { generationTasks, users } from '../../db/schema.ts';
import { eq, sql } from 'drizzle-orm';
import queueService from '../../services/queue.ts';
import pushService from '../../services/push.ts';

function sanitizeErrorForClient(errStr?: string): string | null {
  if (!errStr) return null;
  const lower = errStr.toLowerCase();
  if (lower.includes('invalid_argument') || lower.includes('invalid argument') || lower.includes('bad request') || lower.includes('400')) {
    return 'Image generation encountered an issue with the style or parameters. Please try again.';
  }
  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('quota') || lower.includes('503') || lower.includes('unavailable') || lower.includes('deadline') || lower.includes('timeout') || lower.includes('fetch failed')) {
    return 'AI server is currently busy. Please try again in a moment.';
  }
  if (lower.includes('safety') || lower.includes('blocked') || lower.includes('policy') || lower.includes('harmful')) {
    return 'Generation was paused due to safety guidelines. Please try a different photo or prompt.';
  }
  if (errStr.startsWith('{') || errStr.includes('"error"') || errStr.includes('"code"') || errStr.includes('googleapis') || errStr.includes('GeminiAI')) {
    return 'Image generation failed. Please try again.';
  }
  return errStr;
}

const webhookRouter = new Hono();

const webhookPayloadSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(['completed', 'failed']),
  outputUrl: z.string().url().optional(),
  error: z.string().optional(),
});

webhookRouter.post('/webhook', zValidator('json', webhookPayloadSchema), async (c) => {
  const secretParam = c.req.query('secret');
  const expectedSecret = process.env.WEBHOOK_SECRET;
  if (!expectedSecret) {
    throw new Error('WEBHOOK_SECRET environment variable is required');
  }

  if (!secretParam || secretParam !== expectedSecret) {
    return c.json({ error: 'Forbidden: Invalid or missing webhook secret' }, 403);
  }

  const { taskId, status, outputUrl, error } = c.req.valid('json');
  console.log(`[Webhook] Received update for task ${taskId}. Status: ${status}`);

  try {
    const task = await db.query.generationTasks.findFirst({
      where: eq(generationTasks.id, taskId),
      with: {
        user: true,
        template: {
          columns: {
            title: true,
          },
        },
      },
    });

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    const safeError = sanitizeErrorForClient(error);

    await db
      .update(generationTasks)
      .set({
        status,
        outputUrl: outputUrl || null,
        error: safeError,
        updatedAt: new Date(),
      })
      .where(eq(generationTasks.id, taskId));

    if (status === 'failed') {
      console.log(`[Webhook] Rolling back generation credit for user ${task.userId} due to failed task ${taskId}`);
      await db
        .update(users)
        .set({
          generationsUsedThisPeriod: sql`GREATEST(${users.generationsUsedThisPeriod} - 1, 0)`,
        })
        .where(eq(users.id, task.userId));
    }

    // Send push notification to user in background if fcmToken is present
    if (task.user?.fcmToken) {
      const templateTitle = task.template?.title || 'AI Studio Portrait';
      const pushTitle = status === 'completed' ? '✨ Portrait Ready!' : '⚠️ Generation Failed';
      const pushBody = status === 'completed'
        ? `Your AI portrait for "${templateTitle}" has successfully generated!`
        : `We couldn't generate your portrait for "${templateTitle}". Your credit has been refunded.`;

      pushService.sendPushNotification({
        to: task.user.fcmToken,
        title: pushTitle,
        body: pushBody,
        data: {
          taskId: task.id,
          status,
          ...(outputUrl && { outputUrl }),
        },
      }).catch((err) => {
        console.error(`[Webhook Push Error] Failed to send push to user ${task.userId}:`, err);
      });
    }

    queueService.processNext().catch((err) => {
      console.error(`[Webhook] Error triggering next queue tick:`, err);
    });

    return c.json({ success: true, message: `Task ${taskId} updated successfully` });
  } catch (err) {
    console.error(`Failed to update task ${taskId} in webhook:`, err);
    return c.json({ error: 'Server error writing task result' }, 500);
  }
});

export default webhookRouter;
