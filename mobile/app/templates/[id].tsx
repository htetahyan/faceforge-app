import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTemplate } from '../../hooks/useTemplates';
import { useFaces } from '../../hooks/useFaces';
import { useGeneration } from '../../hooks/useGeneration';
import { useToast } from '../../components/ui/Toast';
import { Theme, Fonts } from '../../constants/theme';

import TemplateHeader from '../../components/templates/TemplateHeader';
import SlotMapper from '../../components/templates/SlotMapper';
import ExpressionSelector from '../../components/templates/ExpressionSelector';
import { BatchVariationPicker } from '../../components/templates/BatchVariationPicker';
import FaceSelectorModal from '../../components/templates/FaceSelectorModal';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import GenerationModal from '../../components/generation/GenerationModal';
import PaywallModal from '../../components/ui/PaywallModal';

import { useAuth } from '../../hooks/useAuth';

export default function TemplateDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { user } = useAuth();

  const { data: template, isLoading: isTemplateLoading, error: templateError } = useTemplate(id);
  const { faces, isLoading: isFacesLoading } = useFaces();
  const { triggerBatchGeneration, isTriggering } = useGeneration();
  const { adStatus, isAdLoading, adCountdown, showAdAndGrantCredit } = useRewardedAd();

  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [selectedExpressionId, setSelectedExpressionId] = useState<string>('smile');

  const [batchCount, setBatchCount] = useState<number>(1);
  const [autoMix, setAutoMix] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<'4:5' | '1:1' | '9:16'>('1:1');
  const [customOutfit, setCustomOutfit] = useState<string>('');
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [activeTaskIds, setActiveTaskIds] = useState<string[]>([]);
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const isTemplatePro = (template as any)?.isPremium || false;
  const isUserPro = user?.subscriptionTier && user.subscriptionTier !== 'free';
  const isProLocked = isTemplatePro && !isUserPro;

  React.useEffect(() => {
    if (faces?.length > 0 && template?.faceSlots) {
      setMappings((prev) => {
        if (Object.keys(prev).length === 0) {
          const autoFilled: Record<string, string> = {};
          template.faceSlots.forEach((slot, idx) => {
            autoFilled[slot] = faces[idx % faces.length].id;
          });
          return autoFilled;
        }
        return prev;
      });
    }
  }, [faces, template]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  if (isTemplateLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E1306C" />
        <Text style={styles.loadingText}>Loading studio details...</Text>
      </View>
    );
  }

  if (templateError || !template) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error fetching template: {templateError?.message || 'Not found'}</Text>
        <TouchableOpacity onPress={handleBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleGenerate = async () => {
    if (isProLocked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setPaywallOpen(true);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const mappedCount = template.faceSlots.filter((s) => !!mappings[s]).length;
    if (mappedCount < template.faceSlots.length) {
      Alert.alert('Configuration Required', 'Please configure face mappings for all template slots.');
      return;
    }

    try {
      showToast(`🚀 Dispatching ${batchCount} IG Carousel slides...`, 'success');
      const expressionsList = ['smile', 'glamour', 'cinematic', 'professional'];

      const outfitToken = customOutfit.trim() ? `${customOutfit.trim()} | ` : '';
      const paramsList = Array.from({ length: batchCount }).map((_, idx) => {
        const exp = autoMix && idx > 0 ? expressionsList[idx % expressionsList.length] : selectedExpressionId;
        return {
          templateId: template.id,
          faceMappings: mappings,
          customPrompt: `${outfitToken}slide:${idx + 1}/${batchCount} | ${exp} | ${aspectRatio}`,
        };
      });

      const taskIds = await triggerBatchGeneration(paramsList, (ids) => {
        setActiveTaskIds(ids);
        setGenModalOpen(true);
      });
      setActiveTaskIds(taskIds);
      setGenModalOpen(true);
    } catch (err: any) {
      console.error('Generation dispatch failure:', err);
      setGenModalOpen(false);
      const is402 = err?.response?.status === 402 ||
                    err?.response?.data?.code === 'LIMIT_EXCEEDED' ||
                    String(err?.message || '').includes('402') ||
                    String(err?.message || '').toLowerCase().includes('limit reached');
      if (is402) {
        setPaywallOpen(true);
      } else {
        const msg = err?.response?.data?.error || err.message || 'Failed to dispatch generative AI task.';
        Alert.alert('Generation Error', msg);
      }
    }
  };

  const handleWatchAd = async () => {
    setPaywallOpen(false);
    const result = await showAdAndGrantCredit();
    if (result.success) {
      Alert.alert('Credit Granted! 🎉', '1 free AI generation credit has been added to your account. Retrying generation now...', [
        { text: 'OK', onPress: () => handleGenerate() },
      ]);
    } else if (result.message) {
      Alert.alert('Ad Status', result.message);
    }
  };

  const mappedCount = template.faceSlots.filter((slot) => !!mappings[slot]).length;
  const isReadyToGenerate = mappedCount === template.faceSlots.length;
  const setupStatus = isReadyToGenerate ? '🟢 Configuration Ready' : `🟡 Setup (${mappedCount}/${template.faceSlots.length})`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <TemplateHeader title={template.title} thumbnailUrl={template.thumbnailUrl} categoryName={(template as any).category?.name} isPremium={isTemplatePro} onBack={handleBack} />

        {isProLocked && (
          <TouchableOpacity onPress={() => setPaywallOpen(true)} style={styles.proLockBanner} activeOpacity={0.85}>
            <Text style={styles.proLockBannerTitle}>👑 PRO PRESET LOCKED</Text>
            <Text style={styles.proLockBannerSub}>Upgrade to GlowUp Pro to unlock 4K generation on this preset</Text>
          </TouchableOpacity>
        )}

        <SlotMapper faceSlots={template.faceSlots} mappings={mappings} faces={faces} onSlotPress={(slot) => { setActiveSlot(slot); setFaceModalOpen(true); }} setupStatus={setupStatus} />
        <ExpressionSelector selectedExpressionId={selectedExpressionId} onSelectExpression={setSelectedExpressionId} />
        <BatchVariationPicker count={batchCount} onCountChange={setBatchCount} autoMix={autoMix} onAutoMixChange={setAutoMix} aspectRatio={aspectRatio} onAspectRatioChange={setAspectRatio} />
        <View style={styles.outfitCard}>
          <Text style={styles.outfitLabel}>✨ Custom Outfit / Style Directive (Optional)</Text>
          <TextInput
            style={styles.outfitInput}
            placeholder="e.g. wearing a red silk evening gown, gold jewelry..."
            placeholderTextColor={Theme.textMuted}
            value={customOutfit}
            onChangeText={setCustomOutfit}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, 20), paddingTop: 12 }]}>
        <TouchableOpacity onPress={handleGenerate} disabled={isTriggering} style={[styles.generateButton, isProLocked ? styles.btnProLocked : isReadyToGenerate ? styles.btnActive : styles.btnInactive]} activeOpacity={0.8}>
          {isTriggering ? <ActivityIndicator color={Theme.surface} /> : (
            <Text style={[styles.btnText, isProLocked ? styles.textActive : isReadyToGenerate ? styles.textActive : styles.textInactive]}>
              {isProLocked ? '👑 Unlock Pro Preset to Generate' : batchCount === 1 ? 'Generate 1 Studio Photo 📸' : `Generate ${batchCount} IG Carousel Slides 📸`}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <FaceSelectorModal visible={faceModalOpen} activeSlot={activeSlot} faces={faces} isLoading={isFacesLoading} onSelect={(faceId) => { if (activeSlot) setMappings((prev) => ({ ...prev, [activeSlot]: faceId })); setFaceModalOpen(false); }} onClose={() => setFaceModalOpen(false)} onRedirectToFaces={() => { setFaceModalOpen(false); router.push('/(tabs)/faces'); }} />
      {genModalOpen && <GenerationModal visible={genModalOpen} taskIds={activeTaskIds} onClose={() => setGenModalOpen(false)} />}
      <PaywallModal
        visible={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onWatchAd={handleWatchAd}
        remainingAds={adStatus.remainingToday}
        isAdLoading={isAdLoading}
        adCountdown={adCountdown}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.background },
  centerContainer: { flex: 1, backgroundColor: Theme.background, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Theme.textMuted, marginTop: 12, fontSize: 14, fontFamily: Fonts.medium },
  errorContainer: { flex: 1, backgroundColor: Theme.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#EF4444', textAlign: 'center', fontSize: 16, fontFamily: Fonts.semibold, marginBottom: 16 },
  backLink: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: Theme.primary, borderRadius: 12 },
  backLinkText: { color: '#FFF', fontFamily: Fonts.bold, fontSize: 14 },
  scrollContent: { paddingBottom: 110 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderTopWidth: 1, borderColor: 'rgba(0,0,0,0.05)', ...Theme.shadow },
  generateButton: { height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  btnActive: { backgroundColor: '#E1306C', borderColor: '#E1306C', ...Theme.shadow },
  btnInactive: { backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.05)' },
  btnProLocked: { backgroundColor: '#FFD700', borderColor: '#B8860B', ...Theme.shadow },
  proLockBanner: { marginHorizontal: 20, marginTop: 12, backgroundColor: '#1E1B4B', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#6366F1', alignItems: 'center' },
  proLockBannerTitle: { color: '#FFD700', fontSize: 13, fontFamily: Fonts.bold, letterSpacing: 0.5 },
  proLockBannerSub: { color: '#C7D2FE', fontSize: 12, fontFamily: Fonts.regular, textAlign: 'center', marginTop: 2 },
  btnText: { fontSize: 15, fontFamily: Fonts.bold },
  textActive: { color: '#FFF' },
  textInactive: { color: Theme.textMuted },
  outfitCard: { marginHorizontal: 16, marginTop: 8, backgroundColor: Theme.surface, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: Theme.border },
  outfitLabel: { fontSize: 11.5, fontFamily: Fonts.bold, color: Theme.text, marginBottom: 6 },
  outfitInput: { backgroundColor: Theme.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, fontFamily: Fonts.regular, color: Theme.text, borderWidth: 1, borderColor: Theme.border },
});
