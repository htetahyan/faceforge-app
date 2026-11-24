import { assert, req, token, userId } from './test-context.ts';

export async function runFacesTests() {
  // Test Case 7: Face limits verification
  console.log('\n[Test 7] Verify Face Profiles Cap (Limit = 5)...');
  for (let i = 1; i <= 5; i++) {
    const faceId = crypto.randomUUID();
    const confirmRes = await req('/api/faces/confirm', {
      method: 'POST',
      token,
      body: { id: faceId, name: `Face ${i}`, r2Keys: [`users/${userId}/faces/${faceId}.jpg`] }
    });
    assert(confirmRes.status === 201, `Uploaded face profile ${i}/5 successfully`);
  }

  // Attempt to upload 6th face profile (must fail)
  const face6Id = crypto.randomUUID();
  const res7 = await req('/api/faces/confirm', {
    method: 'POST',
    token,
    body: { id: face6Id, name: 'Face 6', r2Keys: [`users/${userId}/faces/${face6Id}.jpg`] }
  });
  assert(res7.status === 400, 'Uploading 6th face profile fails with HTTP 400 Bad Request');
  const body7: any = await res7.json();
  assert(body7.code === 'FACE_LIMIT_EXCEEDED', 'Reports FACE_LIMIT_EXCEEDED code');
}
