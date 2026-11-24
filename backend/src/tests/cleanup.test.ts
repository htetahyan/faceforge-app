import { assert, req } from './test-context.ts';

export async function runCleanupTests() {
  // Test Case 13: Secure cleanup job callback
  console.log('\n[Test 13] Secure Cleanup Job Route protection...');
  const webhookSecret = process.env.WEBHOOK_SECRET;
  assert(!!webhookSecret, 'WEBHOOK_SECRET is set for cleanup tests');
  if (!webhookSecret) {
    return;
  }

  const cleanupRes = await req('/api/jobs/cleanup?secret=wrong', { method: 'POST' });
  assert(cleanupRes.status === 403, 'Cleanup job with wrong secret returns HTTP 403 Forbidden');

  const cleanSuccessRes = await req(
    `/api/jobs/cleanup?secret=${encodeURIComponent(webhookSecret)}`,
    { method: 'POST' },
  );
  assert(cleanSuccessRes.status === 200, 'Cleanup job with correct secret returns HTTP 200 OK');
}
