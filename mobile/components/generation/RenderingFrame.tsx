import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { AlertOctagon } from 'lucide-react-native';
import { GenerationTask } from '../../hooks/useGeneration';
import { Theme, Fonts } from '../../constants/theme';
import { TouchableOpacity } from 'react-native';

interface RenderingFrameProps {
  task: GenerationTask;
  imageSize: number;
  activeIndex: number;
  onChangeActiveIndex: (index: number) => void;
}

const PIPELINE_STATUSES = [
  'Analyzing facial contours...',
  'Aligning biometric anchor points...',
  'Synthesizing preset style elements...',
  'Injecting photorealistic detail layers...',
  'Finalizing composition...'
];

export default function RenderingFrame({ task, imageSize, activeIndex, onChangeActiveIndex }: RenderingFrameProps) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [statusText, setStatusText] = useState(PIPELINE_STATUSES[0]);

  const isPending = task.status === 'pending';
  const isProcessing = task.status === 'processing';
  const isCompleted = task.status === 'completed';
  const isFailed = task.status === 'failed';

  useEffect(() => {
    if (isPending || isProcessing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [task.status, scanAnim, pulseAnim, isPending, isProcessing]);

  useEffect(() => {
    if (!isProcessing) return;
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % PIPELINE_STATUSES.length;
      setStatusText(PIPELINE_STATUSES[index]);
    }, 2800);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, imageSize - 4],
  });

  const urls = task.outputUrl ? task.outputUrl.split(',') : [];

  return (
    <View style={[
      styles.visualFrame,
      { width: imageSize, height: imageSize },
      isCompleted ? styles.visualFrameCompleted : styles.visualFrameRendering,
    ]}>
      {isCompleted && task.outputUrl ? (
        <View style={{ width: imageSize, height: imageSize, position: 'relative' }}>
          <Image
            source={{ uri: urls[activeIndex] || urls[0] }}
            style={{ width: imageSize, height: imageSize }}
            contentFit="cover"
            transition={300}
          />

          {urls.length > 1 && (
            <>
              {/* Left Arrow Navigation Overlay */}
              {activeIndex > 0 && (
                <TouchableOpacity
                  onPress={() => onChangeActiveIndex(activeIndex - 1)}
                  style={[styles.arrowButton, styles.leftArrow]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.arrowText}>‹</Text>
                </TouchableOpacity>
              )}
              
              {/* Right Arrow Navigation Overlay */}
              {activeIndex < urls.length - 1 && (
                <TouchableOpacity
                  onPress={() => onChangeActiveIndex(activeIndex + 1)}
                  style={[styles.arrowButton, styles.rightArrow]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.arrowText}>›</Text>
                </TouchableOpacity>
              )}

              {/* Instagram Style Dot Indicators */}
              <View style={styles.dotsContainer}>
                {urls.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      idx === activeIndex ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      ) : (
        <View style={styles.renderingBg}>
          {task.template?.thumbnailUrl && (
            <Animated.Image
              source={{ uri: task.template.thumbnailUrl }}
              style={[styles.thumbnailBackground, { width: imageSize, height: imageSize }]}
            />
          )}
          
          <View style={styles.renderingOverlay}>
            <View style={styles.spinnerContainer}>
              <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
              <View style={styles.spinnerWrapper}>
                <ActivityIndicator size="large" color={Theme.primary} />
              </View>
            </View>
            <Text style={styles.renderingStatusTitle}>
              {isPending ? 'In Queue: Position 1' : statusText}
            </Text>
          </View>

          {isProcessing && (
            <Animated.View style={[styles.scannerBar, { transform: [{ translateY }] }]} />
          )}
        </View>
      )}

      {isFailed && (
        <View style={styles.errorOverlay}>
          <AlertOctagon size={40} color="#EF4444" style={{ marginBottom: 4 }} />
          <Text style={styles.errorOverlayTitle}>Pipeline Rendering Failed</Text>
          <Text style={styles.errorOverlaySub} numberOfLines={3}>
            {task.error || 'The model was unable to parse input faces. Check alignment and try again.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  visualFrame: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  visualFrameCompleted: {
    borderColor: Theme.primary,
    ...Theme.shadow,
  },
  visualFrameRendering: {
    borderColor: Theme.border,
  },
  renderingBg: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FAFAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnailBackground: {
    position: 'absolute',
    opacity: 0.12,
  },
  renderingOverlay: {
    gap: 12,
    alignItems: 'center',
    zIndex: 10,
  },
  spinnerContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 165, 165, 0.12)',
    borderColor: 'rgba(212, 165, 165, 0.25)',
    borderWidth: 1.5,
  },
  spinnerWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  renderingStatusTitle: {
    color: Theme.text,
    fontFamily: Fonts.semibold,
    fontSize: 14,
    textAlign: 'center',
  },
  scannerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: Theme.primary,
    top: 0,
    zIndex: 100,
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  errorOverlayTitle: {
    color: Theme.text,
    fontFamily: Fonts.bold,
    fontSize: 16,
    textAlign: 'center',
  },
  errorOverlaySub: {
    color: Theme.textMuted,
    fontFamily: Fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 36,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    borderColor: Theme.border,
    borderWidth: 1,
    ...Theme.shadow,
  },
  leftArrow: {
    left: 12,
  },
  rightArrow: {
    right: 12,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.text,
    lineHeight: 28,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 200,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  activeDot: {
    backgroundColor: Theme.primary,
    width: 8,
    height: 8,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: 'rgba(0, 0, 0, 0.15)',
    borderWidth: 0.5,
  },
});
