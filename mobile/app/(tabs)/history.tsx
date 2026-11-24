import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGeneration, GenerationTask } from '../../hooks/useGeneration';
import { Theme, Fonts } from '../../constants/theme';
import Skeleton from '../../components/ui/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function HistoryScreen() {
  const router = useRouter();
  const [limit, setLimit] = React.useState(20);
  const { history, pagination, isHistoryLoading, historyError, refetchHistory } = useGeneration({ limit });

  const getStatusConfig = (status: GenerationTask['status']) => {
    switch (status) {
      case 'completed':
        return { color: Theme.success, icon: 'checkmark-circle' as const, label: 'Done' };
      case 'processing':
        return { color: Theme.primary, icon: 'sync' as const, label: 'Processing' };
      case 'pending':
        return { color: Theme.textMuted, icon: 'time' as const, label: 'Queued' };
      case 'failed':
        return { color: Theme.error, icon: 'alert-circle' as const, label: 'Failed' };
    }
  };

  const handleCardPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/generation/${id}`);
  };

  const completedTasks = history.filter((t) => t.status === 'completed');
  const activeTasks = history.filter((t) => t.status !== 'completed');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isHistoryLoading && history.length > 0}
            onRefresh={refetchHistory}
            tintColor={Theme.primary}
            colors={[Theme.primary]}
          />
        }
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSub}>Your AI generations</Text>
        </View>

        {isHistoryLoading && history.length === 0 && (
          <View style={styles.gridContainer}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width={CARD_WIDTH} height={CARD_WIDTH * 1.2} borderRadius={16} />
            ))}
          </View>
        )}

        {historyError && (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={36} color={Theme.textMuted} />
            <Text style={styles.errorText}>Failed to sync history.</Text>
            <TouchableOpacity onPress={() => refetchHistory()} style={styles.retryButton} activeOpacity={0.7}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isHistoryLoading && !historyError && history.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="images-outline" size={32} color={Theme.primary} />
            </View>
            <Text style={styles.emptyTitle}>No generations yet</Text>
            <Text style={styles.emptySub}>Pick a style from Explore and create your first portrait.</Text>
            <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)')} activeOpacity={0.8}>
              <Text style={styles.exploreButtonText}>Browse Explore</Text>
            </TouchableOpacity>
          </View>
        )}

        {!historyError && activeTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>In Progress</Text>
            <View style={styles.activeList}>
              {activeTasks.map((task) => {
                const cfg = getStatusConfig(task.status);
                return (
                  <Pressable
                    key={task.id}
                    onPress={() => handleCardPress(task.id)}
                    style={({ pressed }) => [styles.activeCard, pressed && styles.cardPressed]}
                  >
                    <Image
                      source={{ uri: task.template?.thumbnailUrl }}
                      style={styles.activeThumb}
                      transition={150}
                    />
                    <View style={styles.activeMeta}>
                      <Text style={styles.activeTitle} numberOfLines={1}>
                        {task.template?.title || 'Generating...'}
                      </Text>
                      <View style={styles.statusRow}>
                        <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                        <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Theme.textMuted} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {!historyError && completedTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed</Text>
            <View style={styles.gridContainer}>
              {completedTasks.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => handleCardPress(task.id)}
                  style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
                >
                  <Image
                    source={{ uri: task.outputUrl || task.template?.thumbnailUrl }}
                    style={styles.gridImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={150}
                  />
                  <View style={styles.gridOverlay}>
                    <Text style={styles.gridTitle} numberOfLines={1}>
                      {task.template?.title || 'Portrait'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {pagination?.hasMore && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={() => setLimit((prev) => prev + 20)}
            activeOpacity={0.8}
          >
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.background },
  scrollContent: { paddingBottom: 40 },
  headerContainer: { paddingHorizontal: 16, paddingTop: 16, gap: 4 },
  headerTitle: { fontSize: 28, fontFamily: Fonts.bold, color: Theme.text, letterSpacing: -0.5 },
  headerSub: { color: Theme.textMuted, fontSize: 13, fontFamily: Fonts.regular },
  section: { paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: Fonts.bold, color: Theme.text },
  errorContainer: { padding: 32, alignItems: 'center', gap: 12 },
  errorText: { color: Theme.textMuted, textAlign: 'center', fontSize: 14, fontFamily: Fonts.medium },
  retryButton: { backgroundColor: Theme.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 9999 },
  retryButtonText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: 14 },
  emptyCard: {
    margin: 16,
    padding: 32,
    backgroundColor: Theme.surfaceElevated,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(230, 0, 35, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { color: Theme.text, fontFamily: Fonts.bold, fontSize: 18 },
  emptySub: { color: Theme.textMuted, fontSize: 13, fontFamily: Fonts.regular, textAlign: 'center', lineHeight: 18 },
  exploreButton: {
    backgroundColor: Theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    marginTop: 8,
    ...Theme.shadow,
  },
  exploreButtonText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: 14 },
  activeList: { gap: 10 },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Theme.surfaceElevated,
    borderRadius: 16,
    gap: 12,
  },
  activeThumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: Theme.border },
  activeMeta: { flex: 1, gap: 4 },
  activeTitle: { fontSize: 14, fontFamily: Fonts.semibold, color: Theme.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusLabel: { fontSize: 12, fontFamily: Fonts.medium },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  gridCard: {
    width: CARD_WIDTH,
    aspectRatio: 0.85,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Theme.border,
    ...Theme.shadow,
  },
  gridImage: { width: '100%', height: '100%' },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  gridTitle: { fontSize: 12, fontFamily: Fonts.semibold, color: '#FFFFFF' },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  loadMoreButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Theme.border,
    alignItems: 'center',
  },
  loadMoreText: { color: Theme.text, fontFamily: Fonts.semibold, fontSize: 14 },
});
