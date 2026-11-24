import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/client.ts';
import { templateCategories } from '../db/schema.ts';
import { eq, asc } from 'drizzle-orm';
import { authGuard, AuthVariables } from '../middlewares/auth.ts';
import { adminGuard } from '../middlewares/admin.ts';

const categoriesRouter = new Hono<{ Variables: AuthVariables }>();

/**
 * 1. GET /api/categories - Public explore listing
 */
categoriesRouter.get('/', async (c) => {
  try {
    const list = await db.query.templateCategories.findMany({
      where: eq(templateCategories.isActive, true),
      orderBy: [asc(templateCategories.displayOrder)],
    });

    return c.json({ categories: list });
  } catch (err) {
    console.error('Failed to query categories:', err);
    return c.json({ error: 'Server error retrieving categories' }, 500);
  }
});

/**
 * Zod Schemas for CRUD operations
 */
const categorySchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(300).optional(),
  iconEmoji: z.string().max(4).optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

/**
 * 2. POST /api/categories - Create Category (Admin Only)
 */
categoriesRouter.post('/', authGuard, adminGuard, zValidator('json', categorySchema), async (c) => {
  const payload = c.req.valid('json');

  try {
    // Check if slug or name exists
    const existing = await db.query.templateCategories.findFirst({
      where: eq(templateCategories.slug, payload.slug),
    });

    if (existing) {
      return c.json({ error: `Category slug "${payload.slug}" is already taken` }, 400);
    }

    const [newCategory] = await db
      .insert(templateCategories)
      .values(payload)
      .returning();

    return c.json({ category: newCategory }, 201);
  } catch (err: any) {
    console.error('Failed to create category:', err);
    return c.json({ error: err.message || 'Server error creating category' }, 500);
  }
});

const categoryParamSchema = z.object({
  id: z.string().uuid(),
});
/**
 * 3. PUT /api/categories/:id - Update Category (Admin Only)
 */
categoriesRouter.put('/:id', authGuard, adminGuard, zValidator('param', categoryParamSchema), zValidator('json', categorySchema.partial()), async (c) => {
  const { id } = c.req.valid('param');
  const payload = c.req.valid('json');

  try {
    const existing = await db.query.templateCategories.findFirst({
      where: eq(templateCategories.id, id),
    });

    if (!existing) {
      return c.json({ error: 'Category not found' }, 404);
    }

    const [updatedCategory] = await db
      .update(templateCategories)
      .set(payload)
      .where(eq(templateCategories.id, id))
      .returning();

    return c.json({ category: updatedCategory });
  } catch (err: any) {
    console.error(`Failed to update category ${id}:`, err);
    return c.json({ error: err.message || 'Server error updating category' }, 500);
  }
});

/**
 * 4. DELETE /api/categories/:id - Delete Category (Admin Only)
 * Sets isActive to false (soft delete) to preserve templates mapping, or completely deletes if requested
 */
categoriesRouter.delete('/:id', authGuard, adminGuard, zValidator('param', categoryParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  const hardDelete = c.req.query('hard') === 'true';

  try {
    const existing = await db.query.templateCategories.findFirst({
      where: eq(templateCategories.id, id),
    });

    if (!existing) {
      return c.json({ error: 'Category not found' }, 404);
    }

    if (hardDelete) {
      await db.delete(templateCategories).where(eq(templateCategories.id, id));
      return c.json({ success: true, message: 'Category deleted permanently' });
    } else {
      const [updated] = await db
        .update(templateCategories)
        .set({ isActive: false })
        .where(eq(templateCategories.id, id))
        .returning();
      return c.json({ success: true, message: 'Category soft-deleted', category: updated });
    }
  } catch (err: any) {
    console.error(`Failed to delete category ${id}:`, err);
    return c.json({ error: err.message || 'Server error deleting category' }, 500);
  }
});

export default categoriesRouter;
