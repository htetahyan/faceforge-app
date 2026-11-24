import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Modal, ScrollView, Pressable, TouchableOpacity, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { FaceProfile } from '../../hooks/useFaces';
import { Theme, Fonts } from '../../constants/theme';

interface FaceSelectorModalProps {
  visible: boolean;
  activeSlot: string | null;
  faces: FaceProfile[];
  isLoading: boolean;
  onSelect: (faceId: string) => void;
  onClose: () => void;
  onRedirectToFaces: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FaceSelectorModal({
  visible,
  activeSlot,
  faces,
  isLoading,
  onSelect,
  onClose,
  onRedirectToFaces,
}: FaceSelectorModalProps) {
  const [showModal, setShowModal] = useState(visible);
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowModal(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 16, stiffness: 160, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }),
      ]).start(() => setShowModal(false));
    }
  }, [visible]);

  if (!showModal) return null;

  const handleSelect = (faceId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(faceId);
  };

  return (
    <Modal visible={true} transparent={true} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }]} />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => { Haptics.selectionAsync(); onClose(); }} />
        
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.dragHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Map Face to {activeSlot}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <ChevronLeft size={20} color={Theme.textMuted} style={{ transform: [{ rotate: '-90deg' }] }} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={[styles.modalScrollContent, { paddingBottom: 24 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSubtitle}>Select from your saved Face Profiles to map into this placeholder:</Text>

            {isLoading && <ActivityIndicator size="large" color={Theme.primary} style={{ marginTop: 16 }} />}

            {!isLoading && (
              <View style={styles.gridContainer}>
                {faces.length === 0 ? (
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyText}>No Face Profiles registered yet.</Text>
                    <TouchableOpacity onPress={onRedirectToFaces} style={styles.modalRegisterButton} activeOpacity={0.8}>
                      <Text style={styles.modalRegisterButtonText}>Register New Face Profile</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.grid}>
                    {faces.map((face) => (
                      <TouchableOpacity
                        key={face.id}
                        onPress={() => handleSelect(face.id)}
                        style={styles.card}
                        activeOpacity={0.9}
                      >
                        <View style={styles.imageContainer}>
                          <Image source={{ uri: face.viewUrl }} style={styles.image} />
                        </View>
                        <View style={styles.cardMeta}>
                          <Text style={styles.faceName} numberOfLines={1}>{face.name}</Text>
                          <Text style={styles.photoCount}>{face.r2Keys?.length || 1} Scans</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.background,
    borderColor: Theme.border,
    borderTopWidth: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '75%',
    ...Theme.shadow,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Theme.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: Theme.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 24,
    gap: 16,
  },
  modalSubtitle: {
    color: Theme.textMuted,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    marginBottom: 4,
  },
  gridContainer: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  card: {
    width: '47%',
    backgroundColor: Theme.surface,
    borderColor: Theme.border,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...Theme.shadow,
  },
  imageContainer: {
    height: 120,
    width: '100%',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardMeta: {
    padding: 10,
    gap: 2,
  },
  faceName: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Theme.text,
  },
  photoCount: {
    fontSize: 10.5,
    fontFamily: Fonts.semibold,
    color: Theme.primary,
  },
  modalEmpty: {
    gap: 12,
    alignItems: 'center',
    paddingVertical: 32,
    width: '100%',
  },
  modalEmptyText: {
    color: Theme.textMuted,
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  modalRegisterButton: {
    backgroundColor: Theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    ...Theme.shadow,
  },
  modalRegisterButtonText: {
    color: Theme.surface,
    fontFamily: Fonts.bold,
    fontSize: 13.5,
  },
});
