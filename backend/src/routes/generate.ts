import { Hono } from 'hono';
import taskRouter from './generate/task.ts';
import webhookRouter from './generate/webhook.ts';

const generateRouter = new Hono();

// Mount sub-routers
generateRouter.route('/', taskRouter);
generateRouter.route('/', webhookRouter);

export default generateRouter;
