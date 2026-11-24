import React, { useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, Award } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Theme, Fonts } from '../../constants/theme';

interface TemplateHeaderProps {
  title: string;
  thumbnailUrl: string;
  categoryName?: string;
  isPremium?: boolean;
  onBack: () => void;
}

export default function TemplateHeader({ title, thumbnailUrl, categoryName, isPremium, onBack }: TemplateHeaderProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const triggerBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack();
  };

  return (
    <View style={styles.container}>
      {/* Parallax / Hero Cover */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: thumbnailUrl }} style={styles.image} priority="high" />
        <View style={styles.imageOverlay} />
      </View>

      {/* Floating Glassmorphic Back Button */}
      <Animated.View style={[styles.backButtonContainer, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          onPress={triggerBack}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.backButton}
          activeOpacity={0.9}
        >
          <ChevronLeft size={20} color={Theme.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Title block with tags */}
      <View style={styles.infoMeta}>
        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{categoryName || 'Editorial'}</Text>
          </View>
          {isPremium ? (
            <View style={styles.proBadge}>
              <Award size={12} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.proText}>PRO</Text>
            </View>
          ) : (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>FREE</Text>
            </View>
          )}
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Theme.background,
  },
  imageContainer: {
    height: Platform.OS === 'web' ? 220 : 170,
    width: '100%',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'transparent',
  },
  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 16,
    left: 14,
    zIndex: 100,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    ...Theme.shadow,
  },
  infoMeta: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  freeBadge: {
    backgroundColor: Theme.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Theme.surface,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Theme.text,
    letterSpacing: -0.5,
  },
});
