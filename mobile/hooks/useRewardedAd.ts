import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { api } from '../services/api';

export interface AdStatus {
  adCreditsToday: number;
  maxDaily: number;
  remainingToday: number;
  canWatchAd: boolean;
}

export function useRewardedAd() {
  const [adStatus, setAdStatus] = useState<AdStatus>({
    adCreditsToday: 0,
    maxDaily: 5,
    remainingToday: 5,
    canWatchAd: true,
  });
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isAdShowing, setIsAdShowing] = useState(false);
  const [adCountdown, setAdCountdown] = useState<number>(30);
  const [adError, setAdError] = useState<string | null>(null);

  const rewardedAdRef = useRef<any>(null);
  const isLoadedRef = useRef(false);

  // 1. Fetch user ad status from backend
  const fetchAdStatus = useCallback(async () => {
    try {
      const res = await api.get('/api/revenuecat/ad-status');
      if (res.data) {
        setAdStatus({
          adCreditsToday: res.data.adCreditsToday ?? 0,
          maxDaily: res.data.maxDaily ?? 5,
          remainingToday: res.data.remainingToday ?? 5,
          canWatchAd: (res.data.remainingToday ?? 5) > 0,
        });
      }
    } catch (err) {
      console.warn('[AdMob Hook] Failed to fetch ad status:', err);
    }
  }, []);

  // Helper to check if native AdMob module is linked in binary
  const isAdMobModuleAvailable = () => {
    if (Platform.OS === 'web') return false;
    try {
      const { NativeModules, TurboModuleRegistry } = require('react-native');
      return !!(
        NativeModules.RNGoogleMobileAdsModule ||
        (TurboModuleRegistry && typeof TurboModuleRegistry.get === 'function' && TurboModuleRegistry.get('RNGoogleMobileAdsModule'))
      );
    } catch (e) {
      return false;
    }
  };

  // 2. Preload AdMob Rewarded Ad
  const loadAd = useCallback(() => {
    if (!isAdMobModuleAvailable()) {
      console.log('[AdMob Hook] Native module not found in binary, operating in safe fallback mode.');
      return;
    }

    try {
      const GoogleMobileAds = require('react-native-google-mobile-ads');
      const { RewardedAd, RewardedAdEventType, AdEventType, TestIds } = GoogleMobileAds;

      // Use TestIds.REWARDED in development
      const adUnitId = __DEV__
        ? TestIds.REWARDED
        : (Platform.OS === 'android'
            ? 'ca-app-pub-9544550854248783/2239190067'
            : TestIds.REWARDED);

      setIsAdLoading(true);
      setAdError(null);

      const rewarded = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubscribeLoaded = rewarded.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          console.log('[AdMob] Rewarded ad loaded');
          isLoadedRef.current = true;
          setIsAdLoading(false);
        }
      );

      const unsubscribeEarned = rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        async (reward: any) => {
          console.log('[AdMob] User earned reward:', reward);
        }
      );

      const unsubscribeError = rewarded.addAdEventListener(
        AdEventType.ERROR,
        (error: any) => {
          console.warn('[AdMob] Rewarded ad error:', error);
          isLoadedRef.current = false;
          setIsAdLoading(false);
        }
      );

      rewardedAdRef.current = rewarded;
      rewarded.load();

      return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
        unsubscribeError();
      };
    } catch (e: any) {
      console.warn('[AdMob Hook] RewardedAd native module not available:', e.message);
      setIsAdLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdStatus();
    loadAd();
  }, [fetchAdStatus, loadAd]);

  // 3. Show Ad and Grant Credit
  const showAdAndGrantCredit = async (): Promise<{ success: boolean; message?: string }> => {
    if (adStatus.remainingToday <= 0) {
      return {
        success: false,
        message: 'Daily ad limit reached (5/5). You can watch more ads tomorrow.',
      };
    }

    setIsAdShowing(true);
    setAdError(null);

    return new Promise(async (resolve) => {
      let rewardEarned = false;

      // Fallback path if native AdMob module is not present (e.g. Expo Go / Web)
      if (!rewardedAdRef.current || !isLoadedRef.current) {
        console.log('[AdMob Hook] Fallback 30-second video ad timer mode');
        try {
          setAdCountdown(30);
          for (let sec = 30; sec > 0; sec--) {
            setAdCountdown(sec);
            await new Promise((r) => setTimeout(r, 1000));
          }
          setAdCountdown(0);

          const res = await api.post('/api/revenuecat/grant-ad-credit');
          await fetchAdStatus();
          setIsAdShowing(false);
          resolve({
            success: true,
            message: res.data?.message || '1 generation credit added!',
          });
        } catch (err: any) {
          setIsAdShowing(false);
          const errorMsg = err?.response?.data?.error || 'Failed to grant ad credit.';
          resolve({ success: false, message: errorMsg });
        }
        return;
      }

      try {
        const GoogleMobileAds = require('react-native-google-mobile-ads');
        const { RewardedAdEventType, AdEventType } = GoogleMobileAds;
        const rewarded = rewardedAdRef.current;

        const unsubscribeEarned = rewarded.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            rewardEarned = true;
          }
        );

        const unsubscribeClosed = rewarded.addAdEventListener(
          AdEventType.CLOSED,
          async () => {
            unsubscribeEarned();
            unsubscribeClosed();
            setIsAdShowing(false);
            isLoadedRef.current = false;

            if (rewardEarned) {
              try {
                const res = await api.post('/api/revenuecat/grant-ad-credit');
                await fetchAdStatus();
                loadAd(); // Reload for next use
                resolve({
                  success: true,
                  message: res.data?.message || '1 generation credit added!',
                });
              } catch (err: any) {
                const errorMsg = err?.response?.data?.error || 'Failed to grant credit.';
                resolve({ success: false, message: errorMsg });
              }
            } else {
              loadAd();
              resolve({
                success: false,
                message: 'Ad was closed before 30 seconds. No reward earned.',
              });
            }
          }
        );

        rewarded.show();
      } catch (err: any) {
        console.error('[AdMob Hook] Error showing rewarded ad:', err);
        setIsAdShowing(false);
        setAdError(err.message);
        resolve({ success: false, message: err.message || 'Error launching ad.' });
      }
    });
  };

  return {
    adStatus,
    isAdLoading,
    isAdShowing,
    adCountdown,
    adError,
    showAdAndGrantCredit,
    refreshAdStatus: fetchAdStatus,
  };
}
