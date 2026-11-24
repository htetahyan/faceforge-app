import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme, Fonts } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

interface MultiTemplateBatchBarProps {
  selectedCount: number;
  onGenerateBatch: () => void;
  onClearSelection: () => void;
  isGenerating?: boolean;
}

export const MultiTemplateBatchBar: React.FC<MultiTemplateBatchBarProps> = ({
  selectedCount,
  onGenerateBatch,
  onClearSelection,
  isGenerating = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <View style={styles.floatingContainer}>
      <View style={styles.bar}>
        <View style={styles.infoCol}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{selectedCount}</Text>
          </View>
          <View>
            <Text style={styles.title}>Template Pack Selected</Text>
            <Text style={styles.subtitle}>Generating 1 variation per template</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClearSelection();
            }}
            style={styles.cancelBtn}
          >
            <Ionicons name="close" size={20} color={Theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onGenerateBatch();
            }}
            disabled={isGenerating}
            style={styles.generateBtn}
            activeOpacity={0.85}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.generateBtnText}>Generate Pack ✨</Text>
                <Ionicons name="flash-outline" size={16} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  infoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  title: {
    color: '#FFF',
    fontSize: 13.5,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 6,
  },
  generateBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
});

export default MultiTemplateBatchBar;
