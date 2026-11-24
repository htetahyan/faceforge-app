import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { users } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import * as jose from 'jose';
import { getCleanUser } from './utils.ts';
import { signJWT } from '../../services/auth.ts';

const oauthRouter = new Hono();

const oauthSchema = z.object({
  provider: z.enum(['google', 'apple']),
  idToken: z.string(),
  email: z.string().email().optional(), // Apple might only provide email on first sign in
  name: z.string().optional(),
});

// Setup JWK sets for signature validation
const GOOGLE_JWKS = jose.createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const APPLE_JWKS = jose.createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

async function verifyOAuthToken(provider: 'google' | 'apple', idToken: string) {
  if (provider === 'google') {
    const allowedAudiences = [
      process.env.GOOGLE_CLIENT_ID_IOS,
      process.env.GOOGLE_CLIENT_ID_ANDROID,
      process.env.GOOGLE_CLIENT_ID_WEB,
    ].filter(Boolean) as string[];

    // Verify token signature against Google's public JWK set
    const { payload } = await jose.jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ['accounts.google.com', 'https://accounts.google.com'],
    });

    // Match audience if not placeholders
    const isPlaceholder = allowedAudiences.every(aud => !aud || aud.includes('placeholder'));
    if (!isPlaceholder && allowedAudiences.length > 0) {
      if (!allowedAudiences.includes(payload.aud as string)) {
        throw new Error('Google token audience mismatch');
      }
    }
    return payload;
  } else {
    const allowedAudiences = [
      process.env.APPLE_CLIENT_ID_IOS
    ].filter(Boolean) as string[];

    // Verify token signature against Apple's public JWK set
    const { payload } = await jose.jwtVerify(idToken, APPLE_JWKS, {
      issuer: 'https://appleid.apple.com',
    });

    // Match audience if not placeholders
    const isPlaceholder = allowedAudiences.every(aud => !aud || aud.includes('placeholder'));
    if (!isPlaceholder && allowedAudiences.length > 0) {
      if (!allowedAudiences.includes(payload.aud as string)) {
        throw new Error('Apple token audience mismatch');
      }
    }
    return payload;
  }
}

oauthRouter.post('/oauth', zValidator('json', oauthSchema), async (c) => {
  const { provider, idToken, email, name } = c.req.valid('json');

  try {
    // Perform real cryptographic verification of the ID token
    const decoded = await verifyOAuthToken(provider, idToken);
    
    // Apple might not include email in subsequent logins, fallback to client-sent email
    const tokenEmail = (decoded?.email as string) || email;
    const tokenSub = decoded?.sub as string;

    if (!tokenEmail || !tokenSub) {
      return c.json({ error: 'Invalid token properties (missing email or sub)' }, 400);
    }

    // Upsert User
    let user = await db.query.users.findFirst({
      where: eq(users.email, tokenEmail.toLowerCase()),
    });

    const displayName = (decoded?.name as string) || name || (tokenEmail.split('@')[0]);

    if (!user) {
      // Register new user via OAuth
      const newUser = await db.insert(users).values({
        email: tokenEmail.toLowerCase(),
        passwordHash: 'OAUTH_USER',
        emailVerified: true, // OAuth emails are verified by provider
        subscriptionTier: 'free',
        authProvider: provider,
        authProviderId: tokenSub,
        displayName,
      }).returning();
      
      user = newUser[0];
    } else {
      // link provider details if not already linked, and always mark email as verified
      const [updatedUser] = await db.update(users).set({ 
        authProvider: user.authProvider || provider,
        authProviderId: user.authProviderId || tokenSub,
        displayName: user.displayName || displayName,
        emailVerified: true, // Google/Apple verified the email
      }).where(eq(users.id, user.id)).returning();
      
      user = updatedUser;
    }

    // Generate local JWT token
    const token = await signJWT(user.id, user.email);

    return c.json({
      token,
      user: getCleanUser(user),
    });
  } catch (err: any) {
    console.error(`[OAuth] Error processing ${provider} sign in:`);
    console.error(`[OAuth] Error details:`, err);
    if (provider === 'google' && idToken) {
        try {
            const decoded = jose.decodeJwt(idToken);
            console.error(`[OAuth] Decoded Google JWT header/payload:`, decoded);
            console.error(`[OAuth] Expected Audiences:`, [
              process.env.GOOGLE_CLIENT_ID_IOS,
              process.env.GOOGLE_CLIENT_ID_ANDROID,
              process.env.GOOGLE_CLIENT_ID_WEB,
            ].filter(Boolean));
        } catch(e) {
            console.error(`[OAuth] Failed to decode token to debug:`, e);
        }
    }
    return c.json({ 
      error: err.message || String(err) || 'Failed to authenticate with provider', 
      details: err.code || err.name,
      stack: err.stack 
    }, 401);
  }
});

export default oauthRouter;
