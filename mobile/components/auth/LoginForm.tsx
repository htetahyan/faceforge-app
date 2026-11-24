import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Input } from '../ui/input';
import { Button } from '../ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/authService';
import { Theme, Fonts } from '../../constants/theme';
import { useToast } from '../ui/Toast';

export default function LoginForm({ onError }: { onError: (msg: string | null) => void }) {
  const { login, register } = useAuth();
  const { showToast } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [eulaAccepted, setEulaAccepted] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  const validate = () => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setDisplayNameError(null);
    setOtpError(null);

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address');
      isValid = false;
    }

    if (isResetPassword) {
      if (!otp || otp.trim().length !== 6) {
        setOtpError('Code must be 6 digits');
        isValid = false;
      }
    }

    if (!isForgotPassword) {
      if (!password || password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        isValid = false;
      }
    }

    if (isSignUp && !isForgotPassword && !isResetPassword) {
      if (!displayName.trim()) {
        setDisplayNameError('Display name is required');
        isValid = false;
      }
      if (!eulaAccepted) {
        showToast('Please accept EULA & Privacy Terms.', 'error');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      onError(null);

      if (isForgotPassword) {
        await authApi.forgotPassword(email.trim());
        showToast('Recovery code sent to your email!', 'success');
        setIsForgotPassword(false);
        setIsResetPassword(true);
      } else if (isResetPassword) {
        await authApi.resetPassword(email.trim(), otp.trim(), password);
        showToast('Password updated! Signing in...', 'success');
        setIsResetPassword(false);
        await login(email.trim(), password);
      } else if (isSignUp) {
        await register(email.trim(), password, displayName.trim());
        showToast('Account created successfully!', 'success');
      } else {
        await login(email.trim(), password);
        showToast('Welcome back!', 'success');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Authentication failed';
      showToast(msg, 'error');
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetErrors = () => {
    onError(null);
    setEmailError(null);
    setPasswordError(null);
    setDisplayNameError(null);
    setOtpError(null);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {isForgotPassword ? 'Reset Password' : isResetPassword ? 'Verify Recovery Code' : isSignUp ? 'Create your Account' : 'Welcome Back'}
      </Text>

      <View style={styles.formFields}>
        {isSignUp && !isForgotPassword && !isResetPassword && (
          <Input placeholder="Display Name" value={displayName} onChangeText={(val) => { setDisplayName(val); setDisplayNameError(null); }} autoCapitalize="words" leftIcon={<Ionicons name="person-outline" size={18} color="#726580" />} error={displayNameError || undefined} />
        )}

        <Input placeholder="Email Address" value={email} onChangeText={(val) => { setEmail(val); setEmailError(null); }} keyboardType="email-address" autoCapitalize="none" leftIcon={<Ionicons name="mail-outline" size={18} color="#726580" />} error={emailError || undefined} />

        {isResetPassword && (
          <Input placeholder="6-Digit Code" value={otp} onChangeText={(val) => { setOtp(val); setOtpError(null); }} keyboardType="number-pad" maxLength={6} leftIcon={<Ionicons name="key-outline" size={18} color="#726580" />} error={otpError || undefined} />
        )}

        {!isForgotPassword && (
          <Input placeholder={isResetPassword ? 'Choose New Password' : 'Secure Password'} value={password} onChangeText={(val) => { setPassword(val); setPasswordError(null); }} secureTextEntry autoCapitalize="none" leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#726580" />} error={passwordError || undefined} />
        )}

        {!isSignUp && !isForgotPassword && !isResetPassword && (
          <TouchableOpacity onPress={() => { setIsForgotPassword(true); resetErrors(); }}>
            <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
      </View>

      {isSignUp && !isForgotPassword && !isResetPassword && (
        <View style={styles.eulaContainer}>
          <TouchableOpacity onPress={() => setEulaAccepted(!eulaAccepted)} style={styles.checkbox} activeOpacity={0.8}>
            <View style={[styles.checkboxInner, eulaAccepted && styles.checkboxChecked]}>
              {eulaAccepted && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
          <Text style={styles.eulaText}>
            I agree to the <Text style={styles.linkText} onPress={() => Alert.alert('EULA & Terms', 'Zero tolerance for objectionable content. User data is encrypted.')}>Terms & Privacy Policy</Text>.
          </Text>
        </View>
      )}

      <Button title={isForgotPassword ? 'Send Code' : isResetPassword ? 'Update & Sign In' : isSignUp ? 'Create Free Account' : 'Sign In Now'} onPress={handleSubmit} loading={loading} className="mt-2" />

      <View style={styles.toggleContainer}>
        {isForgotPassword || isResetPassword ? (
          <TouchableOpacity onPress={() => { setIsForgotPassword(false); setIsResetPassword(false); resetErrors(); }}>
            <Text style={styles.toggleLink}>Back to Sign In</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.toggleLabel}>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</Text>
            <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); resetErrors(); }}>
              <Text style={styles.toggleLink}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Theme.surface, borderColor: Theme.border, borderWidth: 1, borderRadius: 24, padding: 20, ...Theme.shadow },
  cardTitle: { fontSize: 18, fontFamily: Fonts.bold, color: Theme.text, marginBottom: 16 },
  formFields: { marginBottom: 4 },
  forgotPasswordLink: { color: Theme.textMuted, fontSize: 13, textAlign: 'right', marginTop: 4, marginBottom: 12, fontFamily: Fonts.medium },
  toggleContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 8 },
  toggleLabel: { color: Theme.textMuted, fontSize: 14, fontFamily: Fonts.regular },
  toggleLink: { color: Theme.secondary, fontFamily: Fonts.bold, fontSize: 14 },
  eulaContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 16 },
  checkbox: { padding: 2 },
  checkboxInner: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: Theme.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { borderColor: Theme.primary, backgroundColor: Theme.primary },
  eulaText: { fontSize: 12, color: Theme.textMuted, flex: 1, fontFamily: Fonts.regular },
  linkText: { color: Theme.secondary, fontFamily: Fonts.bold },
});
