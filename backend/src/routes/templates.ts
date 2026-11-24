import { Hono } from 'hono';
import publicTemplatesRouter from './templates/public.ts';
import favoritesRouter from './templates/favorites.ts';
import adminTemplatesRouter from './templates/admin.ts';

const templatesRouter = new Hono();

// Mount sub-routers
templatesRouter.route('/', publicTemplatesRouter);
templatesRouter.route('/', favoritesRouter);
templatesRouter.route('/', adminTemplatesRouter);

export default templatesRouter;
