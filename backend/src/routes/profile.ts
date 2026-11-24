import { Hono } from 'hono';
import settingsRouter from './profile/settings.ts';
import historyRouter from './profile/history.ts';
import deleteRouter from './profile/delete.ts';

const profileRouter = new Hono();

// Mount sub-routers
profileRouter.route('/', settingsRouter);
profileRouter.route('/', historyRouter);
profileRouter.route('/', deleteRouter);

export default profileRouter;
