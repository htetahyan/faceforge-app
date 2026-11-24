import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles, Play, ShieldAlert } from 'lucide-react-native';
import * as SecureStore from '../../services/secureStore';
import { api } from '../../services/api';
import { Theme, Fonts } from '../../constants/theme';

interface RewardedAdModalProps {
  visible: boolean;
  onRewardEarned: () => void;
  onClose: () => void;
}

export default function RewardedAdModal({ visible, onRewardEarned, onClose }: RewardedAdModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [isAdFinished, setIsAdFinished] = useState(false);
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    
    // Reset states on show
    setCountdown(5);
    setIsAdFinished(false);
    setGranting(false);

    // Start 5-second countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsAdFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  const handleClaimReward = async () => {
    try {
      setGranting(true);

      // 1. Call backend to decrement usage (giving the user 1 free credit)
      await api.post('/api/revenuecat/grant-ad-credit');

      // 2. Increment client-side daily ad watch count
      const today = new Date().toDateString();
      const storedCount = await SecureStore.getItemAsync('ad_watch_count_date');
      let count = 0;

      if (storedCount === today) {
        const countStr = await SecureStore.getItemAsync('ad_watch_count_val');
        count = parseInt(countStr || '0', 10);
      }

      await SecureStore.setItemAsync('ad_watch_count_date', today);
      await SecureStore.setItemAsync('ad_watch_count_val', (count + 1).toString());

      onRewardEarned();
    } catch (err) {
      console.error('[Ad Reward] Failed to grant credit:', err);
      alert('Failed to grant generation credit. Please try again.');
    } finally {
      setGranting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.adContent}>
          {/* Top Bar showing progress */}
          <View style={styles.topRow}>
            <View style={styles.badge}>
              <Play size={10} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>Sponsor Video</Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>
                {isAdFinished ? 'Reward Ready!' : `Skip in ${countdown}s`}
              </Text>
            </View>
          </View>

          {/* Ad Canvas (Sponsor Mockup) */}
          <View style={styles.canvas}>
            <Sparkles size={48} color={Theme.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.sponsorTitle}>GlowUp AI Pro Editor</Text>
            <Text style={styles.sponsorBody}>
              Get unlimited access to ultra-high-resolution portrait outputs, custom filters, and 50+ face slot matching templates.
            </Text>
            
            <View style={styles.demoCard}>
              <View style={styles.bulletRow}>
                <View style={styles.bulletPoint} />
                <Text style={styles.bulletText}>Watermark Removed</Text>
              </View>
              <View style={styles.bulletRow}>
                <View style={styles.bulletPoint} />
                <Text style={styles.bulletText}>High-Definition 4K Resolution</Text>
              </View>
              <View style={styles.bulletRow}>
                <View style={styles.bulletPoint} />
                <Text style={styles.bulletText}>Priority Processing Speeds</Text>
              </View>
            </View>
          </View>

          {/* Bottom Call to Action / Close button */}
          <View style={styles.footer}>
            {isAdFinished ? (
              <TouchableOpacity
                onPress={handleClaimReward}
                disabled={granting}
                style={styles.claimButton}
                activeOpacity={0.8}
              >
                {granting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.claimButtonText}>Claim Generation Credit ✨</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.waitingContainer}>
                <ActivityIndicator size="small" color={Theme.primary} />
                <Text style={styles.waitingText}>Watching ad to unlock free credit...</Text>
              </View>
            )}
            
            {isAdFinished && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Skip Reward</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 17, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adContent: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    gap: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#111111',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Fonts.semibold,
  },
  timerBadge: {
    backgroundColor: 'rgba(230, 0, 35, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    color: Theme.primary,
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  canvas: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sponsorTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#111111',
    textAlign: 'center',
  },
  sponsorBody: {
    fontSize: 12,
    color: Theme.textMuted,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  demoCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFEFEF',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
    width: '100%',
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.primary,
  },
  bulletText: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: '#111111',
  },
  footer: {
    gap: 12,
  },
  claimButton: {
    backgroundColor: Theme.primary,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  waitingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    gap: 8,
  },
  waitingText: {
    color: Theme.textMuted,
    fontSize: 12,
    fontFamily: Fonts.semibold,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  closeBtnText: {
    color: Theme.textMuted,
    fontSize: 12,
    fontFamily: Fonts.semibold,
    textDecorationLine: 'underline',
  },
});
