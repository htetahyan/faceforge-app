import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Theme, Fonts } from '../../constants/theme';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export default function ErrorState({
  title = 'Something Went Wrong',
  message = 'Failed to fetch data from server. Please check your connection and try again.',
  onRetry,
  retryText = 'Try Again',
}: ErrorStateProps) {
  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onRetry) onRetry();
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <AlertCircle size={28} color={Theme.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={handleRetry} style={styles.retryBtn} activeOpacity={0.8}>
          <RefreshCw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.retryText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.border,
    marginHorizontal: 16,
    marginVertical: 20,
    gap: 10,
    ...Theme.shadow,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(230, 0, 35, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Theme.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 12.5,
    fontFamily: Fonts.regular,
    color: Theme.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
});
