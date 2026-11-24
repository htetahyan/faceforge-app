import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { users } from '../../db/schema.ts';
import { eq, or } from 'drizzle-orm';
import { verifyPassword, signJWT, verifyGoogleToken, verifyAppleToken } from '../../services/auth.ts';
import { getCleanUser, handleValidation } from './utils.ts';

const loginRouter = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

loginRouter.post('/login', zValidator('json', loginSchema, handleValidation), async (c) => {
  const { email, password } = c.req.valid('json');

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user || !user.passwordHash) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const token = await signJWT(user.id, user.email!);

    return c.json({
      user: getCleanUser(user),
      token,
    });
  } catch (err) {
    console.error('Login failed:', err);
    return c.json({ error: 'Server error during login' }, 500);
  }
});

const googleAuthSchema = z.object({
  idToken: z.string(),
});

loginRouter.post('/google', zValidator('json', googleAuthSchema), async (c) => {
  const { idToken } = c.req.valid('json');

  try {
    const googleProfile = await verifyGoogleToken(idToken);

    let user = await db.query.users.findFirst({
      where: or(
        eq(users.googleId, googleProfile.googleId),
        eq(users.email, googleProfile.email.toLowerCase())
      ),
    });

    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          email: googleProfile.email.toLowerCase(),
          googleId: googleProfile.googleId,
          displayName: googleProfile.displayName || googleProfile.email.split('@')[0],
          avatarUrl: googleProfile.avatarUrl,
          emailVerified: true,
          role: 'user',
          subscriptionTier: 'free',
        })
        .returning();
    } else {
      [user] = await db
        .update(users)
        .set({
          googleId: googleProfile.googleId,
          displayName: user.displayName || googleProfile.displayName,
          avatarUrl: user.avatarUrl || googleProfile.avatarUrl,
          emailVerified: true,
        })
        .where(eq(users.id, user.id))
        .returning();
    }

    const token = await signJWT(user.id, user.email!);

    return c.json({
      user: getCleanUser(user),
      token,
    });
  } catch (err: any) {
    console.error('Google Sign-In exchange failed:', err);
    return c.json({ error: err.message || 'Google Sign-In failed' }, 400);
  }
});

const appleAuthSchema = z.object({
  idToken: z.string(),
  displayName: z.string().optional(),
});

loginRouter.post('/apple', zValidator('json', appleAuthSchema), async (c) => {
  const { idToken, displayName } = c.req.valid('json');

  try {
    const appleProfile = await verifyAppleToken(idToken);

    let user = await db.query.users.findFirst({
      where: appleProfile.email
        ? or(eq(users.appleId, appleProfile.appleId), eq(users.email, appleProfile.email.toLowerCase()))
        : eq(users.appleId, appleProfile.appleId),
    });

    if (!user) {
      const finalEmail = appleProfile.email ? appleProfile.email.toLowerCase() : null;
      [user] = await db
        .insert(users)
        .values({
          email: finalEmail,
          appleId: appleProfile.appleId,
          displayName: displayName || (finalEmail ? finalEmail.split('@')[0] : 'iOS User'),
          emailVerified: true,
          role: 'user',
          subscriptionTier: 'free',
        })
        .returning();
    } else {
      [user] = await db
        .update(users)
        .set({ 
          appleId: appleProfile.appleId,
          emailVerified: true,
        })
        .where(eq(users.id, user.id))
        .returning();
    }

    const token = await signJWT(user.id, user.email || '');

    return c.json({
      user: getCleanUser(user),
      token,
    });
  } catch (err: any) {
    console.error('Apple Sign-In exchange failed:', err);
    return c.json({ error: err.message || 'Apple Sign-In failed' }, 400);
  }
});

export default loginRouter;
