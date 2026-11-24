import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Share, Alert } from 'react-native';
import { Download, Share2 } from 'lucide-react-native';
// @ts-ignore: Legacy expo-file-system imports for SDK 52+
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Theme } from '../../constants/theme';

interface CompletedActionsProps {
  outputUrl: string | null;
  activeIndex: number;
  onReturn: () => void;
}

export default function CompletedActions({ outputUrl, activeIndex, onReturn }: CompletedActionsProps) {
  const urls = outputUrl ? outputUrl.split(',') : [];
  const activeUrl = urls[activeIndex] || urls[0] || null;

  const handleSave = async () => {
    if (!activeUrl) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GlowUp needs access to your photo library to save images.');
        return;
      }
      
      // Download the image to a temporary file
      const fileUri = FileSystem.documentDirectory + `glowup_${Date.now()}.jpg`;
      const downloadRes = await FileSystem.downloadAsync(activeUrl, fileUri);
      
      // Save it to the native camera roll
      await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
      
      Alert.alert(
        'Saved Successfully',
        'This AI masterpiece has been processed and saved directly to your native Camera Roll / Photo Library! 📸'
      );
    } catch (err) {
      console.error('Error saving to gallery:', err);
      Alert.alert('Download Failed', 'Failed to save image. Please verify device permissions.');
    }
  };

  const handleShare = async () => {
    if (!activeUrl) return;
    try {
      await Share.share({
        message: `Check out my new AI-generated portrait from SocialTemp.AI! ✨ ${activeUrl}`,
        url: activeUrl,
        title: 'My AI Masterpiece',
      });
    } catch (err) {
      console.log('Error sharing masterpiece:', err);
    }
  };

  const [isFlagged, setIsFlagged] = React.useState(false);

  const handleFlag = () => {
    Alert.alert(
      "Report Objectionable Content",
      "If you believe this AI generated portrait contains offensive, sexually explicit, harmful, or deepfake content violating our EULA policies, please flag it. Our moderation team will review this output within 24 hours.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Report Content", 
          style: "destructive",
          onPress: () => {
            setIsFlagged(true);
            Alert.alert(
              "Report Received", 
              "Thank you for reporting. This output has been flagged, and our system has hidden it from any history. Our moderation team will audit this profile within 24 hours."
            );
          }
        }
      ]
    );
  };

  return (
    <View style={styles.actionsFooter}>
      <TouchableOpacity onPress={handleSave} style={styles.saveLibraryButton} activeOpacity={0.8}>
        <Download size={16} color={Theme.surface} style={{ marginRight: 6 }} />
        <Text style={styles.saveLibraryButtonText}>Save to Photo Library</Text>
      </TouchableOpacity>

      <View style={styles.shareButtonsRow}>
        <TouchableOpacity onPress={handleShare} style={styles.shareMasterpieceButton} activeOpacity={0.8}>
          <Share2 size={14} color={Theme.text} style={{ marginRight: 6 }} />
          <Text style={styles.shareMasterpieceButtonText}>Share Portrait</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onReturn} style={styles.createMoreButton} activeOpacity={0.8}>
          <Text style={styles.createMoreButtonText}>Create More</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        onPress={handleFlag} 
        style={styles.flagButton} 
        activeOpacity={0.8}
        disabled={isFlagged}
      >
        <Text style={[styles.flagButtonText, isFlagged && { color: '#EF4444', fontWeight: '700' }]}>
          ⚠️ {isFlagged ? "Content Flagged & Hidden" : "Flag / Report Inappropriate Image"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsFooter: {
    gap: 8,
    width: '100%',
    maxWidth: 400,
  },
  saveLibraryButton: {
    backgroundColor: Theme.primary,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadow,
  },
  saveLibraryButtonText: {
    color: Theme.surface,
    fontWeight: '800',
    fontSize: 15,
  },
  shareButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  shareMasterpieceButton: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderColor: Theme.border,
    borderWidth: 1,
    height: 45,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadow,
  },
  shareMasterpieceButtonText: {
    color: Theme.text,
    fontWeight: '700',
    fontSize: 14,
  },
  createMoreButton: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderColor: Theme.border,
    borderWidth: 1,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadow,
  },
  createMoreButtonText: {
    color: Theme.text,
    fontWeight: '700',
    fontSize: 14,
  },
  flagButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  flagButtonText: {
    fontSize: 12,
    color: Theme.textMuted,
    fontWeight: '500',
  },
});
