import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme, Fonts } from '../../constants/theme';

interface IntentSelectorProps {
  selectedIntents: string[];
  onToggle: (intent: string) => void;
}

const INTENT_OPTIONS = [
  'Professional Headshots',
  'Creative Art Portraits',
  'Social Media Avatars',
  'Group Portrait Memories',
  'Vintage 90s Style',
  'Cyberpunk Aesthetic',
  'Wedding & Bridal',
  'Corporate Teams',
  'Fitness & Gym',
  'Fashion Editorials',
];

interface IntentItemProps {
  intent: string;
  isSelected: boolean;
  onPress: () => void;
}

function IntentItem({ intent, isSelected, onPress }: IntentItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.05 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 50,
    }).start();
  }, [isSelected, scaleAnim]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.item,
          isSelected ? styles.itemActive : styles.itemInactive,
        ]}
        activeOpacity={0.8}
      >
        <Text style={[styles.itemText, isSelected ? styles.itemTextActive : styles.itemTextInactive]}>
          {intent}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function IntentSelector({ selectedIntents, onToggle }: IntentSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What styles do you love?</Text>
      <Text style={styles.subtitle}>Select at least 3 styles to personalize your feed.</Text>

      <View style={styles.list}>
        {INTENT_OPTIONS.map((intent) => (
          <IntentItem
            key={intent}
            intent={intent}
            isSelected={selectedIntents.includes(intent)}
            onPress={() => onToggle(intent)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Theme.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Theme.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999, // Pill shape
    borderWidth: 1.5,
  },
  itemActive: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primary,
  },
  itemInactive: {
    backgroundColor: Theme.surface,
    borderColor: Theme.border,
  },
  itemText: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
  },
  itemTextActive: {
    color: Theme.surface, // White text for active
  },
  itemTextInactive: {
    color: Theme.text, // Dark text for inactive
  },
});
