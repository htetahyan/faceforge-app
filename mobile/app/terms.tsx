import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, FileText } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Theme, Fonts } from '../constants/theme';

export default function TermsOfServiceScreen() {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.badgeContainer}>
          <FileText size={28} color={Theme.primary} />
          <Text style={styles.badgeTitle}>Terms & Conditions</Text>
          <Text style={styles.effectiveDate}>Last Updated: January 1, 2026</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By downloading, accessing, or using GlowUp AI, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Acceptable Use Policy</Text>
          <Text style={styles.paragraph}>
            You agree to upload only photos of yourself or individuals who have given you explicit consent. You strictly agree NOT to generate:
          </Text>
          <Text style={styles.bullet}>• Non-consensual imagery or impersonation of living individuals.</Text>
          <Text style={styles.bullet}>• Explicit, sexually suggestive, or CSAM content.</Text>
          <Text style={styles.bullet}>• Hateful, violent, defamatory, or illegal content.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Subscriptions & Billing</Text>
          <Text style={styles.paragraph}>
            Subscriptions auto-renew monthly or annually through Google Play Billing unless cancelled at least 24 hours prior to the renewal period in your Google Play account settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Intellectual Property & Ownership</Text>
          <Text style={styles.paragraph}>
            You retain full commercial and personal rights to all AI portrait images generated under your account. GlowUp AI claims no ownership over your generated creations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Contact Support</Text>
          <Text style={styles.paragraph}>
            For questions regarding these Terms of Service, contact support at: <Text style={styles.boldText}>support@glowup.ai</Text>
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
