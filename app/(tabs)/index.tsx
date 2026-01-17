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
import { getDueItems, getNextDueItem, type DueItem } from '@/src/lib/today';

export default function TodayScreen() {
  const router = useRouter();
  const [dueItems, setDueItems] = useState<DueItem[]>([]);
  const [nextItem, setNextItem] = useState<{ dueAt: Date; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const borderColor = useThemeColor({ light: '#ddd', dark: '#333' }, 'text');

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
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

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
      return `in ${diffDays} days`;
    } else if (diffDays === 1) {
      return 'tomorrow';
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'soon';
    }
  }

  function renderItem({ item }: { item: DueItem }) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.itemCard,
          { borderColor },
          pressed && styles.itemPressed,
        ]}
        onPress={() => handleItemPress(item)}>
        <View style={styles.itemContent}>
          <ThemedText type="defaultSemiBold" numberOfLines={2}>
            {item.item.title}
          </ThemedText>
        </View>
        <ThemedText style={styles.reviewPrompt}>Review →</ThemedText>
      </Pressable>
    );
  }

  function renderEmpty() {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyEmoji}>🎉</ThemedText>
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          All caught up!
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          Great job! You've reviewed all your due items.
        </ThemedText>
        {nextItem && (
          <ThemedText style={styles.nextDue}>
            Next up: "{nextItem.title}" {formatRelativeTime(nextItem.dueAt)}
          </ThemedText>
        )}
        {!nextItem && (
          <ThemedText style={styles.nextDue}>
            Add items in the Library tab to start learning!
          </ThemedText>
        )}
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {error && (
        <ThemedText style={styles.error}>{error}</ThemedText>
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
              <ThemedText style={styles.headerText}>
                {dueItems.length} item{dueItems.length !== 1 ? 's' : ''} to review
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
    opacity: 0.6,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPressed: {
    opacity: 0.7,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  reviewPrompt: {
    opacity: 0.5,
    fontSize: 14,
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
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 16,
  },
  nextDue: {
    opacity: 0.5,
    textAlign: 'center',
    fontSize: 14,
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    margin: 16,
  },
});
