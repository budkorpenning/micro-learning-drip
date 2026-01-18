import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { getDeck } from '@/src/lib/decks';
import { listItemsByDeck, setItemArchived } from '@/src/lib/items';
import type { Deck, Item } from '@/src/types/database';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const borderColor = useThemeColor({ light: '#ddd', dark: '#333' }, 'text');
  const segmentBg = useThemeColor({ light: '#eee', dark: '#222' }, 'background');
  const activeSegmentBg = useThemeColor({ light: '#fff', dark: '#444' }, 'background');

  const fetchData = useCallback(async (showLoading = true) => {
    if (!id) return;
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const [deckData, itemsData] = await Promise.all([
        getDeck(id),
        listItemsByDeck(id, { archived: showArchived }),
      ]);
      setDeck(deckData);
      if (deckData.archived && !showArchived) {
        setShowArchived(true);
      }
      setItems(itemsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deck');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, showArchived]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleArchiveToggle(item: Item) {
    if (deck?.archived) return;
    try {
      await setItemArchived(item.id, !item.archived);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  }

  function handleRefresh() {
    setIsRefreshing(true);
    fetchData(false);
  }

  function renderItem({ item }: { item: Item }) {
    const isDeckArchived = Boolean(deck?.archived);
    const archiveLabel = isDeckArchived
      ? 'Deck archived'
      : item.archived
        ? 'Unarchive'
        : 'Archive';

    return (
      <View style={[styles.itemCard, { borderColor }]}>
        <View style={styles.itemContent}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {item.title}
          </ThemedText>
          <ThemedText numberOfLines={2} style={styles.itemDescription}>
            {item.content}
          </ThemedText>
          {item.tags.length > 0 && (
            <ThemedText style={styles.tags}>
              {item.tags.join(', ')}
            </ThemedText>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.archiveButton,
            pressed && styles.buttonPressed,
            isDeckArchived && styles.archiveButtonDisabled,
          ]}
          onPress={() => handleArchiveToggle(item)}
          disabled={isDeckArchived}>
          <ThemedText style={styles.archiveButtonText}>
            {archiveLabel}
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  function renderEmpty() {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>
          {showArchived
            ? 'No archived cards'
            : 'No cards yet. Tap + to add your first card.'}
        </ThemedText>
      </View>
    );
  }

  if (isLoading && !deck) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: deck?.name ?? 'Deck',
        }}
      />

      {/* Segmented control for active/archived */}
      <View style={[styles.segmentContainer, { backgroundColor: segmentBg }]}>
        <Pressable
          style={[
            styles.segment,
            !showArchived && [styles.segmentActive, { backgroundColor: activeSegmentBg }],
          ]}
          onPress={() => setShowArchived(false)}>
          <ThemedText style={!showArchived ? styles.segmentTextActive : styles.segmentText}>
            Active
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.segment,
            showArchived && [styles.segmentActive, { backgroundColor: activeSegmentBg }],
          ]}
          onPress={() => setShowArchived(true)}>
          <ThemedText style={showArchived ? styles.segmentTextActive : styles.segmentText}>
            Archived
          </ThemedText>
        </Pressable>
      </View>

      {error && (
        <ThemedText style={styles.error}>{error}</ThemedText>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      />

      {/* Add button */}
      {!showArchived && !deck?.archived && (
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => router.push(`/add-item?deckId=${id}` as never)}>
          <ThemedText style={styles.addButtonText}>+</ThemedText>
        </Pressable>
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
  segmentContainer: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    opacity: 0.6,
  },
  segmentTextActive: {
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemDescription: {
    opacity: 0.7,
    marginTop: 4,
    fontSize: 14,
  },
  tags: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.5,
  },
  archiveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#888',
  },
  archiveButtonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  archiveButtonText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    opacity: 0.6,
    textAlign: 'center',
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
});
