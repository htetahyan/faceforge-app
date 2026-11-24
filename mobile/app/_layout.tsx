import '../global.css';
import React, { useEffect, useState } from 'react';
import { useColorScheme, View, ActivityIndicator, Platform } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';

import * as SecureStore from '../services/secureStore';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { Theme } from '../constants/theme';
import { ToastProvider } from '../components/ui/Toast';
import Purchases from 'react-native-purchases';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Create a single stable React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNavigation() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);

  // Automatically register device push token & handle notification deep-links
  useNotifications(isAuthenticated);

  useEffect(() => {
    if (isLoading) return;

    let isMounted = true;
    const inAuthGroup = segments[0] === '(auth)';
    const inVerifyEmail = segments[0] === 'verify-email';
    const inOnboarding = segments[0] === 'onboarding';

    const checkAndRedirect = async () => {
      if (isAuthenticated) {
        if (!user?.emailVerified) {
          if (!inVerifyEmail) {
            router.replace('/verify-email');
          }
        } else {
          if (inAuthGroup || inVerifyEmail || inOnboarding) {
            router.replace('/(tabs)');
          }
        }
        if (isMounted) setIsInitialCheckDone(true);
      } else {
        if (inAuthGroup || inOnboarding) {
          if (isMounted) setIsInitialCheckDone(true);
          return;
        }

        try {
          const completed = await SecureStore.getItemAsync('has_completed_onboarding');
          if (completed !== 'true') {
            router.replace('/onboarding');
          } else {
            router.replace('/(auth)/login');
          }
        } catch (err) {
          router.replace('/(auth)/login');
        } finally {
          if (isMounted) setIsInitialCheckDone(true);
        }
      }
    };

    checkAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.emailVerified, isLoading, segments, router]);

  if (isLoading || !isInitialCheckDone) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background }}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="verify-email" options={{ presentation: 'card', headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="templates/[id]" options={{ presentation: 'card', headerShown: false }} />
      <Stack.Screen name="generation/[id]" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="pricing" options={{ presentation: 'card', headerShown: false }} />
      <Stack.Screen name="profile" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="privacy" options={{ presentation: 'card', headerShown: false }} />
      <Stack.Screen name="terms" options={{ presentation: 'card', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme() || 'dark';

  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'rc_ios_placeholder_key',
        android: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || 'rc_android_placeholder_key',
        default: '',
      });
      if (apiKey) {
        try {
          Purchases.configure({ apiKey });
          console.log('[RevenueCat] Initialized successfully');
        } catch (err) {
          console.warn('[RevenueCat] RNPurchases native module is unavailable in Expo Go. Native purchases features will be simulated inside Expo Go.', err);
        }
      }

      // Initialize AdMob SDK safely
      try {
        const { NativeModules, TurboModuleRegistry } = require('react-native');
        const hasAdMobModule =
          !!NativeModules.RNGoogleMobileAdsModule ||
          !!(TurboModuleRegistry && typeof TurboModuleRegistry.get === 'function' && TurboModuleRegistry.get('RNGoogleMobileAdsModule'));

        if (hasAdMobModule) {
          const mobileAds = require('react-native-google-mobile-ads').default;
          mobileAds()
            .initialize()
            .then((adapterStatuses: any) => {
              console.log('[AdMob] SDK initialized successfully', adapterStatuses);
            })
            .catch((err: any) => {
              console.warn('[AdMob] Initialization warning:', err);
            });
        } else {
          console.log('[AdMob] Native module RNGoogleMobileAdsModule not compiled in current binary. Fallback active.');
        }
      } catch (err) {
        console.warn('[AdMob] Native module check warning:', err);
      }
    }
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <ToastProvider>
              <RootLayoutNavigation />
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
