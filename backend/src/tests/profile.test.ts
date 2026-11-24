import { assert, req, testEmail, userId, token } from './test-context.ts';
import { db } from '../db/client.ts';
import { users, faceProfiles } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export async function runFcmTokenTests() {
  console.log('\n[Test 14] Register FCM Token...');
  const fcmRes = await req('/api/profile/fcm-token', {
    method: 'POST',
    token,
    body: { fcmToken: 'mock_fcm_device_token_123456' }
  });
  assert(fcmRes.status === 200, 'Register FCM token returns HTTP 200');

  // Verify fcmToken is set in database
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  assert(user?.fcmToken === 'mock_fcm_device_token_123456', 'FCM Token saved in database');
}

export async function runProfileDeletionTests() {
  // Test Case 12: Account Deletion (GDPR) with Stripe cancellation and face profiles cleanup
  console.log('\n[Test 12] Account Deletion (GDPR)...');
  
  // Need to log in with new password first
  const loginRes = await req('/api/auth/login', {
    method: 'POST',
    body: { email: testEmail, password: 'newsecurepassword123' }
  });
  assert(loginRes.status === 200, 'Login with new password succeeds');
  const loginBody: any = await loginRes.json();
  const loginToken = loginBody.token;

  const deleteRes = await req('/api/profile', {
    method: 'DELETE',
    token: loginToken
  });
  assert(deleteRes.status === 200, 'Account deletion returns HTTP 200');
  
  // Verify user is deleted from database
  const deletedUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  assert(deletedUser === undefined, 'User record completely removed from database');

  // Verify face profiles are deleted
  const deletedFaces = await db.query.faceProfiles.findMany({
    where: eq(faceProfiles.userId, userId),
  });
  assert(deletedFaces.length === 0, 'User face profiles completely removed from database');
}
