import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import FaceProfileCard from '../../components/faces/FaceProfileCard';
import AddFaceModal from '../../components/faces/AddFaceModal';
import CustomAlert from '../../components/ui/CustomAlert';
import { useFaces, FaceProfile } from '../../hooks/useFaces';
import { Theme, Fonts } from '../../constants/theme';
import { useToast } from '../../components/ui/Toast';
import Skeleton from '../../components/ui/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SIZE = (SCREEN_WIDTH - 48 - 12) / 2;

export default function FacesScreen() {
  const { faces, isLoading, deleteFace, isDeleting } = useFaces();
  const [modalOpen, setModalOpen] = useState(false);
  const { showToast } = useToast();

  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [faceToDelete, setFaceToDelete] = useState<FaceProfile | null>(null);

  const handleDelete = (face: FaceProfile) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setFaceToDelete(face);
    setDeleteAlertVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!faceToDelete) return;
    setDeleteAlertVisible(false);
    try {
      await deleteFace(faceToDelete.id);
      showToast('Face profile deleted.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete face.', 'error');
    } finally {
      setFaceToDelete(null);
    }
  };

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalOpen(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Faces</Text>
            <Text style={styles.headerSub}>
              {faces.length === 0
                ? 'Add a face to start generating'
                : `${faces.length} profile${faces.length !== 1 ? 's' : ''} registered`}
            </Text>
          </View>
          {faces.length > 0 && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddPress} activeOpacity={0.8}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {isLoading && (
          <View style={styles.gridContainer}>
            {Array.from({ length: 2 }).map((_, i) => (
              <View key={i} style={styles.skeletonCard}>
                <Skeleton width={CARD_SIZE} height={CARD_SIZE} borderRadius={20} />
              </View>
            ))}
          </View>
        )}

        {!isLoading && faces.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="person-outline" size={36} color={Theme.primary} />
            </View>
            <Text style={styles.emptyTitle}>No faces yet</Text>
            <Text style={styles.emptySub}>
              Upload 1–3 clear selfies. Your face profiles stay private and are used only for AI generation.
            </Text>
            <TouchableOpacity style={styles.registerFirstBtn} onPress={handleAddPress} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.registerFirstText}>Add My First Face</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && faces.length > 0 && (
          <View style={styles.listContainer}>
            {faces.map((face) => (
              <FaceProfileCard key={face.id} face={face} onDelete={handleDelete} isDeleting={isDeleting} />
            ))}
          </View>
        )}
      </ScrollView>

      <AddFaceModal visible={modalOpen} onClose={() => setModalOpen(false)} />
      <CustomAlert
        visible={deleteAlertVisible}
        title="Delete Face Profile?"
        message={`Permanently delete "${faceToDelete?.name || ''}"? Generations using this face will fail.`}
        confirmText="Delete"
        cancelText="Keep"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteAlertVisible(false);
          setFaceToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.background },
  scrollContent: { paddingBottom: 40 },
  headerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: { fontSize: 28, fontFamily: Fonts.bold, color: Theme.text, letterSpacing: -0.5 },
  headerSub: { color: Theme.textMuted, fontSize: 13, fontFamily: Fonts.regular, marginTop: 4 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadow,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  skeletonCard: { width: CARD_SIZE },
  listContainer: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  emptyCard: {
    margin: 16,
    padding: 32,
    backgroundColor: Theme.surfaceElevated,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
  },
  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(230, 0, 35, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { color: Theme.text, fontFamily: Fonts.bold, fontSize: 18 },
  emptySub: {
    color: Theme.textMuted,
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  registerFirstBtn: {
    flexDirection: 'row',
    backgroundColor: Theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 9999,
    marginTop: 8,
    alignItems: 'center',
    ...Theme.shadow,
  },
  registerFirstText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: 15 },
});
