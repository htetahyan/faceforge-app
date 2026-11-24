import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBatchTaskStatus } from '../../hooks/useGeneration';
import { Theme, Fonts } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GenerationProgressRing } from './GenerationProgressRing';
import { BatchResultsGrid } from './BatchResultsGrid';

interface GenerationModalProps {
  visible: boolean;
  taskId?: string | null;
  taskIds?: string[] | null;
  onClose: () => void;
}

const SHIFTING_PHASES = [
  '⚡ Synthesizing AI model pipelines...',
  '📐 Mapping custom facial vectors...',
  '🧵 Stitching couture clothing fibers...',
  '🎨 Blending color palettes & fabrics...',
  '💡 Infusing physical studio lightmaps...',
  '✨ Generating high-end fashion details...',
];

export default function GenerationModal({ visible, taskId, taskIds, onClose }: GenerationModalProps) {
  const insets = useSafeAreaInsets();
  
  const effectiveTaskIds = React.useMemo(() => {
    if (taskIds && taskIds.length > 0) return taskIds;
    if (taskId) return [taskId];
    return [];
  }, [taskId, taskIds?.join(',')]);

  const { data: fetchedTasks, isLoading, error } = useBatchTaskStatus(effectiveTaskIds);
  const tasks = fetchedTasks || [];
  
  const isAllFinished = tasks.length > 0 && tasks.every((t) => t.status === 'completed' || t.status === 'failed');
  const isCompleted = tasks.length > 0 && tasks.every((t) => t.status === 'completed');
  const isFailed = tasks.some((t) => t.status === 'failed');
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const outputUrls: string[] = [];
  tasks.forEach((t) => {
    if (t.outputUrl) {
      t.outputUrl.split(',').forEach((u) => outputUrls.push(u.trim()));
    }
  });

  const hasCompleted = outputUrls.length > 0;

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(1);

  useEffect(() => {
    if (visible && !isAllFinished) {
      const interval = setInterval(() => {
        setPhaseIndex((prev) => (prev + 1) % SHIFTING_PHASES.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [visible, isAllFinished]);

  useEffect(() => {
    if (visible) {
      if (isAllFinished) {
        if (hasCompleted) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setFakeProgress(100);
      } else {
        const interval = setInterval(() => {
          setFakeProgress((prev) => (prev < 90 ? prev + Math.floor(Math.random() * 5 + 1) : 92));
        }, 1200);
        return () => clearInterval(interval);
      }
    } else {
      setFakeProgress(1);
    }
  }, [visible, isAllFinished, hasCompleted]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            if (isAllFinished) {
              Haptics.selectionAsync();
              onClose();
            }
          }}
        />
        <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
          <View style={styles.dragHandle} />
          
          <View style={styles.topBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="logo-instagram" size={18} color="#E1306C" />
              <Text style={styles.topBarTitle}>
                {isAllFinished && hasCompleted
                  ? isFailed
                    ? `${completedCount}/${tasks.length} Slides Ready ✨`
                    : 'IG Carousel Ready ✨'
                  : 'Generative AI Workspace'}
              </Text>
            </View>
            {!isAllFinished && <ActivityIndicator size="small" color="#E1306C" />}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Theme.textMuted} />
            </TouchableOpacity>
          </View>
          
          {isLoading && tasks.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E1306C" />
              <Text style={styles.loadingText}>Initializing studio tasks...</Text>
            </View>
          ) : isAllFinished && !hasCompleted ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
              <Text style={styles.errorText}>
                {error?.message || tasks.find(t => t.status === 'failed')?.error || 'Generation failed'}
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom }]}
              showsVerticalScrollIndicator={false}
            >
              {hasCompleted && (
                <View style={{ marginBottom: isAllFinished ? 0 : 16 }}>
                  <Text style={styles.sectionHeader}>
                    {isAllFinished
                      ? '✨ All Carousel Slides Completed'
                      : `📸 Completed (${outputUrls.length}/${effectiveTaskIds.length} slides ready)`}
                  </Text>
                  <BatchResultsGrid
                    urls={outputUrls}
                    templateTitle={tasks[0]?.template?.title}
                    onClose={onClose}
                  />
                </View>
              )}

              {!isAllFinished && (
                <GenerationProgressRing
                  progress={fakeProgress}
                  phaseMessage={SHIFTING_PHASES[phaseIndex]}
                  taskCount={effectiveTaskIds.length}
                  completedCount={completedCount}
                />
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: Theme.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: Dimensions.get('window').height * 0.75,
    width: '100%',
    ...Theme.shadow,
  },
  dragHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: Theme.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  topBar: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 12, justifyContent: 'space-between', alignItems: 'center' },
  topBarTitle: { fontSize: 16, fontFamily: Fonts.bold, color: Theme.text },
  closeButton: { padding: 4 },
  loadingContainer: { padding: 40, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: Theme.textMuted, fontSize: 13, fontFamily: Fonts.medium },
  errorContainer: { padding: 40, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { color: '#EF4444', fontSize: 14, fontFamily: Fonts.semibold, textAlign: 'center' },
  sectionHeader: { fontSize: 14, fontFamily: Fonts.bold, color: Theme.text, marginBottom: 10 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 16 },
});
