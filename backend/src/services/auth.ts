import * as jose from 'jose';

// Fetch Google and Apple Public Keys (JWKS) dynamically
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

const googleJWKS = jose.createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
const appleJWKS = jose.createRemoteJWKSet(new URL(APPLE_JWKS_URL));

// Custom application JWT Configuration
const jwtSecretValue = process.env.JWT_SECRET;
if (!jwtSecretValue) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretValue);
const JWT_EXPIRY = '30d'; // Set a generous session limit for mobile app users

export interface TokenPayload {
  userId: string;
  email: string | null;
}

/**
 * 1. Custom App JWT Signer & Verifier
 */
export async function signJWT(userId: string, email: string | null): Promise<string> {
  return await new jose.SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: (payload.email as string) || null,
    };
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
}

/**
 * 2. Native Google ID Token Verification
 */
export async function verifyGoogleToken(idToken: string): Promise<{
  googleId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}> {
  try {
    const { payload } = await jose.jwtVerify(idToken, googleJWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
    });

    // Check Google Client ID Audience matching (if configured)
    const allowedClientIds = [
      process.env.GOOGLE_CLIENT_ID_IOS,
      process.env.GOOGLE_CLIENT_ID_ANDROID,
    ].filter(Boolean);

    if (allowedClientIds.length > 0 && !allowedClientIds.includes(payload.aud as string)) {
      throw new Error(`Google ID token audience mismatch: ${payload.aud}`);
    }

    if (!payload.email) {
      throw new Error('Google ID token is missing email address');
    }

    return {
      googleId: payload.sub as string,
      email: payload.email as string,
      displayName: (payload.name as string) || undefined,
      avatarUrl: (payload.picture as string) || undefined,
    };
  } catch (err) {
    console.error('Google token verification failed:', err);
    throw new Error('Invalid Google ID Token');
  }
}

/**
 * 3. Native Apple (iOS) ID Token Verification
 */
export async function verifyAppleToken(idToken: string): Promise<{
  appleId: string;
  email: string | null;
}> {
  try {
    const { payload } = await jose.jwtVerify(idToken, appleJWKS, {
      issuer: 'https://appleid.apple.com',
    });

    // Check Apple Client ID (Bundle ID / Service ID)
    const allowedAppleId = process.env.APPLE_CLIENT_ID_IOS;
    if (allowedAppleId && payload.aud !== allowedAppleId) {
      throw new Error(`Apple ID token audience mismatch: ${payload.aud}`);
    }

    return {
      appleId: payload.sub as string,
      email: (payload.email as string) || null,
    };
  } catch (err) {
    console.error('Apple token verification failed:', err);
    throw new Error('Invalid Apple ID Token');
  }
}

/**
 * 4. Password hashing using Bun's ultra-fast native Argon2/Bcrypt engine
 */
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: 'argon2id', // Secure by default
    memoryCost: 19456,
    timeCost: 2,
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}
