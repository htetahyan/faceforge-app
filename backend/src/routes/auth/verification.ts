import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { users } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { authGuard, AuthVariables } from '../../middlewares/auth.ts';
import emailService from '../../services/email.ts';
import { getCleanUser, handleValidation } from './utils.ts';

const verificationRouter = new Hono<{ Variables: AuthVariables }>();

const verifyEmailSchema = z.object({
  otp: z.string().length(6),
});

verificationRouter.post('/verify-email', authGuard, zValidator('json', verifyEmailSchema, handleValidation), async (c) => {
  const userId = c.get('userId');
  const { otp } = c.req.valid('json');

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (user.emailVerified) {
      return c.json({ message: 'Email is already verified' }, 200);
    }

    if (!user.emailVerificationOtp || !user.emailVerificationExpiry) {
      return c.json({ error: 'No verification request active. Please request a new code.' }, 400);
    }

    // Check expiry
    if (new Date() > new Date(user.emailVerificationExpiry)) {
      return c.json({ error: 'Verification code has expired. Please request a new one.' }, 400);
    }

    // Check code
    if (user.emailVerificationOtp !== otp) {
      return c.json({ error: 'Invalid verification code' }, 400);
    }

    // Mark verified
    const [updatedUser] = await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationOtp: null,
        emailVerificationExpiry: null,
      })
      .where(eq(users.id, userId))
      .returning();

    return c.json({
      message: 'Email verified successfully!',
      user: getCleanUser(updatedUser),
    });
  } catch (err) {
    console.error('Failed to verify email:', err);
    return c.json({ error: 'Server error during email verification' }, 500);
  }
});

verificationRouter.post('/resend-verification', authGuard, async (c) => {
  const userId = c.get('userId');

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (user.emailVerified) {
      return c.json({ error: 'Email is already verified' }, 400);
    }

    if (!user.email) {
      return c.json({ error: 'User has no email registered' }, 400);
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins validity

    await db
      .update(users)
      .set({
        emailVerificationOtp: otp,
        emailVerificationExpiry: otpExpiry,
      })
      .where(eq(users.id, userId));

    // Send email
    await emailService.sendVerificationOtp(user.email, otp);

    return c.json({ message: 'Verification code resent successfully!' });
  } catch (err) {
    console.error('Failed to resend verification:', err);
    return c.json({ error: 'Server error resending verification code' }, 500);
  }
});

export default verificationRouter;
