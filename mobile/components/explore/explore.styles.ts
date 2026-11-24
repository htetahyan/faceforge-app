import { StyleSheet, Platform } from 'react-native';
import { Theme, Fonts } from '../../constants/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.background,
  },

  // ── Header ──
  header: {
    paddingHorizontal: Theme.space.base,
    paddingTop: Theme.space.base,
    paddingBottom: Theme.space.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Theme.text,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierBadge: {
    backgroundColor: Theme.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  tierBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.semibold,
    color: Theme.text,
    letterSpacing: 0.6,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Theme.textMuted,
    marginTop: 4,
  },

  // ── Segmented Control (Fits Screen Width) ──
  segmentedFilterContainer: {
    flexDirection: 'row',
    marginHorizontal: Theme.space.base,
    marginTop: Theme.space.sm,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 3,
  },
  segmentedSegment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  segmentedSegmentActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  segmentedText: {
    fontSize: 12.5,
    fontFamily: Fonts.medium,
    color: Theme.textMuted,
  },
  segmentedTextActive: {
    fontFamily: Fonts.bold,
    color: Theme.text,
  },

  // ── Pills ──
  pillsWrap: {
    marginTop: 10,
    marginBottom: Theme.space.xs,
  },
  pillsContent: {
    paddingHorizontal: Theme.space.base,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
  },
  pillActive: {
    backgroundColor: Theme.primary,
  },
  pillInactive: {
    backgroundColor: Theme.border,
  },
  pillText: {
    fontSize: 13,
    fontFamily: Fonts.semibold,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: Theme.textMuted,
  },

  // ── Masonry Grid ──
  masonryContainer: {
    paddingHorizontal: Theme.space.base,
    marginTop: Theme.space.base,
  },
  masonryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  masonryColumn: {
    flexDirection: 'column',
    gap: 12,
  },

  // ── Card ──
  card: {
    backgroundColor: 'transparent',
    overflow: 'visible',
    marginBottom: 12,
  },
  cardImageWrap: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: Theme.border,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#111111',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 4px 10px rgba(17, 17, 17, 0.08)',
      }
    } as any),
  } as any,
  cardImage: {
    width: '100%',
    height: '100%',
  },
  faceBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...Theme.shadow,
  },
  faceBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.semibold,
    color: Theme.text,
  },
  
  // Premium lock badges
  premiumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(230, 0, 35, 0.9)', // Pro Gold or Pinterest Red
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    ...Theme.shadow,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  cardContent: {
    paddingTop: 8,
    paddingHorizontal: 4,
    gap: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: Fonts.semibold,
    color: Theme.text,
  },
  cardSubtitle: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Theme.textMuted,
  },

  // ── Skeleton ──
  skeletonCard: {
    backgroundColor: 'transparent',
    overflow: 'visible',
    marginBottom: 12,
    gap: 4,
  },

  // ── Error State ──
  errorWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: Theme.error,
    textAlign: 'center',
  },
  retryBtn: {
    ...Theme.buttonSecondary,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as any,
  retryBtnText: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: Theme.text,
  },

  // ── Empty State ──
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: Theme.textMuted,
  },
});
