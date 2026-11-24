import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Theme, Fonts } from '../../constants/theme';

export interface ExpressionOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const EXPRESSION_OPTIONS: ExpressionOption[] = [
  { id: 'neutral', name: 'Nonchalant', emoji: '😎', description: 'Cool & confident' },
  { id: 'smile', name: 'Smile', emoji: '🙂', description: 'Warm & natural' },
  { id: 'laugh', name: 'Laugh', emoji: '😂', description: 'Joyful & energetic' },
  { id: 'fierce', name: 'Fierce', emoji: '⚡', description: 'High-fashion look' },
  { id: 'wink', name: 'Wink', emoji: '😉', description: 'Playful & charming' },
];

interface ExpressionSelectorProps {
  selectedExpressionId: string;
  onSelectExpression: (id: string) => void;
}

export default function ExpressionSelector({ selectedExpressionId, onSelectExpression }: ExpressionSelectorProps) {
  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectExpression(id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="happy-outline" size={20} color={Theme.primary} />
        <Text style={styles.title}>Model Face Expressions</Text>
      </View>
      <Text style={styles.subtitle}>
        Sculpt your model&apos;s facial emotions. Choose an aesthetic facial mood below.
      </Text>

      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollTrack}>
        {EXPRESSION_OPTIONS.map((expr) => {
          const isSelected = selectedExpressionId === expr.id;
          return (
            <TouchableOpacity
              key={expr.id}
              onPress={() => handleSelect(expr.id)}
              style={styles.card}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>{expr.emoji}</Text>
              <Text style={styles.name}>{expr.name}</Text>
              <Text style={styles.desc} numberOfLines={1}>{expr.description}</Text>
              {isSelected && <View style={styles.activeBorder} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
  },
  title: {
    color: Theme.text,
    fontFamily: Fonts.bold,
    fontSize: 14.5,
  },
  subtitle: {
    display: 'none',
  },
  scrollTrack: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 4,
    gap: 10,
  },
  card: {
    width: 80,
    height: 74,
    borderRadius: 14,
    backgroundColor: Theme.surface,
    borderColor: Theme.border,
    borderWidth: 1,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Theme.shadow,
  },
  emoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  name: {
    fontSize: 10.5,
    fontFamily: Fonts.bold,
    color: Theme.text,
    textAlign: 'center',
  },
  desc: {
    fontSize: 7.5,
    fontFamily: Fonts.regular,
    color: Theme.textMuted,
    textAlign: 'center',
    marginTop: 1,
    width: '100%',
  },
  activeBorder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderWidth: 2,
    borderColor: Theme.secondary,
    borderRadius: 14,
  },
});
