import { req, assert, token } from './test-context.ts';

export async function runStudioE2ETests() {
  console.log('\n--- 📸 Direct AI Studio E2E Suite ---');

  if (!token) {
    console.log('⚠️ Skipping Studio E2E tests because authentication token is unavailable.');
    return;
  }

  // 1. Fetch user face profiles
  const facesRes = await req('/api/faces', { token });
  assert(facesRes.status === 200, 'GET /api/faces returns 200 OK');
  const facesData: any = await facesRes.json();
  assert(Array.isArray(facesData.faces), 'Faces list response is an array');

  // 2. Trigger Direct AI Studio generation without templateId or outfit
  const studioPayload = {
    faceMappings: { 'Person A': '00000000-0000-0000-0000-000000000000' },
    customPrompt: 'Studio Portrait | smile | 4:5',
  };

  const genRes = await req('/api/generate', {
    method: 'POST',
    token,
    body: studioPayload,
  });

  // Should succeed or return 403 (if dummy face UUID not found for user)
  assert(
    genRes.status === 202 || genRes.status === 403,
    `POST /api/generate without templateId handled safely (Status: ${genRes.status})`
  );

  if (genRes.status === 202) {
    const genData: any = await genRes.json();
    assert(!!genData.taskId, 'Direct Studio task returns valid taskId');

    // 3. Poll task status
    const statusRes = await req(`/api/generate/tasks/${genData.taskId}/status`, { token: token });
    assert(statusRes.status === 200, 'GET task status returns 200 OK');
    const statusData: any = await statusRes.json();
    assert(statusData.template?.title === 'AI Studio Portrait', 'Task template title falls back to AI Studio Portrait');
  }
}
