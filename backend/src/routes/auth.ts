import { Hono } from 'hono';
import registerRouter from './auth/register.ts';
import loginRouter from './auth/login.ts';
import verificationRouter from './auth/verification.ts';
import passwordRouter from './auth/password.ts';
import sessionRouter from './auth/session.ts';
import oauthRouter from './auth/oauth.ts';

const authRouter = new Hono();

// Mount all modular sub-routers
authRouter.route('/', registerRouter);
authRouter.route('/', loginRouter);
authRouter.route('/', verificationRouter);
authRouter.route('/', passwordRouter);
authRouter.route('/', sessionRouter);
authRouter.route('/', oauthRouter);

export default authRouter;
