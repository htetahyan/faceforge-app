import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Theme, Fonts } from '../constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.badgeContainer}>
          <ShieldCheck size={28} color={Theme.primary} />
          <Text style={styles.badgeTitle}>Your Privacy Matters</Text>
          <Text style={styles.effectiveDate}>Effective Date: January 1, 2026</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            GlowUp AI collects information to provide and improve our AI portrait generation services:
          </Text>
          <Text style={styles.bullet}>• <Text style={styles.boldText}>Account Data:</Text> Email address, display name, and authentication credentials when you register or sign in.</Text>
          <Text style={styles.bullet}>• <Text style={styles.boldText}>User Photos & Face Data:</Text> Facial photos uploaded to create face profiles and generate portraits.</Text>
          <Text style={styles.bullet}>• <Text style={styles.boldText}>Usage & Device Information:</Text> Generation history, app interactions, and device identifiers for analytics.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Facial Data</Text>
          <Text style={styles.paragraph}>
            Uploaded face photos are processed solely to extract identity traits for AI image synthesis. We do NOT use your photos to train public AI models, nor do we sell or share your facial data with third parties for marketing.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Data Retention & Instant Deletion</Text>
          <Text style={styles.paragraph}>
            You retain full ownership of your images and data. You can delete individual face profiles or permanently delete your entire account at any time via <Text style={styles.boldText}>Profile → Delete Account</Text>. All stored photos and credentials will be permanently erased.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Advertising & Subscriptions</Text>
          <Text style={styles.paragraph}>
            We use Google AdMob for rewarded video ads and RevenueCat for subscription billing. Ad networks may collect anonymous device identifiers in compliance with Google Play Developer policies.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Contact & Data Protection</Text>
          <Text style={styles.paragraph}>
            For privacy inquiries or data removal requests, contact our Data Protection Officer at: <Text style={styles.boldText}>support@glowup.ai</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Theme.text,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  badgeContainer: {
    alignItems: 'center',
    backgroundColor: Theme.surfaceElevated,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Theme.text,
    marginTop: 8,
  },
  effectiveDate: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Theme.textMuted,
    marginTop: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Theme.text,
  },
  paragraph: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Theme.textMuted,
    lineHeight: 22,
  },
  bullet: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Theme.textMuted,
    lineHeight: 22,
    paddingLeft: 8,
  },
  boldText: {
    color: Theme.text,
    fontFamily: Fonts.semibold,
  },
});
