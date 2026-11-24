import { MiddlewareHandler } from 'hono';
import { verifyJWT } from '../services/auth.ts';

// Declare Hono Context Variables for TypeScript safety
export type AuthVariables = {
  userId: string;
  userEmail: string | null;
};

export const authGuard: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or malformed Authorization header' }, 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyJWT(token);

  if (!payload || !payload.userId) {
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }

  // Inject user details into context variables
  c.set('userId', payload.userId);
  c.set('userEmail', payload.email);

  await next();
};
