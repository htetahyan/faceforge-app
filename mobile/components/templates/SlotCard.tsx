import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { UserPlus, Check } from 'lucide-react-native';
import { FaceProfile } from '../../hooks/useFaces';
import { Theme } from '../../constants/theme';

interface SlotCardProps {
  slotName: string;
  mappedFace?: FaceProfile;
  onPress: () => void;
}

export default function SlotCard({ slotName, mappedFace, onPress }: SlotCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.slotCard,
        mappedFace ? styles.slotCardMapped : styles.slotCardUnmapped,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.slotLeft}>
        {mappedFace ? (
          <View style={styles.slotImageWrapper}>
            <Image source={{ uri: mappedFace.viewUrl }} style={styles.slotImage} />
          </View>
        ) : (
          <View style={styles.slotImagePlaceholder}>
            <UserPlus size={16} color={Theme.textMuted} />
          </View>
        )}
        <View style={styles.slotMeta}>
          <Text style={styles.slotName}>{slotName}</Text>
          <Text style={[styles.slotState, mappedFace ? styles.slotStateMapped : styles.slotStateUnmapped]}>
            {mappedFace ? `Assigned: ${mappedFace.name}` : 'Unassigned (Tap to select)'}
          </Text>
        </View>
      </View>

      {mappedFace && (
        <View style={styles.checkBadge}>
          <Check size={12} color={Theme.surface} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  slotCard: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Theme.shadow,
  },
  slotCardMapped: {
    backgroundColor: 'rgba(212, 165, 165, 0.08)',
    borderColor: Theme.primary,
  },
  slotCardUnmapped: {
    backgroundColor: Theme.surface,
    borderColor: Theme.border,
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  slotImageWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  slotImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    borderColor: Theme.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotMeta: {
    flex: 1,
    gap: 2,
  },
  slotName: {
    color: Theme.text,
    fontWeight: '700',
    fontSize: 14,
  },
  slotState: {
    fontSize: 12,
  },
  slotStateMapped: {
    color: Theme.secondary,
    fontWeight: '600',
  },
  slotStateUnmapped: {
    color: Theme.textMuted,
  },
  checkBadge: {
    backgroundColor: Theme.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
