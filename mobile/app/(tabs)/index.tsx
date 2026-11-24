import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTemplates, Template } from '../../hooks/useTemplates';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../hooks/useAuth';
import { Theme } from '../../constants/theme';
import PinterestCard from '../../components/explore/PinterestCard';
import PinterestPill from '../../components/explore/PinterestPill';
import { styles } from '../../components/explore/explore.styles';
import Skeleton from '../../components/ui/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = 12;
const H_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - H_PADDING * 2 - COLUMN_GAP) / 2;

const MASONRY_RATIOS = [0.72, 0.95, 0.8, 1.05, 0.75, 0.9, 0.85, 1.0];

type FilterKey = 'all' | 'solo' | 'group';

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [faceFilter, setFaceFilter] = useState<FilterKey>('all');

  const { data: categories } = useCategories();
  const {
    data: templates,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useTemplates({
    limit: 50,
    categoryId: selectedCategoryId || undefined,
  });

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    if (faceFilter === 'solo') return templates.filter((t) => t.faceSlots.length <= 1);
    if (faceFilter === 'group') return templates.filter((t) => t.faceSlots.length > 1);
    return templates;
  }, [templates, faceFilter]);

  const { leftColumn, rightColumn } = useMemo(() => {
    const left: Template[] = [];
    const right: Template[] = [];
    filteredTemplates.forEach((tpl, i) => {
      if (i % 2 === 0) left.push(tpl);
      else right.push(tpl);
    });
    return { leftColumn: left, rightColumn: right };
  }, [filteredTemplates]);

  const handleTemplatePress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/templates/${id}`);
  }, [router]);

  const handleCategoryPress = (categoryId: string | null) => {
    Haptics.selectionAsync();
    setSelectedCategoryId(categoryId);
  };

  const handleFaceFilterPress = (filter: FilterKey) => {
    Haptics.selectionAsync();
    setFaceFilter(filter);
  };

  const renderColumn = (items: Template[], colOffset: number) => (
    <View style={styles.masonryColumn}>
      {items.map((tpl, idx) => (
        <PinterestCard
          key={tpl.id}
          template={tpl}
          cardWidth={CARD_WIDTH}
          aspectRatio={MASONRY_RATIOS[(colOffset + idx) % MASONRY_RATIOS.length]}
          onPress={() => handleTemplatePress(tpl.id)}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Theme.primary}
            colors={[Theme.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Explore</Text>
              <Text style={styles.headerSubtitle}>Discover AI portrait styles</Text>
            </View>
            <View style={styles.headerActions}>
              {user?.subscriptionTier && user.subscriptionTier !== 'free' && (
                <View style={styles.tierBadge}>
                  <Text style={styles.tierBadgeText}>{user.subscriptionTier.toUpperCase()}</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => router.push('/profile')}
                style={styles.settingsBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="person-circle-outline" size={26} color={Theme.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Full-width segmented filter bar */}
        <View style={styles.segmentedFilterContainer}>
          <TouchableOpacity
            style={[styles.segmentedSegment, faceFilter === 'all' && styles.segmentedSegmentActive]}
            onPress={() => handleFaceFilterPress('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentedText, faceFilter === 'all' && styles.segmentedTextActive]}>✨ All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentedSegment, faceFilter === 'solo' && styles.segmentedSegmentActive]}
            onPress={() => handleFaceFilterPress('solo')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentedText, faceFilter === 'solo' && styles.segmentedTextActive]}>👤 Solo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentedSegment, faceFilter === 'group' && styles.segmentedSegmentActive]}
            onPress={() => handleFaceFilterPress('group')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentedText, faceFilter === 'group' && styles.segmentedTextActive]}>👥 Multi-Face</Text>
          </TouchableOpacity>
        </View>

        {/* Category pills from API */}
        {(categories && categories.length > 0) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsWrap}
            contentContainerStyle={styles.pillsContent}
          >
            <PinterestPill
              label="All Categories"
              isActive={selectedCategoryId === null}
              onPress={() => handleCategoryPress(null)}
            />
            {categories.map((cat) => (
              <PinterestPill
                key={cat.id}
                label={`${cat.iconEmoji ? cat.iconEmoji + ' ' : ''}${cat.name}`}
                isActive={selectedCategoryId === cat.id}
                onPress={() => handleCategoryPress(cat.id)}
              />
            ))}
          </ScrollView>
        )}

        {/* Masonry grid */}
        <View style={styles.masonryContainer}>
          {isLoading ? (
            <View style={styles.masonryGrid}>
              <View style={styles.masonryColumn}>
                <View style={styles.skeletonCard}>
                  <Skeleton width={CARD_WIDTH} height={180} borderRadius={20} />
                  <Skeleton width={CARD_WIDTH * 0.7} height={12} borderRadius={6} style={{ marginTop: 8 }} />
                </View>
                <View style={styles.skeletonCard}>
                  <Skeleton width={CARD_WIDTH} height={220} borderRadius={20} />
                  <Skeleton width={CARD_WIDTH * 0.6} height={12} borderRadius={6} style={{ marginTop: 8 }} />
                </View>
              </View>
              <View style={styles.masonryColumn}>
                <View style={styles.skeletonCard}>
                  <Skeleton width={CARD_WIDTH} height={240} borderRadius={20} />
                  <Skeleton width={CARD_WIDTH * 0.65} height={12} borderRadius={6} style={{ marginTop: 8 }} />
                </View>
                <View style={styles.skeletonCard}>
                  <Skeleton width={CARD_WIDTH} height={160} borderRadius={20} />
                  <Skeleton width={CARD_WIDTH * 0.55} height={12} borderRadius={6} style={{ marginTop: 8 }} />
                </View>
              </View>
            </View>
          ) : isError ? (
            <View style={styles.errorWrap}>
              <Ionicons name="cloud-offline-outline" size={40} color={Theme.textMuted} />
              <Text style={styles.errorText}>Could not load templates.</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn} activeOpacity={0.8}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : filteredTemplates.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="images-outline" size={48} color={Theme.textMuted} />
              <Text style={styles.emptyText}>No templates in this category yet.</Text>
            </View>
          ) : (
            <View style={styles.masonryGrid}>
              {renderColumn(leftColumn, 0)}
              {renderColumn(rightColumn, 1)}
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
