import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { generationTasks, templates, faceProfiles, users } from '../../db/schema.ts';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { authGuard, AuthVariables } from '../../middlewares/auth.ts';
import queueService from '../../services/queue.ts';
import storageService from '../../services/storage.ts';

const taskRouter = new Hono<{ Variables: AuthVariables }>();

taskRouter.get('/', authGuard, async (c) => {
  const userId = c.get('userId');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    const whereClause = eq(generationTasks.userId, userId);

    const list = await db.query.generationTasks.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (gt, { desc }) => [desc(gt.createdAt)],
      with: {
        template: {
          columns: {
            title: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    const [totalCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(generationTasks)
      .where(whereClause);

    const total = totalCountResult?.count || 0;

    return c.json({
      tasks: list,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + list.length < total,
      },
    });
  } catch (err) {
    console.error('Failed to query generation tasks:', err);
    return c.json({ error: 'Server error retrieving generation tasks' }, 500);
  }
});

const triggerGenerationSchema = z.object({
  templateId: z.string().optional().nullable(),
  faceMappings: z.record(z.string(), z.string()),
  customPrompt: z.string().max(2000).optional().nullable(),
});

taskRouter.post('/', authGuard, zValidator('json', triggerGenerationSchema, (result, c) => {
  if (!result.success) {
    console.error('[Generate Validation Error]:', JSON.stringify(result.error.format(), null, 2));
    return c.json({ error: 'Invalid generation request parameters', details: result.error.format() }, 400);
  }
}), async (c) => {
  const userId = c.get('userId');
  const body = c.req.valid('json');
  const templateId = body.templateId || undefined;
  const customPrompt = body.customPrompt || undefined;
  const faceMappings = body.faceMappings;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    if (!user.emailVerified) {
      return c.json({
        error: 'Forbidden: Email verification required before generating images.',
        code: 'EMAIL_UNVERIFIED',
      }, 403);
    }

    const tier = user.subscriptionTier;
    const usage = user.generationsUsedThisPeriod;
    let limit = 5;

    if (tier === 'pro') {
      limit = 50;
    }

    if (tier !== 'premium' && usage >= limit) {
      return c.json({
        error: `Generations limit reached (${usage}/${limit}). Please upgrade your subscription for more generations.`,
        code: 'LIMIT_EXCEEDED',
        tier,
        usage,
        limit,
      }, 402);
    }

    let template: any = null;
    if (templateId) {
      template = await db.query.templates.findFirst({
        where: eq(templates.id, templateId),
      });
      if (template) {
        const requiredSlots = template.faceSlots;
        const suppliedSlots = Object.keys(faceMappings);
        const missingSlots = requiredSlots.filter((slot: string) => !suppliedSlots.includes(slot));
        if (missingSlots.length > 0) {
          return c.json({ error: `Missing face mappings for slots: ${missingSlots.join(', ')}` }, 400);
        }
      }
    }

    const faceIds = Object.values(faceMappings);
    const userFaces = await db.query.faceProfiles.findMany({
      where: and(
        inArray(faceProfiles.id, faceIds),
        eq(faceProfiles.userId, userId)
      ),
    });

    if (userFaces.length !== faceIds.length) {
      return c.json({ error: 'One or more selected face profiles are invalid or access denied' }, 403);
    }

    const [task] = await db
      .insert(generationTasks)
      .values({
        userId,
        templateId,
        status: 'pending',
        faceMappings,
        customPrompt,
      })
      .returning();

    await db
      .update(users)
      .set({ generationsUsedThisPeriod: usage + 1 })
      .where(eq(users.id, userId));

    if (templateId && template) {
      await db
        .update(templates)
        .set({ usageCount: template.usageCount + 1 })
        .where(eq(templates.id, templateId));
    }

    const result = await queueService.enqueueTask(task.id);

    return c.json({
      taskId: task.id,
      status: result.status,
      queuePosition: result.queuePosition,
      message: result.status === 'processing'
        ? 'AI generation started successfully'
        : `Task queued. Current position: ${result.queuePosition}`,
    }, 202);

  } catch (err) {
    console.error('Failed to trigger generation:', err);
    return c.json({ error: 'Server error triggering AI image generation' }, 500);
  }
});

const taskStatusParamSchema = z.object({
  id: z.string().uuid(),
});

taskRouter.get('/tasks/:id/status', authGuard, zValidator('param', taskStatusParamSchema), async (c) => {
  const userId = c.get('userId');
  const { id: taskId } = c.req.valid('param');

  try {
    const task = await db.query.generationTasks.findFirst({
      where: and(
        eq(generationTasks.id, taskId),
        eq(generationTasks.userId, userId)
      ),
      with: {
        template: {
          columns: {
            title: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    if (!task) {
      return c.json({ error: 'Task not found or unauthorized' }, 404);
    }

    return c.json({
      id: task.id,
      status: task.status,
      outputUrl: task.outputUrl,
      error: task.error,
      template: {
        title: task.template?.title || 'AI Studio Portrait',
        thumbnailUrl: task.template?.thumbnailUrl || '',
      },
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  } catch (err) {
    console.error(`Failed to fetch task ${taskId} status:`, err);
    return c.json({ error: 'Server error retrieving task status' }, 500);
  }
});

export default taskRouter;
