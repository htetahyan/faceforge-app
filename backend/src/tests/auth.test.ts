import { assert, req, testEmail, setToken, setUserId, token, userId } from './test-context.ts';
import { db } from '../db/client.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export async function runAuthTests() {
  // Test Case 1: Root health check
  console.log('\n[Test 1] Health Check...');
  const res1 = await req('/');
  assert(res1.status === 200, 'Root responds with HTTP 200');
  const body1: any = await res1.json();
  assert(body1.status === 'online', 'Health check reports status: online');

  // Test Case 2: Validation check
  console.log('\n[Test 2] Registration Input Validation...');
  const res2 = await req('/api/auth/register', {
    method: 'POST',
    body: { email: 'invalid-email', password: '123' }
  });
  assert(res2.status === 400, 'Malformed email/password rejects with HTTP 400');

  // Test Case 3: Register test user
  console.log('\n[Test 3] Create User (Traditional Flow)...');
  const res3 = await req('/api/auth/register', {
    method: 'POST',
    body: { email: testEmail, password: 'securepassword123', displayName: 'Test User' }
  });
  assert(res3.status === 201, 'Valid register returns HTTP 201 Created');
  const body3: any = await res3.json();
  setToken(body3.token);
  setUserId(body3.user.id);
  assert(!!body3.token, 'Auth returns JWT token');
  assert(body3.user.emailVerified === false, 'New user is unverified by default');

  // Test Case 4: Email gate block
  console.log('\n[Test 4] Verify Email Verification Gate (Should Block)...');
  const res4 = await req('/api/generate', {
    method: 'POST',
    token: body3.token,
    body: { templateId: crypto.randomUUID(), faceMappings: {} }
  });
  assert(res4.status === 403, 'Unverified email blocks image generation with HTTP 403');
  const body4: any = await res4.json();
  assert(body4.code === 'EMAIL_UNVERIFIED', 'Returns code EMAIL_UNVERIFIED');

  // Test Case 5: Verify email using DB OTP lookup
  console.log('\n[Test 5] Verify Email via OTP...');
  const userInDb = await db.query.users.findFirst({
    where: eq(users.id, body3.user.id)
  });
  const otp = userInDb?.emailVerificationOtp;
  assert(!!otp, 'OTP code was generated in the database');

  const res5 = await req('/api/auth/verify-email', {
    method: 'POST',
    token: body3.token,
    body: { otp }
  });
  assert(res5.status === 200, 'Correct OTP code verifies email and returns HTTP 200');
  const body5: any = await res5.json();
  assert(body5.user.emailVerified === true, 'Response reports emailVerified: true');

  // Test Case 6: Rate Limiting validation
  console.log('\n[Test 6] General Route JWT Protection & Rate Limit Header Presence...');
  const res6 = await req('/api/auth/me', { token: body3.token });
  assert(res6.status === 200, 'Authenticated request to /me succeeds');
  assert(res6.headers.has('X-RateLimit-Limit'), 'Response includes X-RateLimit-Limit header');
}

export async function runTokenAndPasswordTests() {
  // Test Case 10: Refresh token session
  console.log('\n[Test 10] Token Refresh...');
  const refreshRes = await req('/api/auth/refresh', { method: 'POST', token });
  assert(refreshRes.status === 200, 'Refresh token returns HTTP 200');
  const refreshBody: any = await refreshRes.json();
  const newToken = refreshBody.token;
  assert(!!newToken, 'Returns new JWT token');
  assert(typeof newToken === 'string', 'Refresh token returns a valid token string');

  // Test Case 11: Forgot & Reset Password
  console.log('\n[Test 11] Forgot & Reset Password flow...');
  const forgotRes = await req('/api/auth/forgot-password', {
    method: 'POST',
    body: { email: testEmail }
  });
  assert(forgotRes.status === 200, 'Forgot password triggers successfully');
  
  const userWithReset = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  const resetOtp = userWithReset?.passwordResetOtp;
  assert(!!resetOtp, 'Password reset OTP generated in database');

  const resetRes = await req('/api/auth/reset-password', {
    method: 'POST',
    body: { email: testEmail, otp: resetOtp!, newPassword: 'newsecurepassword123' }
  });
  assert(resetRes.status === 200, 'Reset password returns HTTP 200');
}
