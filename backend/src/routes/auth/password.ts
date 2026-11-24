import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../db/client.ts';
import { users } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword, signJWT } from '../../services/auth.ts';
import emailService from '../../services/email.ts';
import { authGuard, AuthVariables } from '../../middlewares/auth.ts';
import { getCleanUser, handleValidation } from './utils.ts';

const passwordRouter = new Hono<{ Variables: AuthVariables }>();

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

passwordRouter.post('/forgot-password', zValidator('json', forgotPasswordSchema, handleValidation), async (c) => {
  const { email } = c.req.valid('json');

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user || !user.passwordHash) {
      return c.json({ message: 'If an account with this email exists, a reset code has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db
      .update(users)
      .set({
        passwordResetOtp: otp,
        passwordResetExpiry: otpExpiry,
      })
      .where(eq(users.id, user.id));

    emailService.sendPasswordResetOtp(user.email!, otp).catch((err) => {
      console.error(`[Password Reset Email Error] Failed to send OTP to ${user.email}:`, err);
    });

    return c.json({ message: 'If an account with this email exists, a reset code has been sent.' });
  } catch (err) {
    console.error('Forgot password failed:', err);
    return c.json({ error: 'Server error processing password reset request' }, 500);
  }
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(6),
});

passwordRouter.post('/reset-password', zValidator('json', resetPasswordSchema, handleValidation), async (c) => {
  const { email, otp, newPassword } = c.req.valid('json');

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      return c.json({ error: 'Invalid email or reset code' }, 400);
    }

    if (!user.passwordResetOtp || !user.passwordResetExpiry) {
      return c.json({ error: 'No password reset request active. Please request a new code.' }, 400);
    }

    if (new Date() > new Date(user.passwordResetExpiry)) {
      return c.json({ error: 'Reset code has expired. Please request a new one.' }, 400);
    }

    if (user.passwordResetOtp !== otp) {
      return c.json({ error: 'Invalid reset code' }, 400);
    }

    const newPasswordHash = await hashPassword(newPassword);
    const [updatedUser] = await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        passwordResetOtp: null,
        passwordResetExpiry: null,
      })
      .where(eq(users.id, user.id))
      .returning();

    const token = await signJWT(updatedUser.id, updatedUser.email!);

    return c.json({
      message: 'Password reset successfully!',
      user: getCleanUser(updatedUser),
      token,
    });
  } catch (err) {
    console.error('Password reset failed:', err);
    return c.json({ error: 'Server error resetting password' }, 500);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

passwordRouter.post('/change-password', authGuard, zValidator('json', changePasswordSchema, handleValidation), async (c) => {
  const userId = c.get('userId');
  const { currentPassword, newPassword } = c.req.valid('json');

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.passwordHash) {
      return c.json({ error: 'Password change not available for social login accounts' }, 400);
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return c.json({ error: 'Current password is incorrect' }, 401);
    }

    const newPasswordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, userId));

    return c.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password failed:', err);
    return c.json({ error: 'Server error changing password' }, 500);
  }
});

export default passwordRouter;
