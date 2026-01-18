import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { Card } from '@/components/ui/Card';
import { GradientText } from '@/components/ui/GradientText';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslations } from '@/hooks/use-translations';
import { getDueItems, getNextDueItem, type DueItem } from '@/src/lib/today';
import { borderRadius, fontFamilies, gradient, shadows } from '@/constants/theme';
import { getLocale } from '@/src/lib/i18n';

export default function TodayScreen() {
  const router = useRouter();
  const [dueItems, setDueItems] = useState<DueItem[]>([]);
  const [nextItem, setNextItem] = useState<{ dueAt: Date; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardBackground = useThemeColor({}, 'cardBackground');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const errorColor = useThemeColor({}, 'error');
  const { t, language } = useTranslations();
  const locale = getLocale(language);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const items = await getDueItems();
      setDueItems(items);

      // If no due items, get the next one
      if (items.length === 0) {
        const next = await getNextDueItem();
        setNextItem(next);
      } else {
        setNextItem(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('today.errorLoad'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  function handleRefresh() {
    setIsRefreshing(true);
    fetchData(false);
  }

  function handleItemPress(dueItem: DueItem) {
    router.push({
      pathname: '/review',
      params: {
        itemId: dueItem.item.id,
        scheduleId: dueItem.schedule.id,
        intervalDays: dueItem.schedule.interval_days.toString(),
        easeFactor: dueItem.schedule.ease_factor.toString(),
      },
    } as never);
  }

  function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      return t('relative.inDays_other', { count: diffDays });
    } else if (diffDays === 1) {
      return t('relative.tomorrow');
    } else if (diffHours > 0) {
      return t(
        diffHours === 1 ? 'relative.inHours_one' : 'relative.inHours_other',
        { count: diffHours }
      );
    } else {
      return t('relative.soon');
    }
  }

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return t('today.greeting.morning');
    if (hour < 17) return t('today.greeting.afternoon');
    return t('today.greeting.evening');
  }

  function formatDate(): string {
    return new Date().toLocaleDateString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  function renderHeader() {
    // Disable entry animations on Android due to shadow rendering issues
    const entering = Platform.OS === 'ios' ? FadeInDown.duration(400) : undefined;

    return (
      <Animated.View entering={entering}>
        {/* Date & Greeting */}
        <View style={styles.headerSection}>
          <ThemedText style={[styles.dateText, { color: textSecondary }]}>
            {formatDate()}
          </ThemedText>
          <ThemedText type="title" style={styles.greeting}>
            {getGreeting()}
          </ThemedText>
        </View>

        {/* Due Count Card */}
        {dueItems.length > 0 && (
          <Card glow style={styles.dueCard}>
            <View style={styles.dueCardContent}>
              <GradientText size="displayLarge">
                {dueItems.length.toString()}
              </GradientText>
              <ThemedText style={[styles.dueCardLabel, { color: textSecondary }]}>
                {t(
                  dueItems.length === 1
                    ? 'today.cardsToReview_one'
                    : 'today.cardsToReview_other'
                )}
              </ThemedText>
            </View>
          </Card>
        )}
      </Animated.View>
    );
  }

  function renderItem({ item, index }: { item: DueItem; index: number }) {
    // Disable entry animations on Android due to shadow rendering issues
    const entering = Platform.OS === 'ios' ? FadeInUp.duration(300).delay(index * 50) : undefined;

    return (
      <Animated.View entering={entering}>
        <Pressable
          style={({ pressed }) => [
            styles.itemCard,
            { borderColor: cardBorder, backgroundColor: cardBackground },
            pressed && styles.itemPressed,
          ]}
          onPress={() => handleItemPress(item)}
        >
          <View style={styles.itemContent}>
            <ThemedText type="defaultSemiBold" numberOfLines={2}>
              {item.item.title}
            </ThemedText>
          </View>
          <LinearGradient
            colors={gradient.colors}
            start={gradient.start}
            end={gradient.end}
            style={styles.arrowContainer}
          >
            <ThemedText style={styles.arrow}>{'>'}</ThemedText>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  function renderEmpty() {
    if (isLoading) return null;

    // Disable entry animations on Android due to shadow rendering issues
    const entering = Platform.OS === 'ios' ? FadeInUp.duration(500) : undefined;

    return (
      <Animated.View
        entering={entering}
        style={styles.emptyContainer}
      >
        <Card glow gradient style={styles.emptyCard}>
          <ThemedText style={styles.emptyEmoji}>🎉</ThemedText>
          <GradientText size="h2" style={styles.emptyTitle}>
            {t('today.emptyTitle')}
          </GradientText>
          <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
            {t('today.emptySubtitle')}
          </ThemedText>
          {nextItem && (
            <ThemedText style={[styles.nextDue, { color: textMuted }]}>
              {t('today.nextUp', {
                title: nextItem.title,
                when: formatRelativeTime(nextItem.dueAt),
              })}
            </ThemedText>
          )}
          {!nextItem && (
            <ThemedText style={[styles.nextDue, { color: textMuted }]}>
              {t('today.noNext')}
            </ThemedText>
          )}
        </Card>
      </Animated.View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground intensity="subtle" />

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: `${errorColor}20` }]}>
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            {error}
          </ThemedText>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : (
        <FlatList
          data={dueItems}
          keyExtractor={(item) => item.item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={primaryColor}
            />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  headerSection: {
    marginBottom: 24,
  },
  dateText: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  greeting: {
    marginBottom: 0,
  },
  dueCard: {
    marginBottom: 24,
  },
  dueCardContent: {
    alignItems: 'center',
  },
  dueCardLabel: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
    marginTop: 4,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  itemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: fontFamilies.bodyBold,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 56,
    lineHeight: 70,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: fontFamilies.bodyMedium,
    lineHeight: 22,
  },
  nextDue: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
  },
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: borderRadius.md,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
  },
});
