import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Alert, Animated } from 'react-native';
import { Button } from '../ui/Button';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from '../../constants/theme';

interface PermissionGateProps {
  onComplete: () => void;
}

export default function PermissionGate({ onComplete }: PermissionGateProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleRequestPermissions = async () => {
    try {
      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

      if (galleryPermission.granted && cameraPermission.granted) {
        onComplete();
      } else {
        Alert.alert(
          'Permissions Notice',
          'Some features like face uploads will be locked until gallery/camera access is authorized in Settings.',
          [{ text: 'Continue', onPress: onComplete }]
        );
      }
    } catch (err) {
      console.error('[PermissionGate] Failed to request permissions:', err);
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      {/* Animated Lock Badge */}
      <View style={styles.animationContainer}>
        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.iconBox}>
          <Ionicons name="lock-closed-outline" size={30} color={Theme.primary} />
        </View>
      </View>

      <Text style={styles.title}>Camera & Photo Access</Text>
      <Text style={styles.subtitle}>
        We need permissions to let you snap or select selfies to swap onto our preset templates.
      </Text>

      <View style={styles.infoList}>
        <View style={styles.infoRow}>
          <Ionicons name="camera-outline" size={18} color={Theme.secondary} style={styles.infoIcon} />
          <Text style={styles.infoText}>Snap raw faces directly inside our R2 registration scanner.</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="image-outline" size={18} color={Theme.secondary} style={styles.infoIcon} />
          <Text style={styles.infoText}>Pick existing portraits from your photo gallery library.</Text>
        </View>
      </View>

      <Button
        title="Authorize Access"
        onPress={handleRequestPermissions}
        className="max-w-[320px]"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  animationContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 165, 165, 0.08)',
    borderColor: 'rgba(212, 165, 165, 0.2)',
    borderWidth: 1.5,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.surface,
    borderColor: Theme.border,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadow,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: Theme.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  infoList: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    color: Theme.text,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  btnContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    ...Theme.shadow,
  },
  btn: {
    backgroundColor: Theme.primary,
    height: 48,
    borderRadius: 12,
  },
  btnText: {
    color: Theme.surface,
    fontWeight: '800',
    fontSize: 14,
  },
});
