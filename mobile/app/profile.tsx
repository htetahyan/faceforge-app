import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, LogOut, Award, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Theme } from '../constants/theme';
import { useToast } from '../components/ui/Toast';
import CustomAlert from '../components/ui/CustomAlert';
import { styles } from './profile.styles';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  
  const [subData, setSubData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);

  useEffect(() => {
    const fetchProfileInfo = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/profile');
        const userData = response.data.user;
        setSubData({
          tier: userData.subscriptionTier || 'free',
          status: userData.subscriptionStatus || 'free',
          used: userData.generationsUsedThisPeriod || 0,
          periodEnd: userData.subscriptionPeriodEnd,
        });
      } catch (err) {
        console.error('[ProfileScreen] Error fetching profile subscription info:', err);
        setSubData({
          tier: user?.subscriptionTier || 'free',
          status: 'free',
          used: 0,
          periodEnd: null,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfileInfo();
  }, [user]);

  const handlePortalRedirect = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const subUrl = Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
    try {
      await WebBrowser.openBrowserAsync(subUrl);
    } catch (err) {
      Alert.alert('Manage Subscription', `Please manage your active subscription directly in your ${Platform.OS === 'ios' ? 'App Store' : 'Google Play'} account settings.`);
    }
  };

  const handleCancelSubscriptionNative = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    handlePortalRedirect();
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
  };

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/pricing');
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDeleteAlertVisible(true);
  };

  const handleConfirmDeleteAccount = async () => {
    setDeleteAlertVisible(false);
    try {
      setDeleting(true);
      await api.delete('/api/profile');
      showToast('Account deleted successfully.', 'success');
      await logout();
    } catch (err: any) {
      setDeleting(false);
      showToast(err.response?.data?.error || 'Failed to delete account.', 'error');
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Account</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.displayName?.[0] || 'U'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user?.displayName || 'User'}</Text>
              <Text style={styles.email} numberOfLines={1}>{user?.email || ''}</Text>
            </View>
          </View>

          {/* Tier and usage card with Skeleton Loader */}
          <View style={styles.tierBox}>
            {loading || !subData ? (
              <View style={{ gap: 8 }}>
                <View style={styles.tierHeader}>
                  <Award size={18} color={Theme.textMuted} />
                  <View style={styles.skeletonTextShort} />
                </View>
                <View style={styles.skeletonTextLong} />
                <View style={styles.skeletonButton} />
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={styles.tierHeader}>
                  <Award size={18} color={Theme.primary} />
                  <Text style={styles.tierLabel}>
                    Plan Level: <Text style={styles.tierName}>{subData.tier.toUpperCase()}</Text>
                  </Text>
                </View>
                <Text style={styles.usageText}>
                  {subData.used} generations used ({subData.tier === 'pro' ? '50 monthly' : subData.tier === 'premium' ? 'Unlimited' : '5 monthly'})
                </Text>
                
                {subData.tier === 'free' ? (
                  <TouchableOpacity onPress={handleUpgrade} style={styles.upgradeBtn} activeOpacity={0.8}>
                    <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ gap: 8 }}>
                    {subData.status === 'canceling' ? (
                      <View style={styles.cancelStatusContainer}>
                        <Text style={styles.cancelStatusText}>
                          ⏳ Plan cancels on {subData.periodEnd ? new Date(subData.periodEnd).toLocaleDateString() : 'end of cycle'}. Premium remains active until then.
                        </Text>
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity 
                          onPress={handleCancelSubscriptionNative} 
                          style={styles.cancelBtnNative} 
                          disabled={portalLoading} 
                          activeOpacity={0.8}
                        >
                          {portalLoading ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                          ) : (
                            <Text style={styles.cancelBtnNativeText}>Cancel Subscription</Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={handlePortalRedirect} 
                          style={styles.manageBtn} 
                          disabled={portalLoading} 
                          activeOpacity={0.8}
                        >
                          {portalLoading ? (
                            <ActivityIndicator size="small" color={Theme.text} />
                          ) : (
                            <Text style={styles.manageBtnText}>Update Payment Method</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
              <LogOut size={18} color={Theme.text} style={{ marginRight: 10 }} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteBtn} activeOpacity={0.8} disabled={deleting}>
              {deleting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <AlertTriangle size={18} color="#EF4444" style={{ marginRight: 10 }} />
                  <Text style={styles.deleteText}>Delete Account</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Shield size={14} color={Theme.textMuted} />
            <Text style={styles.securityText}>Data is securely protected by SSL encryption.</Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 10, justifyContent: 'center' }}>
              <TouchableOpacity onPress={() => router.push('/privacy' as any)}>
                <Text style={{ fontSize: 12, color: Theme.primary, fontFamily: 'Outfit_500Medium', textDecorationLine: 'underline' }}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 12, color: Theme.textMuted }}>•</Text>
              <TouchableOpacity onPress={() => router.push('/terms' as any)}>
                <Text style={{ fontSize: 12, color: Theme.primary, fontFamily: 'Outfit_500Medium', textDecorationLine: 'underline' }}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <CustomAlert
        visible={deleteAlertVisible}
        title="Delete Account?"
        message="Are you sure you want to permanently delete your account? All your generated images, face profiles, and data will be removed. This action cannot be undone."
        confirmText="Delete Now"
        cancelText="Keep Account"
        type="danger"
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setDeleteAlertVisible(false)}
      />
    </SafeAreaView>
  );
}
