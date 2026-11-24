import 'dotenv/config';
import http from 'http';
import { GeminiAiGenerator } from '../src/services/ai/imagen.ts';

// Tiny 1x1 JPEG base64 data URI to simulate a face input
const MOCK_FACE_DATA_URI =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function testGenerateImage() {
  console.log('🧪 Starting Gemini AI / Vertex AI Image Generation Test...');

  let completed = false;
  let outputUrl = '';
  let errorMsg = '';

  const webhookServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        console.log('\n[Webhook Receiver] Received callback payload:', JSON.stringify(payload, null, 2));
        if (payload.status === 'completed') {
          completed = true;
          outputUrl = payload.outputUrl;
        } else {
          errorMsg = payload.error || 'Unknown failure in webhook';
        }
      } catch (err) {
        console.error('[Webhook Receiver] Failed to parse webhook body:', err);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
    });
  });

  await new Promise<void>((resolve) => {
    webhookServer.listen(3099, '127.0.0.1', () => {
      console.log('📡 Mock webhook server listening on http://127.0.0.1:3099/webhook');
      resolve();
    });
  });

  try {
    const generator = new GeminiAiGenerator();
    const testTaskId = crypto.randomUUID();

    console.log(`\n🚀 Launching test generation task ${testTaskId}...`);
    console.log('Prompt: "A professional aesthetic Instagram lifestyle portrait, clean lighting, 8k resolution"');

    await generator.generate({
      taskId: testTaskId,
      prompt: 'A professional aesthetic Instagram lifestyle portrait, clean lighting, 8k resolution',
      faceUrls: [MOCK_FACE_DATA_URI],
      callbackUrl: 'http://127.0.0.1:3099/webhook',
      aspectRatio: '1:1',
    });

    const startTime = Date.now();
    while (!completed && !errorMsg && Date.now() - startTime < 45000) {
      await new Promise((r) => setTimeout(r, 500));
    }

    if (completed) {
      console.log('\n🎉 TEST SUCCESSFUL! Image generated and saved.');
      console.log(`🖼️ Output URL: ${outputUrl}`);
    } else if (errorMsg) {
      console.error(`\n❌ TEST FAILED: ${errorMsg}`);
      process.exitCode = 1;
    } else {
      console.error('\n⏱️ TEST TIMED OUT waiting for webhook callback.');
      process.exitCode = 1;
    }
  } catch (err: any) {
    console.error('\n❌ Exception during image generation test:', err);
    process.exitCode = 1;
  } finally {
    webhookServer.close();
    console.log('📡 Webhook server closed.');
  }
}

testGenerateImage();
