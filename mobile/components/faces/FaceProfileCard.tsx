import React, { useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { FaceProfile } from '../../hooks/useFaces';
import { Theme, Fonts } from '../../constants/theme';

interface FaceProfileCardProps {
  face: FaceProfile;
  onDelete: (face: FaceProfile) => void;
  isDeleting?: boolean;
}

export default function FaceProfileCard({ face, onDelete, isDeleting }: FaceProfileCardProps) {
  const swipeableRef = useRef<Swipeable | null>(null);

  const handleDeletePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    swipeableRef.current?.close();
    onDelete(face);
  };

  const renderRightActions = () => {
    return (
      <TouchableOpacity
        onPress={handleDeletePress}
        style={styles.deleteAction}
        disabled={isDeleting}
        activeOpacity={0.8}
      >
        <Ionicons name="trash" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={1.2}
      rightThreshold={40}
    >
      <View style={styles.profileRow}>
        <View style={styles.profileInfo}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: face.viewUrl }}
              style={styles.profileImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
          </View>
          <View style={styles.profileMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{face.name}</Text>
              <View style={styles.statusBadge}>
                <Ionicons name="lock-closed" size={10} color={Theme.primary} style={{ marginRight: 3 }} />
                <Text style={styles.statusText}>Secure Likeness</Text>
              </View>
            </View>
            <Text style={styles.profileDate}>
              Ready for AI Try-On • {new Date(face.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            swipeableRef.current?.openRight();
          }}
          style={styles.swipeHintButton}
        >
          <Ionicons name="chevron-back" size={16} color={Theme.textMuted} />
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: Theme.surface,
    borderColor: Theme.border,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Theme.shadow,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  profileImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'rgba(230,0,35,0.08)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileMeta: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  profileName: {
    color: Theme.text,
    fontFamily: Fonts.bold,
    fontSize: 15.5,
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 0, 35, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    color: Theme.primary,
    fontFamily: Fonts.semibold,
    fontSize: 9.5,
  },
  profileDate: {
    color: Theme.textMuted,
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
  swipeHintButton: {
    padding: 8,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: '100%',
    borderRadius: 18,
    marginLeft: 8,
  },
});
