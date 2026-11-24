import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle2, Sparkles, RefreshCcw } from 'lucide-react-native';
import { GenerationTask } from '../../hooks/useGeneration';
import { Theme } from '../../constants/theme';

interface GenerationDetailsProps {
  task: GenerationTask;
  onReturn: () => void;
}

export default function GenerationDetails({ task, onReturn }: GenerationDetailsProps) {
  const isPending = task.status === 'pending';
  const isProcessing = task.status === 'processing';
  const isCompleted = task.status === 'completed';
  const isFailed = task.status === 'failed';

  const [statusText, setStatusText] = useState('Analyzing face mapping profiles...');

  useEffect(() => {
    if (!isProcessing) return;
    const tips = [
      'Analyzing face mapping profiles...',
      'Aligning biometric anchor points...',
      'Synthesizing preset style elements...',
      'Injecting photorealistic detail layers...',
      'Enhancing resolution grids...',
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % tips.length;
      setStatusText(tips[i]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  return (
    <View style={styles.detailsBox}>
      {isCompleted && (
        <View style={styles.completedHeader}>
          <View style={styles.completedHeaderRow}>
            <CheckCircle2 size={18} color="#10B981" />
            <Text style={styles.completedHeaderTitle}>Render Completed</Text>
          </View>
          <Text style={styles.completedHeaderSub}>Created from preset: &quot;{task.template?.title}&quot;</Text>
        </View>
      )}

      {isPending && (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Fast-Track Scheduler Active 🚀</Text>
          <Text style={styles.infoCardSub}>
            Your task is placed inside our secure DB queue limiter (10 slots capacity). We are optimizing rendering slots.
          </Text>
        </View>
      )}

      {isProcessing && (
        <View style={styles.infoCard}>
          <View style={styles.infoCardTitleRow}>
            <Sparkles size={14} color={Theme.primary} />
            <Text style={[styles.infoCardTitle, { color: Theme.primary }]}>Generative models active</Text>
          </View>
          <Text style={styles.infoCardSub}>{statusText}</Text>
        </View>
      )}

      {isFailed && (
        <TouchableOpacity onPress={onReturn} style={styles.failedButton} activeOpacity={0.8}>
          <RefreshCcw size={16} color={Theme.surface} style={{ marginRight: 6 }} />
          <Text style={styles.failedButtonText}>Return & Try Another Template</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  detailsBox: {
    gap: 12,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  completedHeader: {
    alignItems: 'center',
    gap: 4,
  },
  completedHeaderRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  completedHeaderTitle: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 15,
  },
  completedHeaderSub: {
    color: Theme.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  infoCard: {
    padding: 16,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 16,
    width: '100%',
    gap: 8,
    ...Theme.shadow,
  },
  infoCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoCardTitle: {
    color: Theme.text,
    fontWeight: '700',
    fontSize: 14,
  },
  infoCardSub: {
    color: Theme.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  failedButton: {
    backgroundColor: Theme.primary,
    height: 48,
    width: '100%',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadow,
  },
  failedButtonText: {
    color: Theme.surface,
    fontWeight: '800',
    fontSize: 14,
  },
});
