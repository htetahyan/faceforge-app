import React, { useState, useRef } from 'react';
import { StyleSheet, View, PanResponder } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../constants/theme';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  size: number;
}

export default function BeforeAfterSlider({ beforeUrl, afterUrl, size }: BeforeAfterSliderProps) {
  const [sliderX, setSliderX] = useState(size / 2);
  const sliderXRef = useRef(size / 2);
  const startX = useRef(size / 2);
  const lastHapticX = useRef(size / 2);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startX.current = sliderXRef.current;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        const nextX = Math.max(0, Math.min(size, startX.current + gestureState.dx));
        sliderXRef.current = nextX;
        setSliderX(nextX);
        
        // Trigger a tiny haptic click on drag movement
        if (Math.abs(nextX - lastHapticX.current) > 28) {
          Haptics.selectionAsync();
          lastHapticX.current = nextX;
        }
      },
      onPanResponderRelease: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    })
  ).current;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Before Image (Template base) */}
      <Image
        source={{ uri: beforeUrl }}
        style={[styles.image, { width: size, height: size }]}
        contentFit="cover"
      />

      {/* After Image (Face Swapped) clipped by container width */}
      <View style={[styles.maskedContainer, { width: sliderX, height: size }]}>
        <Image
          source={{ uri: afterUrl }}
          style={[styles.image, { width: size, height: size }]}
          contentFit="cover"
        />
      </View>

      {/* Divider line and handle */}
      <View
        style={[styles.divider, { left: sliderX - 15, height: size }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.verticalLine} />
        <View style={styles.handleCircle}>
          <View style={styles.handleArrowLeft} />
          <View style={styles.handleArrowRight} />
        </View>
        <View style={styles.verticalLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FAFAFC',
    borderWidth: 1.5,
    borderColor: Theme.primary,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  maskedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  divider: {
    position: 'absolute',
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  verticalLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: Theme.primary,
  },
  handleCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Theme.primary,
    borderColor: Theme.surface,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 4,
    ...Theme.shadow,
  },
  handleArrowLeft: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderRightWidth: 5,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: Theme.surface,
  },
  handleArrowRight: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 5,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: Theme.surface,
  },
});
