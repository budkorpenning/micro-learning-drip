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
import { listDecks } from '@/src/lib/decks';
import type { DeckWithCount } from '@/src/types/database';

export default function LibraryScreen() {
  const router = useRouter();
  const [decks, setDecks] = useState<DeckWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const borderColor = useThemeColor({ light: '#ddd', dark: '#333' }, 'text');

  const fetchDecks = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const data = await listDecks();
      setDecks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decks');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Refresh when screen comes into focus (e.g., after creating a deck)
  useFocusEffect(
    useCallback(() => {
      fetchDecks();
    }, [fetchDecks])
  );

  function handleRefresh() {
    setIsRefreshing(true);
    fetchDecks(false);
  }

  function renderDeck({ item }: { item: DeckWithCount }) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.deckCard,
          { borderColor },
          pressed && styles.deckCardPressed,
        ]}
        onPress={() => router.push(`/deck/${item.id}` as never)}>
        <View style={styles.deckContent}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.cardCount}>
            {item.card_count} {item.card_count === 1 ? 'card' : 'cards'}
          </ThemedText>
        </View>
        <ThemedText style={styles.chevron}>›</ThemedText>
      </Pressable>
    );
  }

  function renderEmpty() {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>
          Create your first deck
        </ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Tap + to get started
        </ThemedText>
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
          data={decks}
          keyExtractor={(deck) => deck.id}
          renderItem={renderDeck}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {/* Add deck button */}
      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.addButtonPressed,
        ]}
        onPress={() => router.push('/create-deck' as never)}>
        <ThemedText style={styles.addButtonText}>+</ThemedText>
      </Pressable>
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
  deckCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deckCardPressed: {
    opacity: 0.7,
  },
  deckContent: {
    flex: 1,
  },
  cardCount: {
    opacity: 0.6,
    marginTop: 4,
    fontSize: 14,
  },
  chevron: {
    fontSize: 24,
    opacity: 0.4,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    opacity: 0.6,
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    marginHorizontal: 16,
    marginTop: 16,
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
