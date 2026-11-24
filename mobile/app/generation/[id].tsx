import React from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, AlertOctagon } from 'lucide-react-native';
import RenderingFrame from '../../components/generation/RenderingFrame';
import GenerationDetails from '../../components/generation/GenerationDetails';
import CompletedActions from '../../components/generation/CompletedActions';
import { useTaskStatus } from '../../hooks/useGeneration';
import { Theme } from '../../constants/theme';

export default function GenerationProgressScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: task, isLoading, error } = useTaskStatus(id);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);

  const screenWidth = Dimensions.get('window').width;
  const imageSize = Math.min(screenWidth - 48, 400);

  const handleReturn = () => {
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={styles.loadingText}>Loading active pipeline...</Text>
      </View>
    );
  }

  if (error || !task) {
    return (
      <View style={styles.errorContainer}>
        <AlertOctagon size={48} color="#EF4444" />
        <Text style={styles.errorText}>Error syncing task: {error?.message || 'Not found'}</Text>
        <TouchableOpacity onPress={handleReturn} style={styles.errorBackButton}>
          <Text style={styles.errorBackButtonText}>Back to Explorer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCompleted = task.status === 'completed';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>
          {isCompleted ? 'Render Complete' : 'Generative Workspace'}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/history')}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <X size={20} color={Theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.workspace}>
          <RenderingFrame 
            task={task} 
            imageSize={imageSize} 
            activeIndex={activeImageIndex}
            onChangeActiveIndex={setActiveImageIndex}
          />
          <GenerationDetails task={task} onReturn={handleReturn} />
          <CompletedActions 
            outputUrl={task.outputUrl} 
            activeIndex={activeImageIndex}
            onReturn={handleReturn} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Theme.textMuted,
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 15,
  },
  errorBackButton: {
    backgroundColor: Theme.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderColor: Theme.border,
    borderWidth: 1,
    ...Theme.shadow,
  },
  errorBackButtonText: {
    color: Theme.text,
    fontWeight: '600',
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Theme.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
    flexGrow: 1,
  },
  workspace: {
    gap: 24,
    width: '100%',
    alignItems: 'center',
  },
});
