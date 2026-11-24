import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Check, X, Sparkles } from 'lucide-react-native';
import { Theme } from '../../constants/theme';

export default function FaceGuidelinesCard() {
  return (
    <View style={styles.guidelinesBox}>
      <View style={styles.header}>
        <Sparkles size={16} color={Theme.primary} />
        <Text style={styles.title}>Selfie Guidelines</Text>
      </View>

      <View style={styles.content}>
        {/* Good rules */}
        <View style={styles.row}>
          <Check size={14} color="#10B981" style={styles.icon} />
          <Text style={styles.text}>Clear, well-lit single portrait</Text>
        </View>
        <View style={styles.row}>
          <Check size={14} color="#10B981" style={styles.icon} />
          <Text style={styles.text}>Looking straight at camera</Text>
        </View>

        {/* Bad rules */}
        <View style={styles.row}>
          <X size={14} color="#EF4444" style={styles.icon} />
          <Text style={styles.text}>No hats, sunglasses, or blur</Text>
        </View>
        <View style={styles.row}>
          <X size={14} color="#EF4444" style={styles.icon} />
          <Text style={styles.text}>No group photos or cropping</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  guidelinesBox: {
    backgroundColor: Theme.surface,
    borderColor: Theme.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    ...Theme.shadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    color: Theme.text,
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginTop: 1,
  },
  text: {
    color: Theme.text,
    fontSize: 12,
    fontWeight: '500',
  },
});
