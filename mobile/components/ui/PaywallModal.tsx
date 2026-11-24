import React, { useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Play, Sparkles, CheckCircle2, Crown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../constants/theme';
import { styles } from './PaywallModalStyles';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  onWatchAd?: () => void;
  remainingAds?: number;
  isAdLoading?: boolean;
  adCountdown?: number;
}

export default function PaywallModal({
  visible,
  onClose,
  title = '🔒 Unlock Pro AI Studio',
  description = 'Upgrade to GlowUp Pro for unlimited 4K IG Carousels & priority AI generation, or watch a sponsor video for 1 free credit.',
  onWatchAd,
  remainingAds = 5,
  isAdLoading = false,
  adCountdown = 30,
}: PaywallModalProps) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleUpgradePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onClose();
    router.push('/pricing');
  };

  const handleCancel = () => {
    Haptics.selectionAsync();
    onClose();
  };

  const features = [
    '✨ Unlimited 4K IG Carousel & Studio Generations',
    '⚡ 5x Faster VIP Priority Generation Queue',
    '🔓 Unlock All Pro & Group Face Templates',
    '🚫 100% Watermark-Free High Res Exports',
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleCancel}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <Animated.View
          style={[styles.container, { transform: [{ scale: scaleAnim }] }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Badge */}
          <View style={styles.iconCircle}>
            <Crown size={30} color={Theme.primary} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          {/* Feature List */}
          <View style={styles.featuresList}>
            {features.map((item, index) => (
              <View key={index} style={styles.featureItem}>
                <CheckCircle2 size={16} color={Theme.primary} />
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Call to Actions */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleUpgradePress}
              activeOpacity={0.85}
            >
              <Crown size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                Unlock Pro Studio • $9.99/mo
              </Text>
            </TouchableOpacity>

            {onWatchAd && (
              <TouchableOpacity
                style={[
                  styles.adButton,
                  (remainingAds <= 0 || isAdLoading) && styles.adButtonDisabled,
                ]}
                onPress={() => {
                  if (remainingAds > 0 && !isAdLoading) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onWatchAd();
                  }
                }}
                disabled={remainingAds <= 0 || isAdLoading}
                activeOpacity={0.85}
              >
                <View style={styles.adButtonContent}>
                  <Play size={16} color={Theme.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.adButtonText}>
                    {isAdLoading
                      ? `Watching 30s Sponsor Video... (${adCountdown}s)`
                      : remainingAds > 0
                      ? 'Watch 30s Video Ad for +1 Free Credit'
                      : 'Daily Ad Limit Reached (5/5)'}
                  </Text>
                </View>
                {remainingAds > 0 && !isAdLoading && (
                  <View style={styles.adBadge}>
                    <Text style={styles.adBadgeText}>{remainingAds}/5 left</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, justifyContent: 'center', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => { onClose(); router.push('/privacy' as any); }}>
                <Text style={{ fontSize: 11, color: '#9CA3AF', textDecorationLine: 'underline' }}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>•</Text>
              <TouchableOpacity onPress={() => { onClose(); router.push('/terms' as any); }}>
                <Text style={{ fontSize: 11, color: '#9CA3AF', textDecorationLine: 'underline' }}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
