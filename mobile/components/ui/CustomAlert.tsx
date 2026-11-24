import React, { useEffect, useRef } from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { AlertTriangle, CheckCircle2, Sparkles, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Theme, Fonts } from '../../constants/theme';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  onConfirm,
  onCancel,
}: CustomAlertProps) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.95);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const getIconDetails = () => {
    switch (type) {
      case 'danger':
        return { IconComponent: Trash2, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)' };
      case 'warning':
        return { IconComponent: AlertTriangle, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' };
      case 'success':
        return { IconComponent: CheckCircle2, color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' };
      case 'info':
      default:
        return { IconComponent: Sparkles, color: Theme.primary, bg: 'rgba(230, 0, 35, 0.06)' };
    }
  };

  const { IconComponent, color, bg } = getIconDetails();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        {onCancel && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              Haptics.selectionAsync();
              onCancel();
            }}
          />
        )}
        <Animated.View
          style={[
            styles.alertBox,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: bg }]}>
            <IconComponent size={26} color={color} />
          </View>

          {/* Content */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            {onCancel && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  onCancel();
                }}
                style={styles.cancelBtn}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onConfirm();
              }}
              style={[
                styles.confirmBtn,
                { backgroundColor: type === 'danger' ? '#EF4444' : Theme.primary },
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#111111',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#111111',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13.5,
    fontFamily: Fonts.medium,
    color: Theme.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  cancelText: {
    color: '#5F5F5F',
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadow,
  },
  confirmText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
});
