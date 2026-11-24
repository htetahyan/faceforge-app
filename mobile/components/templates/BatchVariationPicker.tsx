import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme, Fonts } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

interface BatchVariationPickerProps {
  count: number;
  onCountChange: (count: number) => void;
  autoMix: boolean;
  onAutoMixChange: (mix: boolean) => void;
  aspectRatio?: '4:5' | '1:1' | '9:16';
  onAspectRatioChange?: (ratio: '4:5' | '1:1' | '9:16') => void;
}

export const BatchVariationPicker: React.FC<BatchVariationPickerProps> = ({
  count,
  onCountChange,
  autoMix,
  onAutoMixChange,
  aspectRatio = '1:1',
  onAspectRatioChange,
}) => {
  const countOptions = [
    { label: '1 Photo', value: 1, badge: 'Portrait 📸' },
    { label: '3 Slides', value: 3, badge: 'IG Carousel ✨' },
    { label: '5 Slides', value: 5, badge: 'Pro Carousel 🔥' },
  ];

  const ratioOptions: ('4:5' | '1:1' | '9:16')[] = ['1:1', '4:5', '9:16'];

  const handleSelectCount = (val: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCountChange(val);
  };

  const handleSelectRatio = (ratio: '4:5' | '1:1' | '9:16') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onAspectRatioChange) onAspectRatioChange(ratio);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="logo-instagram" size={20} color="#E1306C" />
          <Text style={styles.title}>Instagram Carousel Studio</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count} Carousel Slides</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Generate multi-slide variations tailored for high-engagement Instagram carousels & stories.
      </Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Carousel Slide Count</Text>
      </View>
      <View style={styles.optionsRow}>
        {countOptions.map((opt) => {
          const isSelected = count === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => handleSelectCount(opt.value)}
              activeOpacity={0.8}
              style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
            >
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                {opt.label}
              </Text>
              <Text style={[styles.optionBadge, isSelected && styles.optionBadgeSelected]}>
                {opt.badge}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Instagram Aspect Ratio</Text>
      </View>
      <View style={styles.ratioRow}>
        {ratioOptions.map((r) => {
          const isSelected = aspectRatio === r;
          return (
            <TouchableOpacity
              key={r}
              onPress={() => handleSelectRatio(r)}
              activeOpacity={0.8}
              style={[styles.ratioBtn, isSelected && styles.ratioBtnSelected]}
            >
              <Text style={[styles.ratioText, isSelected && styles.ratioTextSelected]}>
                {r === '1:1' ? '1:1 Square' : r === '4:5' ? '4:5 Portrait' : '9:16 Story'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.mixRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.mixTitle}>Multi-Angle Camera & Outfit Mix</Text>
          <Text style={styles.mixSubtitle}>
            Mix close-up, medium shot, editorial lighting, and outfit variations for the perfect carousel flow.
          </Text>
        </View>
        <Switch
          value={autoMix}
          onValueChange={(val) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAutoMixChange(val);
          }}
          trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#E1306C' }}
          thumbColor="#FFF"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...Theme.shadow,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 13, fontFamily: Fonts.bold, color: Theme.text },
  subtitle: { display: 'none' },
  badge: { backgroundColor: 'rgba(225,48,108,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10.5, fontFamily: Fonts.bold, color: '#E1306C' },
  sectionHeader: { marginTop: 4, marginBottom: 4 },
  sectionTitle: { fontSize: 10.5, fontFamily: Fonts.bold, color: Theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  optionBtn: { flex: 1, paddingVertical: 7, paddingHorizontal: 4, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 1.5, borderColor: 'transparent', alignItems: 'center' },
  optionBtnSelected: { backgroundColor: 'rgba(225,48,108,0.06)', borderColor: '#E1306C' },
  optionLabel: { fontSize: 11.5, fontFamily: Fonts.bold, color: Theme.textMuted },
  optionLabelSelected: { color: '#E1306C' },
  optionBadge: { fontSize: 9, fontFamily: Fonts.medium, color: Theme.textMuted, marginTop: 1 },
  optionBadgeSelected: { color: '#E1306C' },
  ratioRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  ratioBtn: { flex: 1, paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  ratioBtnSelected: { backgroundColor: Theme.surface, borderColor: '#E1306C' },
  ratioText: { fontSize: 10.5, fontFamily: Fonts.bold, color: Theme.textMuted },
  ratioTextSelected: { color: '#E1306C' },
  mixRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', gap: 12 },
  mixTitle: { fontSize: 11.5, fontFamily: Fonts.bold, color: Theme.text },
  mixSubtitle: { display: 'none' },
});

export default BatchVariationPicker;
