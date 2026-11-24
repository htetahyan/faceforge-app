import React from 'react';
import { Text, Animated, Pressable } from 'react-native';
import { styles } from './explore.styles';

interface CategoryPillProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export const PinterestPill = React.memo(({ label, isActive, onPress }: CategoryPillProps) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.93,
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
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.pill,
          isActive ? styles.pillActive : styles.pillInactive,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

PinterestPill.displayName = 'PinterestPill';

export default PinterestPill;
