import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, FlatList, Modal, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
// @ts-ignore: Legacy expo-file-system import for SDK 54 compatibility
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Theme, Fonts } from '../../constants/theme';

interface CarouselPreviewProps {
  urls: string[];
  templateTitle?: string;
  onClose: () => void;
}

export const CarouselPreview: React.FC<CarouselPreviewProps> = ({
  urls,
  templateTitle = 'Instagram AI Studio',
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width - 48;
  const slideHeight = screenWidth * 1.25;

  const saveImageToGallery = async (url: string, index?: number) => {
    try {
      if (index !== undefined) setSavingIndex(index);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library access is required to save photos.');
        return false;
      }

      const filename = `ig-carousel-${Date.now()}-${(index ?? 0) + 1}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const downloadRes = await FileSystem.downloadAsync(url, fileUri);

      await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (err: any) {
      console.error('Failed to save image:', err);
      Alert.alert('Save Error', err.message || 'Failed to save image.');
      return false;
    } finally {
      if (index !== undefined) setSavingIndex(null);
    }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    let saved = 0;
    for (let i = 0; i < urls.length; i++) {
      const res = await saveImageToGallery(urls[i], i);
      if (res) saved++;
    }
    setIsSavingAll(false);
    if (saved > 0) {
      Alert.alert(
        'IG Carousel Saved! 📸',
        `Successfully saved ${saved} Carousel slides directly to your camera roll.`
      );
    }
  };

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeIndex && index >= 0 && index < urls.length) {
      setActiveIndex(index);
      Haptics.selectionAsync();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="logo-instagram" size={20} color="#E1306C" />
        <Text style={styles.heading}>Instagram Carousel ({urls.length} Slides)</Text>
      </View>
      <Text style={styles.subheading}>{templateTitle}</Text>

      <View style={{ width: screenWidth, height: slideHeight }}>
        <FlatList
          data={urls}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => setZoomUrl(item)}
              style={[styles.slideCard, { width: screenWidth, height: slideHeight }]}
            >
              <Image source={{ uri: item }} style={styles.image} contentFit="cover" />
              <View style={styles.numberBadge}>
                <Text style={styles.numberBadgeText}>
                  Slide {index + 1} / {urls.length}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => saveImageToGallery(item, index)}
                disabled={savingIndex === index}
                style={styles.singleSaveBtn}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={savingIndex === index ? 'checkmark-circle' : 'arrow-down-circle-outline'}
                  size={20}
                  color="#FFF"
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Pagination Dots */}
      <View style={styles.paginationDots}>
        {urls.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={handleSaveAll}
        disabled={isSavingAll}
        style={styles.exportBtn}
        activeOpacity={0.85}
      >
        <Ionicons name="logo-instagram" size={18} color="#FFF" />
        <Text style={styles.exportText}>
          {isSavingAll ? 'Exporting Carousel...' : `Export IG Carousel (${urls.length} Slides)`}
        </Text>
      </TouchableOpacity>

      {/* Zoom Modal */}
      {zoomUrl && (
        <Modal visible={!!zoomUrl} transparent={true} animationType="fade" onRequestClose={() => setZoomUrl(null)}>
          <View style={styles.zoomOverlay}>
            <TouchableOpacity onPress={() => setZoomUrl(null)} style={styles.zoomCloseBtn}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <Image source={{ uri: zoomUrl }} style={styles.zoomImage} contentFit="contain" />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heading: { fontSize: 16, fontFamily: Fonts.bold, color: Theme.text, textAlign: 'center' },
  subheading: { fontSize: 12, fontFamily: Fonts.medium, color: Theme.textMuted, marginTop: 2, marginBottom: 12 },
  slideCard: { borderRadius: 24, overflow: 'hidden', backgroundColor: Theme.surface, position: 'relative', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...Theme.shadow },
  image: { width: '100%', height: '100%' },
  numberBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  numberBadgeText: { color: '#FFF', fontSize: 10, fontFamily: Fonts.bold },
  singleSaveBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.65)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  paginationDots: { flexDirection: 'row', gap: 6, marginVertical: 14, alignItems: 'center' },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 18, backgroundColor: '#E1306C' },
  dotInactive: { width: 6, backgroundColor: 'rgba(0,0,0,0.15)' },
  exportBtn: { width: '100%', height: 48, backgroundColor: '#E1306C', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, ...Theme.shadow },
  exportText: { color: '#FFF', fontSize: 14, fontFamily: Fonts.bold },
  zoomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  zoomCloseBtn: { position: 'absolute', top: 48, right: 24, zIndex: 10, padding: 8 },
  zoomImage: { width: '92%', height: '80%' },
});

export default CarouselPreview;
