import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FaceProfile } from '../../hooks/useFaces';
import { Theme, Fonts } from '../../constants/theme';

interface SlotMapperProps {
  faceSlots: string[];
  mappings: Record<string, string>;
  faces: FaceProfile[];
  onSlotPress: (slotName: string) => void;
  setupStatus: string;
}

export default function SlotMapper({ faceSlots, mappings, faces, onSlotPress, setupStatus }: SlotMapperProps) {
  const handlePress = (slot: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSlotPress(slot);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="people-outline" size={20} color={Theme.primary} />
          <Text style={styles.title}>Studio Placement Mapping</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{setupStatus}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Map your saved Face Profiles to decide who goes into which position in this photo.
      </Text>

      <View style={styles.slotsRow}>
        {faceSlots.map((slot) => {
          const faceId = mappings[slot];
          const face = faces.find((f) => f.id === faceId);

          return (
            <TouchableOpacity
              key={slot}
              onPress={() => handlePress(slot)}
              style={styles.slotButton}
              activeOpacity={0.8}
            >
              <View style={[styles.avatarBox, face ? styles.avatarBoxActive : styles.avatarBoxEmpty]}>
                {face ? (
                  <Image source={{ uri: face.viewUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person-add" size={24} color={Theme.primary} style={styles.addIcon} />
                )}
                {face && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFF" />
                  </View>
                )}
              </View>
              <Text style={styles.slotName}>{slot}</Text>
              <Text style={styles.profileName} numberOfLines={1}>
                {face ? face.name : 'Tap to Map'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: Theme.text,
    fontFamily: Fonts.bold,
    fontSize: 14.5,
  },
  badge: {
    backgroundColor: 'rgba(230, 0, 35, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(230, 0, 35, 0.1)',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Theme.primary,
  },
  subtitle: {
    display: 'none',
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
    justifyContent: 'flex-start',
  },
  slotButton: {
    alignItems: 'center',
    width: 64,
    gap: 2,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Theme.shadow,
  },
  avatarBoxActive: {
    borderWidth: 2,
    borderColor: Theme.secondary,
    backgroundColor: Theme.surface,
  },
  avatarBoxEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(230, 0, 35, 0.3)',
    backgroundColor: 'rgba(230, 0, 35, 0.02)',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  addIcon: {
    opacity: 0.85,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: Theme.secondary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  slotName: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  profileName: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Theme.text,
    textAlign: 'center',
    width: '100%',
  },
});
