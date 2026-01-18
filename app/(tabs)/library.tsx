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
import { listDecks, setDeckArchived } from '@/src/lib/decks';
import type { DeckWithCount } from '@/src/types/database';

export default function LibraryScreen() {
  const router = useRouter();
  const [decks, setDecks] = useState<DeckWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const borderColor = useThemeColor({ light: '#ddd', dark: '#333' }, 'text');
  const segmentBg = useThemeColor({ light: '#eee', dark: '#222' }, 'background');
  const activeSegmentBg = useThemeColor({ light: '#fff', dark: '#444' }, 'background');
  const { t } = useTranslations();

  const fetchDecks = useCallback(async (archived: boolean, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const data = await listDecks({ archived });
      setDecks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('library.errorLoad'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  // Refresh when screen comes into focus (e.g., after creating a deck)
  useFocusEffect(
    useCallback(() => {
      fetchDecks(showArchived);
    }, [fetchDecks, showArchived])
  );

  function handleRefresh() {
    setIsRefreshing(true);
    fetchDecks(showArchived, false);
  }

  async function handleDeckArchiveToggle(deck: DeckWithCount) {
    try {
      await setDeckArchived(deck.id, !deck.archived);
      setDecks((prev) => prev.filter((d) => d.id !== deck.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('library.errorUpdate'));
    }
  }

  function handleSegmentChange(archived: boolean) {
    if (archived === showArchived) return;
    setShowArchived(archived);
    fetchDecks(archived);
  }

  function renderDeck({ item }: { item: DeckWithCount }) {
    return (
      <View style={[styles.deckCard, { borderColor }]}>
        <Pressable
          style={({ pressed }) => [
            styles.deckMain,
            pressed && styles.deckMainPressed,
          ]}
          onPress={() => router.push(`/deck/${item.id}` as never)}>
          <View style={styles.deckContent}>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText style={styles.cardCount}>
              {t(
                item.card_count === 1
                  ? 'library.cardCount_one'
                  : 'library.cardCount_other',
                { count: item.card_count }
              )}
            </ThemedText>
          </View>
          <ThemedText style={styles.chevron}>›</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.archiveButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => handleDeckArchiveToggle(item)}>
          <ThemedText style={styles.archiveButtonText}>
            {item.archived ? t('common.unarchive') : t('common.archive')}
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
          {showArchived ? t('library.emptyArchived') : t('library.emptyActive')}
        </ThemedText>
        {!showArchived && (
          <ThemedText style={styles.emptySubtext}>
            {t('library.emptyActiveHint')}
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

      {/* Segmented control for active/archived decks */}
      <View style={[styles.segmentContainer, { backgroundColor: segmentBg }]}>
        <Pressable
          style={[
            styles.segment,
            !showArchived && [styles.segmentActive, { backgroundColor: activeSegmentBg }],
          ]}
          onPress={() => handleSegmentChange(false)}>
          <ThemedText style={!showArchived ? styles.segmentTextActive : styles.segmentText}>
            {t('common.active')}
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.segment,
            showArchived && [styles.segmentActive, { backgroundColor: activeSegmentBg }],
          ]}
          onPress={() => handleSegmentChange(true)}>
          <ThemedText style={showArchived ? styles.segmentTextActive : styles.segmentText}>
            {t('common.archived')}
          </ThemedText>
        </Pressable>
      </View>

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
      {!showArchived && (
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => router.push('/create-deck' as never)}>
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
    marginBottom: 0,
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
    flexGrow: 1,
  },
  deckCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deckMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deckMainPressed: {
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
  archiveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#888',
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
