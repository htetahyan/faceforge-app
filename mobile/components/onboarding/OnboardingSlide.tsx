import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import PinterestGrid from './PinterestGrid';
import { Theme, Fonts } from '../../constants/theme';

interface OnboardingSlideProps {
  title: string;
  subtitle: string;
}

export default function OnboardingSlide({ title, subtitle }: OnboardingSlideProps) {
  return (
    <View style={styles.container}>
      {/* Pinterest Grid Visual Wall */}
      <View style={styles.gridWrapper}>
        <PinterestGrid />
      </View>

      {/* Title & Subtitle */}
      <View style={styles.textContainer}>
        <Text style={styles.slideTitle}>{title}</Text>
        <Text style={styles.slideSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  gridWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  textContainer: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  slideTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Theme.text,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  slideSub: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Theme.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
});
