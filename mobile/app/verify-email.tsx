import React, { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Theme } from '../constants/theme';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/Toast';
import { styles } from '../components/auth/verify-email-styles';

export default function VerifyEmailScreen() {
  const { user, verifyEmail, resendVerification, logout } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyCode = async (codeToVerify: string) => {
    const trimmedOtp = codeToVerify.trim();
    if (trimmedOtp.length !== 6 || isNaN(Number(trimmedOtp))) {
      setErrorMsg('Please enter a valid 6-digit code');
      showToast('Please enter a valid 6-digit code', 'error');
      return;
    }

    try {
      setVerifying(true);
      setErrorMsg(null);
      await verifyEmail(trimmedOtp);
      showToast('Email verified successfully! Welcome to GlowUp AI.', 'success');
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.message || 'Verification failed. Please check the code.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpChange = (val: string) => {
    setOtp(val);
    if (val.trim().length === 6) {
      handleVerifyCode(val);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      setResending(true);
      setErrorMsg(null);
      await resendVerification();
      setCountdown(60);
      showToast('New verification code sent!', 'success');
    } catch (err: any) {
      const msg = err.message || 'Failed to resend verification code.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            <View style={styles.brandContainer}>
              <View style={styles.logoContainer}>
                <Ionicons name="mail-unread-sharp" size={36} color="#FFFFFF" />
              </View>
              <Text style={styles.brandName}>Verify Your Email</Text>
              <Text style={styles.brandSub}>
                We've sent a 6-digit verification code to:{'\n'}
                <Text style={styles.emailHighlight}>{user?.email || 'your registered email'}</Text>
              </Text>
            </View>

            {errorMsg && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" style={styles.errorIcon} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Enter 6-Digit Code</Text>

              <Input
                placeholder="000000"
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.otpInput}
                autoFocus
              />

              <Button
                title={verifying ? "Verifying Code..." : "Confirm & Continue"}
                onPress={() => handleVerifyCode(otp)}
                loading={verifying}
                disabled={verifying || otp.trim().length !== 6}
                variant="primary"
                style={{ marginTop: 16 }}
              />

              <View style={styles.resendContainer}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Resend code in <Text style={styles.countdownNumber}>{countdown}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendBtn} activeOpacity={0.7}>
                    {resending ? (
                      <ActivityIndicator size="small" color={Theme.primary} />
                    ) : (
                      <>
                        <Ionicons name="refresh-outline" size={14} color="#E1306C" />
                        <Text style={styles.resendText}>Resend Code</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back-outline" size={16} color={Theme.textMuted} />
              <Text style={styles.logoutText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
