import 'dotenv/config';
import pushService from '../src/services/push.ts';

async function main() {
  console.log('🧪 Testing Push Notification System...\n');
  console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);

  const testPayload = {
    to: 'test-device-token-12345',
    title: 'Your portrait is ready ✨',
    body: 'Tap to preview your new studio portrait.',
    data: {
      url: '/(tabs)/history',
      generationId: 'test-gen-id-999',
    },
  };

  const result = await pushService.sendPushNotification(testPayload);

  console.log('\n📊 Result:');
  console.log(result);

  if (result.success) {
    console.log('\n✅ Push notification service test passed successfully!');
  } else {
    console.log('\n❌ Push notification test returned an error:', result.error);
  }
}

main().catch(console.error);
