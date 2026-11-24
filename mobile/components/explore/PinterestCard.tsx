import React from 'react';
import { View, Text, Animated, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './explore.styles';
import { Theme } from '../../constants/theme';

export const isTemplatePremium = (template: any) => {
  if (typeof template?.isPremium === 'boolean') return template.isPremium;
  if (typeof template?.is_premium === 'boolean') return template.is_premium;
  const title = (template?.title || '').toLowerCase();
  return (
    title.includes('luxury') || 
    title.includes('gold') || 
    title.includes('rembrandt') || 
    title.includes('glam') || 
    title.includes('parisian') || 
    title.includes('bedroom')
  );
};

export const PinterestCard = React.memo(({
  template,
  cardWidth,
  onPress,
  isSelected = false,
  isSelectMode = false,
  aspectRatio = 0.85,
}: {
  template: any;
  cardWidth: number;
  onPress: () => void;
  isSelected?: boolean;
  isSelectMode?: boolean;
  aspectRatio?: number;
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const isPremium = isTemplatePremium(template);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      tension: 100,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ width: cardWidth }}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={[styles.cardImageWrap, { aspectRatio }]}>
          <Image
            source={{ uri: template.thumbnailUrl }}
            style={styles.cardImage}
            contentFit="cover"
            priority="high"
            cachePolicy="memory-disk"
            transition={150}
          />
          
          {isSelectMode && (
            <View style={[styles.premiumBadge, { backgroundColor: isSelected ? Theme.primary : 'rgba(0,0,0,0.6)' }]}>
              <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={12} color="#FFFFFF" />
            </View>
          )}

          {!isSelectMode && isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="lock-closed" size={8} color="#FFFFFF" />
              <Text style={styles.premiumBadgeText}>PRO</Text>
            </View>
          )}

          <View style={styles.faceBadge}>
            <Ionicons
              name={template.faceSlots.length > 1 ? 'people' : 'person'}
              size={10}
              color={Theme.textMuted}
            />
            <Text style={styles.faceBadgeText}>
              {template.faceSlots.length} {template.faceSlots.length > 1 ? 'Faces' : 'Face'}
            </Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {template.title}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {template.description || 'Premium photorealistic avatar generation preset.'}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
});

PinterestCard.displayName = 'PinterestCard';

export default PinterestCard;
