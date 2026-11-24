import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from '../services/secureStore';
import OnboardingSlide from '../components/onboarding/OnboardingSlide';
import IntentSelector from '../components/onboarding/IntentSelector';
import FaceGuidelinesCard from '../components/faces/FaceGuidelinesCard';
import PermissionGate from '../components/onboarding/PermissionGate';
import { styles } from '../components/onboarding/onboarding-styles';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);

  const handleToggleIntent = (intent: string) => {
    setSelectedIntents(prev =>
      prev.includes(intent)
        ? prev.filter(i => i !== intent)
        : [...prev, intent]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && selectedIntents.length >= 3) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleFinish = async () => {
    try {
      await SecureStore.setItemAsync('has_completed_onboarding', 'true');
      router.replace('/(auth)/login');
    } catch (err) {
      console.error('[Onboarding] Error saving onboarding state:', err);
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepText}>Step {step} of 4</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressIndicator, { width: `${(step / 4) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.body}>
        {step === 1 && (
          <OnboardingSlide
            title="Create Professional AI Portraits"
            subtitle="Transform your photos into stunning studio-quality headshots, lifestyle portraits, and high-fashion avatars in seconds."
          />
        )}

        {step === 2 && (
          <IntentSelector
            selectedIntents={selectedIntents}
            onToggle={handleToggleIntent}
          />
        )}

        {step === 3 && (
          <View style={styles.guidelinesSlide}>
            <Text style={styles.guidelinesTitle}>Face Profile Guidelines</Text>
            <Text style={styles.guidelinesSub}>
              For the best AI results, follow these simple photo guidelines.
            </Text>
            <FaceGuidelinesCard />
          </View>
        )}

        {step === 4 && (
          <PermissionGate onComplete={handleFinish} />
        )}
      </View>

      {step < 4 && (
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextButton, step === 2 && selectedIntents.length < 3 && styles.disabledButton]}
            disabled={step === 2 && selectedIntents.length < 3}
            activeOpacity={0.8}
          >
            <Text style={styles.nextText}>
              {step === 2
                ? (selectedIntents.length < 3 ? `Select ${3 - selectedIntents.length} more` : 'Continue')
                : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
