import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Theme, Fonts } from '../../constants/theme';

interface GenerationProgressRingProps {
  progress: number;
  phaseMessage: string;
  taskCount?: number;
  completedCount?: number;
}

export const GenerationProgressRing: React.FC<GenerationProgressRingProps> = ({
  progress,
  phaseMessage,
  taskCount = 1,
  completedCount = 0,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.outerRing}>
        <View style={styles.innerRing}>
          <Text style={styles.percentText}>{progress}%</Text>
          <Text style={styles.stitchingText}>
            {taskCount > 1 ? `IG SLIDE ${completedCount + 1}/${taskCount}` : 'RENDERING'}
          </Text>
        </View>
      </View>

      <ActivityIndicator size="small" color="#E1306C" style={{ marginTop: 16 }} />

      <View style={styles.phaseBadge}>
        <Text style={styles.phaseText}>{phaseMessage}</Text>
      </View>
    </View>
  );
};

GenerationProgressRing.displayName = 'GenerationProgressRing';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  outerRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#E1306C',
    backgroundColor: 'rgba(225,48,108,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E1306C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  innerRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: Theme.text,
    letterSpacing: -1,
  },
  stitchingText: {
    fontSize: 9.5,
    fontFamily: Fonts.bold,
    color: '#E1306C',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  phaseBadge: {
    backgroundColor: 'rgba(225,48,108,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(225,48,108,0.1)',
    marginTop: 12,
  },
  phaseText: {
    color: '#E1306C',
    fontSize: 12,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
});

export default GenerationProgressRing;
