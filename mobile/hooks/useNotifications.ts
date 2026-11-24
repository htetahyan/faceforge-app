import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { api } from '../services/api';

// Configure foreground notification banner behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications(isAuthenticated: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    async function registerForPushNotifications() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('⚠️ Push notification permission not granted.');
          return;
        }

        // Retrieve token
        const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
        const pushToken = tokenData?.data;

        if (pushToken && isMounted) {
          // Send push token to backend
          await api.post('/api/profile/push-token', { pushToken }).catch(() => {});
        }
      } catch (err) {
        console.warn('Push notification registration skipped or unavailable on this platform.');
      }
    }

    registerForPushNotifications();

    // Listen for notification taps
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.url) {
        router.push(data.url as any);
      } else if (data?.generationId) {
        router.push(`/generation/${data.generationId}` as any);
      }
    });

    return () => {
      isMounted = false;
      responseSubscription.remove();
    };
  }, [isAuthenticated, router]);
}
