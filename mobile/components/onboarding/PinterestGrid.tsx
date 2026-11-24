import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Image } from 'react-native';
import { Theme } from '../../constants/theme';

const CARD_WIDTH = 110;
const CARD_HEIGHT = 150;
const GAP = 12;

const ROW1_IMAGES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400',
  // Duplicate for seamless loop
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400',
];

const ROW2_IMAGES = [
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=400',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=400',
  // Duplicate for seamless loop
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=400',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400',
];

export default function PinterestGrid() {
  const scrollAnim1 = useRef(new Animated.Value(0)).current;
  const scrollAnim2 = useRef(new Animated.Value(0)).current;

  // Track total loop width
  const loopWidth = (CARD_WIDTH + GAP) * 4;

  useEffect(() => {
    // Row 1 slides left
    const anim1 = Animated.loop(
      Animated.timing(scrollAnim1, {
        toValue: -loopWidth,
        duration: 18000,
        useNativeDriver: true,
        isInteraction: false,
      })
    );
    anim1.start();

    // Row 2 slides right (starts offset, slides back)
    const anim2 = Animated.loop(
      Animated.timing(scrollAnim2, {
        toValue: loopWidth,
        duration: 20000,
        useNativeDriver: true,
        isInteraction: false,
      })
    );
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, [scrollAnim1, scrollAnim2, loopWidth]);

  return (
    <View style={styles.gridContainer}>
      {/* Row 1 */}
      <View style={styles.rowWrapper}>
        <Animated.View style={[styles.row, { transform: [{ translateX: scrollAnim1 }] }]}>
          {ROW1_IMAGES.map((uri, idx) => (
            <Image key={`r1-${idx}`} source={{ uri }} style={styles.card} />
          ))}
        </Animated.View>
      </View>

      {/* Row 2 */}
      <View style={styles.rowWrapper}>
        <Animated.View style={[styles.row, { transform: [{ translateX: Animated.subtract(scrollAnim2, loopWidth) }] }]}>
          {ROW2_IMAGES.map((uri, idx) => (
            <Image key={`r2-${idx}`} source={{ uri }} style={styles.card} />
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    height: 320,
    width: '100%',
    justifyContent: 'center',
    gap: GAP,
    position: 'relative',
    overflow: 'hidden',
  },
  rowWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
    width: 2000, // Extra width for rendering loop
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#F3F2F5',
  },
});
