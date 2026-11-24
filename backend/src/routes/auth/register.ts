import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { users } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { hashPassword, signJWT } from '../../services/auth.ts';
import emailService from '../../services/email.ts';
import { getCleanUser, handleValidation } from './utils.ts';

const registerRouter = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().optional(),
});

registerRouter.post('/register', zValidator('json', registerSchema, handleValidation), async (c) => {
  const { email, password, displayName } = c.req.valid('json');

  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return c.json({ error: 'Email is already registered' }, 400);
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins validity

    // Hash the password and save
    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName || email.split('@')[0],
        emailVerified: false,
        emailVerificationOtp: otp,
        emailVerificationExpiry: otpExpiry,
        role: 'user',
        subscriptionTier: 'free',
      })
      .returning();

    // Send verification email in the background
    emailService.sendVerificationOtp(newUser.email!, otp).catch((err) => {
      console.error(`[Signup Email Error] Failed to send OTP to ${newUser.email}:`, err);
    });

    // Sign session JWT
    const token = await signJWT(newUser.id, newUser.email!);

    return c.json({
      user: getCleanUser(newUser),
      token,
    }, 201);
  } catch (err: any) {
    console.error('Registration failed:', err);
    return c.json({ error: 'Server error during registration' }, 500);
  }
});

export default registerRouter;
