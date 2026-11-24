import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Animated, Modal, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFaces } from '../../hooks/useFaces';
import { Theme, Fonts } from '../../constants/theme';

export default function AddFaceModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { faces, registerFace, isRegistering } = useFaces();
  const insets = useSafeAreaInsets();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const scanAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (visible && selectedImages.length === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
          Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 4000, useNativeDriver: true })
      ).start();
    }
  }, [visible, selectedImages, scanAnim, rotateAnim]);

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Access is required to select photos.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          selectionLimit: 3 - selectedImages.length,
          quality: 0.85,
         });

    if (!result.canceled && result.assets) {
      const uris = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...uris].slice(0, 3));
    }
  };

  const handleSave = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('Validation Error', 'Please select or take at least 1 photo.');
      return;
    }
    try {
      setUploadProgress(0.01);
      const finalName = faces.length === 0 ? 'My Face' : `Face #${faces.length + 1}`;
      await registerFace({
        name: finalName,
        localUris: selectedImages,
        onProgress: (p) => setUploadProgress(p),
      });
      setSelectedImages([]);
      setUploadProgress(0);
      onClose();
      Alert.alert('Success', 'Face profile successfully registered!');
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to upload.');
      setUploadProgress(0);
    }
  };

  const scanLineTop = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 130] });
  const rotateDeg = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => { if (!isRegistering) onClose(); }}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            if (!isRegistering) {
              Haptics.selectionAsync();
              onClose();
            }
          }}
        />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardView}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.dragHandle} />
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Face Profile</Text>
              <TouchableOpacity onPress={onClose} disabled={isRegistering} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.form, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
              {selectedImages.length > 0 ? (
                <View style={styles.previewContainer}>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {selectedImages.map((uri, idx) => (
                      <View key={idx} style={{ position: 'relative' }}>
                        <Image source={{ uri }} style={styles.preview} />
                        <TouchableOpacity
                          style={styles.removePhotoBtn}
                          onPress={() => setSelectedImages((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={isRegistering}
                        >
                          <Ionicons name="close-circle" size={18} color={Theme.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {selectedImages.length < 3 && (
                      <TouchableOpacity style={styles.miniAddBtn} onPress={() => pickImage(false)} disabled={isRegistering}>
                        <Ionicons name="add" size={24} color={Theme.textMuted} />
                        <Text style={{ fontSize: 10, color: Theme.textMuted, fontFamily: Fonts.bold }}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity style={styles.clearBtn} onPress={() => setSelectedImages([])} disabled={isRegistering}>
                    <Text style={styles.clearText}>Clear All ({selectedImages.length}/3)</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.scannerBox}>
                  <Animated.View style={[styles.scannerInner, { transform: [{ rotate: rotateDeg }] }]}>
                    <Ionicons name="sparkles" size={32} color={Theme.secondary} style={styles.sparkleIcon} />
                  </Animated.View>
                  <View style={styles.faceOutline} />
                  <Animated.View style={[styles.scannerLine, { top: scanLineTop }]} />
                </View>
              )}

              {selectedImages.length === 0 && (
                <View style={styles.pickButtons}>
                  <TouchableOpacity onPress={() => pickImage(true)} style={styles.pickBtn} disabled={isRegistering}>
                    <Ionicons name="camera-outline" size={18} color={Theme.primary} />
                    <Text style={styles.pickText}>Camera Scan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => pickImage(false)} style={styles.pickBtn} disabled={isRegistering}>
                    <Ionicons name="image-outline" size={18} color={Theme.secondary} />
                    <Text style={styles.pickText}>Photo Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isRegistering && (
                <View style={styles.progressBox}>
                  <View style={styles.progressHeader}>
                    <ActivityIndicator size="small" color={Theme.primary} />
                    <Text style={styles.progressStatus}>Uploading face profile...</Text>
                    <Text style={styles.progressPercent}>{Math.round(uploadProgress * 100)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${uploadProgress * 100}%` }]} />
                  </View>
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity onPress={onClose} style={styles.cancelBtn} disabled={isRegistering}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={isRegistering}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveText}>{isRegistering ? 'Uploading...' : 'Save Face'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  keyboardView: { width: '100%' },
  modalContent: { backgroundColor: Theme.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, ...Theme.shadow },
  dragHandle: { width: 40, height: 4, backgroundColor: Theme.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalTitle: { fontSize: 18, fontFamily: Fonts.bold, color: Theme.text },
  closeBtn: { padding: 4 },
  form: { padding: 24, gap: 16, paddingBottom: Platform.OS === 'ios' ? 44 : 28 },
  scannerBox: { height: 140, width: 140, borderRadius: 70, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: Theme.border, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  faceOutline: { width: 80, height: 100, borderRadius: 40, borderStyle: 'dashed', borderWidth: 2, borderColor: Theme.secondary, opacity: 0.5 },
  scannerLine: { position: 'absolute', left: 10, right: 10, height: 3, backgroundColor: Theme.primary },
  scannerInner: { position: 'absolute', top: 12, right: 12 },
  sparkleIcon: { opacity: 0.8 },
  previewContainer: { alignSelf: 'center', alignItems: 'center', gap: 12 },
  preview: { width: 80, height: 80, borderRadius: 16, borderWidth: 1.5, borderColor: Theme.primary },
  removePhotoBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: Theme.surface, borderRadius: 10 },
  miniAddBtn: { width: 80, height: 80, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1.5, borderColor: Theme.border, justifyContent: 'center', alignItems: 'center', gap: 4, backgroundColor: Theme.surface },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderColor: Theme.border, borderWidth: 1, backgroundColor: Theme.surface },
  clearText: { color: Theme.text, fontSize: 11, fontWeight: '700' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.surface, borderColor: Theme.border, borderWidth: 1, borderRadius: 12, height: 48, paddingHorizontal: 12, ...Theme.shadow },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, height: '100%', color: Theme.text, fontFamily: Fonts.medium, fontSize: 14 },
  pickButtons: { flexDirection: 'row', gap: 10 },
  pickBtn: { flex: 1, height: 48, backgroundColor: Theme.surface, borderColor: Theme.border, borderWidth: 1, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, ...Theme.shadow },
  pickText: { color: Theme.text, fontSize: 13, fontFamily: Fonts.bold },
  progressBox: { backgroundColor: 'rgba(212,165,165,0.05)', padding: 12, borderRadius: 12, gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressStatus: { color: Theme.text, fontSize: 11, fontWeight: '700', flex: 1, marginLeft: 6 },
  progressPercent: { color: Theme.primary, fontSize: 12, fontWeight: '800' },
  progressBar: { height: 6, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Theme.primary, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderColor: Theme.border, borderWidth: 1 },
  cancelText: { color: Theme.text, fontFamily: Fonts.semibold },
  saveBtn: { flex: 1, height: 48, backgroundColor: Theme.primary, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', ...Theme.shadow },
  saveText: { color: Theme.surface, fontFamily: Fonts.bold, fontSize: 14 },
});
