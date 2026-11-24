import React, { useState } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { Theme } from '../../constants/theme';

export default function SocialLogins({ onError }: { onError: (msg: string | null) => void }) {
  const { loginWithGoogle, loginWithApple } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    try {
      setLoading(true);
      onError(null);
      await loginWithGoogle();
    } catch (err: any) {
      if (err.message && err.message.includes('DEVELOPER_ERROR')) {
        onError('Google Sign-In developer config error. Please verify client IDs.');
      } else {
        onError(err.message || 'Google login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    try {
      setLoading(true);
      onError(null);
      await loginWithApple();
    } catch (err: any) {
      onError(err.message || 'Apple login failed');
    } finally {
      setLoading(false);
    }
  };

  const showAppleButton = Platform.OS === 'ios';

  return (
    <View style={styles.socialContainer}>
      <View style={styles.separatorContainer}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>Or Continue With</Text>
        <View style={styles.separatorLine} />
      </View>

      <View style={styles.socialButtons}>
        {showAppleButton && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={9999}
            style={styles.appleButton}
            onPress={handleApple}
          />
        )}

        <Button
          title="Continue with Google"
          variant="outline"
          leftIcon={<Ionicons name="logo-google" size={18} color="#4285F4" />}
          textClassName="text-gray-800 font-semibold"
          onPress={handleGoogle}
          loading={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  socialContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  separatorContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.border,
  },
  separatorText: {
    color: Theme.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialButtons: {
    width: '100%',
    gap: 10,
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
});
