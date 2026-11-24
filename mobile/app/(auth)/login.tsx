import React, { useState } from 'react';
import { StyleSheet, View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import LoginForm from '../../components/auth/LoginForm';
import SocialLogins from '../../components/auth/SocialLogins';
import { Theme, Fonts } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenPrivacyAlert = () => {
    Alert.alert(
      "Privacy Policy & Data Protection",
      "All face uploads are encrypted and strictly processed to generate your requested AI portrait models. We do not sell your personal data or train public datasets with your images.",
      [{ text: "Understood", style: "default" }]
    );
  };

  const handleOpenTermsAlert = () => {
    Alert.alert(
      "Terms of Service (EULA)",
      "By using GlowUp AI, you agree not to upload photos of individuals without consent, or create explicit or harmful content. Zero-tolerance account suspension rules apply.",
      [{ text: "Understood", style: "default" }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            {/* Header Brand Section */}
            <View style={styles.brandContainer}>
              <View style={styles.logoContainer}>
                <Ionicons name="sparkles-sharp" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.brandName}>
                GlowUp<Text style={styles.accentText}> AI Studio</Text>
              </Text>
              <Text style={styles.brandSub}>
                Create high-end 1-tap AI photos & Instagram Carousels
              </Text>
            </View>

            {errorMsg && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Email Form */}
            <LoginForm onError={setErrorMsg} />

            {/* Social Logins */}
            <SocialLogins onError={setErrorMsg} />

            {/* Legal Footer */}
            <View style={styles.legalFooter}>
              <Text style={styles.legalText}>By logging in, you accept our </Text>
              <TouchableOpacity onPress={handleOpenPrivacyAlert}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.legalText}> & </Text>
              <TouchableOpacity onPress={handleOpenTermsAlert}>
                <Text style={styles.legalLink}>EULA Terms</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.background },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  contentContainer: { padding: 20, maxWidth: 480, width: '100%', alignSelf: 'center' },
  brandContainer: { alignItems: 'center', marginBottom: 20 },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#E1306C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E1306C',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    marginBottom: 10,
  },
  brandName: { fontSize: 26, fontFamily: Fonts.bold, color: Theme.text, letterSpacing: -0.5 },
  accentText: { color: '#E1306C' },
  brandSub: { color: Theme.textMuted, textAlign: 'center', fontSize: 13, fontFamily: Fonts.regular, marginTop: 4 },
  errorContainer: { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: '#EF4444', borderWidth: 1, padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: '#EF4444', fontSize: 13, fontFamily: Fonts.semibold },
  legalFooter: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  legalText: { color: Theme.textMuted, fontSize: 11, fontFamily: Fonts.regular },
  legalLink: { color: Theme.text, fontSize: 11, fontFamily: Fonts.semibold, textDecorationLine: 'underline' },
});
