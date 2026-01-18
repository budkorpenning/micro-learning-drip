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
import { useTranslations } from '@/hooks/use-translations';
import { getDeck } from '@/src/lib/decks';
import { listItemsByDeck, setItemArchived } from '@/src/lib/items';
import type { Deck, Item } from '@/src/types/database';
import { fontFamilies, shadows } from '@/constants/theme';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const cardBorder = useThemeColor({}, 'cardBorder');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const segmentBg = useThemeColor({}, 'surfaceElevated2');
  const activeSegmentBg = useThemeColor({}, 'surfaceElevated1');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const errorColor = useThemeColor({}, 'error');
  const { t } = useTranslations();

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
      setError(err instanceof Error ? err.message : t('deck.errorLoad'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, showArchived, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleArchiveToggle(item: Item) {
    if (deck?.archived) return;
    try {
      await setItemArchived(item.id, !item.archived);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deck.errorUpdateItem'));
    }
  }

  function handleRefresh() {
    setIsRefreshing(true);
    fetchData(false);
  }

  function renderItem({ item }: { item: Item }) {
    const isDeckArchived = Boolean(deck?.archived);
    const archiveLabel = isDeckArchived
      ? t('deck.archiveDisabled')
      : item.archived
        ? t('common.unarchive')
        : t('common.archive');

    return (
      <View style={[styles.itemCard, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
        <View style={styles.itemContent}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {item.title}
          </ThemedText>
          <ThemedText numberOfLines={2} style={styles.itemDescription}>
            {item.content}
          </ThemedText>
          {item.tags.length > 0 && (
            <ThemedText style={[styles.tags, { color: textSecondary }]}>
              {item.tags.join(', ')}
            </ThemedText>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.archiveButton,
            { borderColor: primaryColor },
            pressed && styles.buttonPressed,
            isDeckArchived && styles.archiveButtonDisabled,
          ]}
          onPress={() => handleArchiveToggle(item)}
          disabled={isDeckArchived}>
          <ThemedText style={[styles.archiveButtonText, { color: primaryColor }]}>
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
            ? t('deck.emptyArchived')
            : t('deck.emptyActive')}
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
          title: deck?.name ?? t('deck.titleFallback'),
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
            {t('common.active')}
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.segment,
            showArchived && [styles.segmentActive, { backgroundColor: activeSegmentBg }],
          ]}
          onPress={() => setShowArchived(true)}>
          <ThemedText style={showArchived ? styles.segmentTextActive : styles.segmentText}>
            {t('common.archived')}
          </ThemedText>
        </Pressable>
      </View>

      {error && (
        <ThemedText style={[styles.error, { color: errorColor }]}>
          {error}
        </ThemedText>
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
            { backgroundColor: primaryColor },
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
    fontFamily: fontFamilies.bodyMedium,
  },
  segmentTextActive: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
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
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemDescription: {
    opacity: 0.7,
    marginTop: 4,
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
  },
  tags: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: fontFamilies.bodyMedium,
  },
  archiveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
  },
  archiveButtonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  archiveButtonText: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyMedium,
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
    fontFamily: fontFamilies.bodyMedium,
  },
  error: {
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
    fontFamily: fontFamilies.body,
    marginTop: -2,
  },
});
