export interface PushNotificationPayload {
  to: string; // The FCM device token or ExpoPushToken[...]
  title: string;
  body: string;
  data?: Record<string, string>;
}

class PushService {
  private projectId = process.env.FIREBASE_PROJECT_ID || '';
  private isConfigured = false;

  constructor() {
    this.isConfigured = this.projectId !== '' && !this.projectId.startsWith('placeholder');
  }

  /**
   * Send a push notification using Expo Push API (works for all Expo/FCM tokens)
   * or FCM v1 API.
   */
  async sendPushNotification(payload: PushNotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!payload.to) {
        return { success: false, error: 'Target device push token ("to") is missing.' };
      }

      // Check if this is a mock or dev environment token
      if (payload.to.startsWith('test-device-token') || payload.to.startsWith('mock-token')) {
        console.log(`\n======================================================`);
        console.log(`🔔 [MOCK PUSH NOTIFICATION DISPATCHED]`);
        console.log(`   TO (TOKEN): ${payload.to}`);
        console.log(`   TITLE:      ${payload.title}`);
        console.log(`   BODY:       ${payload.body}`);
        if (payload.data) {
          console.log(`   DATA:       ${JSON.stringify(payload.data, null, 2)}`);
        }
        console.log(`======================================================\n`);
        return { success: true, messageId: `mock-msg-id-${Date.now()}` };
      }

      // 1. Send via Expo Push API (Handles Expo & FCM tokens seamlessly)
      if (payload.to.startsWith('ExponentPushToken') || payload.to.startsWith('ExpoPushToken')) {
        const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: JSON.stringify({
            to: payload.to,
            sound: 'default',
            title: payload.title,
            body: payload.body,
            data: payload.data || undefined,
            priority: 'high',
          }),
        });

        const expoResult: any = await expoResponse.json();
        if (expoResponse.ok && expoResult.data?.status === 'ok') {
          console.log(`[Push Service] Expo push notification delivered: ${expoResult.data.id}`);
          return { success: true, messageId: expoResult.data.id };
        } else if (expoResult.data?.status === 'error') {
          console.warn('[Push Service] Expo Push Error:', expoResult.data.message);
          return { success: false, error: expoResult.data.message || 'Expo Push dispatch error' };
        }
      }

      // 2. Direct FCM v1 API Dispatch (For native Android FCM tokens)
      const accessToken = this.projectId ? await this.getGoogleAccessToken() : null;
      const fcmUrl = this.projectId
        ? `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`
        : '';

      if (!accessToken) {
        // Fallback to Expo Push Bridge for direct FCM tokens if OAuth token not present
        const expoFallback = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: payload.to,
            sound: 'default',
            title: payload.title,
            body: payload.body,
            data: payload.data || undefined,
          }),
        });

        const fallbackResult: any = await expoFallback.json();
        if (expoFallback.ok && (fallbackResult.data?.status === 'ok' || !fallbackResult.errors)) {
          console.log('[Push Service] Notification dispatched via Expo Push Service');
          return { success: true, messageId: `expo-bridge-${Date.now()}` };
        }

        return { success: false, error: 'Failed to dispatch push notification. Ensure valid device token.' };
      }

      const response = await fetch(fcmUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: payload.to,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data: payload.data || undefined,
          },
        }),
      });

      const result: any = await response.json();
      if (!response.ok) {
        console.error('[FCM API Error]', result.error);
        return { success: false, error: result.error?.message || 'FCM send failed' };
      }

      return { success: true, messageId: result.name };
    } catch (err: any) {
      console.error('[Push Service] Exception occurred sending notification:', err);
      return { success: false, error: err.message || 'Unknown error' };
    }
  }

  private async getGoogleAccessToken(): Promise<string | null> {
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return null;
      }
      return null;
    } catch (err) {
      return null;
    }
  }
}

export const pushService = new PushService();
export default pushService;
