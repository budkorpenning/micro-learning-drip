import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslations } from '@/hooks/use-translations';
import { getDueItems, getNextDueItem, type DueItem } from '@/src/lib/today';
import { fontFamilies, shadows } from '@/constants/theme';

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
  const errorColor = useThemeColor({}, 'error');
  const { t } = useTranslations();

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

  function renderItem({ item }: { item: DueItem }) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.itemCard,
          { borderColor: cardBorder, backgroundColor: cardBackground },
          pressed && styles.itemPressed,
        ]}
        onPress={() => handleItemPress(item)}>
        <View style={styles.itemContent}>
          <ThemedText type="defaultSemiBold" numberOfLines={2}>
            {item.item.title}
          </ThemedText>
        </View>
        <ThemedText style={[styles.reviewPrompt, { color: textSecondary }]}>
          {t('today.reviewPrompt')}
        </ThemedText>
      </Pressable>
    );
  }

  function renderEmpty() {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyEmoji}>🎉</ThemedText>
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          {t('today.emptyTitle')}
        </ThemedText>
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
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {error && (
        <ThemedText style={[styles.error, { color: errorColor }]}>
          {error}
        </ThemedText>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={dueItems}
          keyExtractor={(item) => item.item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          ListHeaderComponent={
            dueItems.length > 0 ? (
              <ThemedText style={[styles.headerText, { color: textSecondary }]}>
                {t(
                  dueItems.length === 1
                    ? 'today.itemsToReview_one'
                    : 'today.itemsToReview_other',
                  { count: dueItems.length }
                )}
              </ThemedText>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
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
    padding: 16,
    flexGrow: 1,
  },
  headerText: {
    marginBottom: 16,
    fontFamily: fontFamilies.bodyMedium,
  },
  itemCard: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  itemPressed: {
    opacity: 0.7,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  reviewPrompt: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    lineHeight: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: fontFamilies.bodyMedium,
  },
  nextDue: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
  },
  error: {
    textAlign: 'center',
    margin: 16,
  },
});
