import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslations } from '@/hooks/use-translations';
import { getDeck } from '@/src/lib/decks';
import { listItemsByDeck, setItemArchived } from '@/src/lib/items';
import type { Deck, Item } from '@/src/types/database';
import { borderRadius, fontFamilies, gradient, shadows } from '@/constants/theme';

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

  function handleSegmentChange(value: string) {
    const archived = value === 'archived';
    if (archived === showArchived) return;
    setShowArchived(archived);
  }

  function renderItem({ item, index }: { item: Item; index: number }) {
    const isDeckArchived = Boolean(deck?.archived);
    const archiveLabel = isDeckArchived
      ? t('deck.archiveDisabled')
      : item.archived
        ? t('common.unarchive')
        : t('common.archive');

    // Disable entry animations on Android due to shadow rendering issues
    const entering = Platform.OS === 'ios' ? FadeInUp.duration(300).delay(index * 50) : undefined;

    return (
      <Animated.View entering={entering}>
        <View style={[styles.itemCard, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
          <View style={styles.itemContent}>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {item.title}
            </ThemedText>
            <ThemedText numberOfLines={2} style={[styles.itemDescription, { color: textSecondary }]}>
              {item.content}
            </ThemedText>
            {item.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {item.tags.slice(0, 3).map((tag, i) => (
                  <View key={i} style={[styles.tag, { borderColor: cardBorder }]}>
                    <ThemedText style={[styles.tagText, { color: textSecondary }]}>
                      {tag}
                    </ThemedText>
                  </View>
                ))}
              </View>
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
            disabled={isDeckArchived}
          >
            <ThemedText style={[styles.archiveButtonText, { color: primaryColor }]}>
              {archiveLabel}
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  function renderEmpty() {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
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
        <AmbientBackground intensity="subtle" />
        <ActivityIndicator size="large" color={primaryColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground intensity="subtle" />

      <Stack.Screen
        options={{
          title: deck?.name ?? t('deck.titleFallback'),
        }}
      />

      {/* Segmented control for active/archived */}
      <View style={styles.segmentWrapper}>
        <SegmentedControl
          options={[
            { value: 'active', label: t('common.active') },
            { value: 'archived', label: t('common.archived') },
          ]}
          selected={showArchived ? 'archived' : 'active'}
          onSelect={handleSegmentChange}
        />
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: `${errorColor}20` }]}>
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            {error}
          </ThemedText>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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

      {/* Add button */}
      {!showArchived && !deck?.archived && (
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
          onPress={() => router.push(`/add-item?deckId=${id}` as never)}
        >
          <LinearGradient
            colors={gradient.colors}
            start={gradient.start}
            end={gradient.end}
            style={styles.fabGradient}
          >
            <ThemedText style={styles.fabText}>+</ThemedText>
          </LinearGradient>
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
  segmentWrapper: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  listContent: {
    padding: 20,
    paddingTop: 12,
    flexGrow: 1,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...shadows.sm,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemDescription: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyMedium,
  },
  archiveButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
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
    textAlign: 'center',
    fontFamily: fontFamilies.bodyMedium,
  },
  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 12,
    borderRadius: borderRadius.md,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    ...shadows.lg,
    shadowColor: '#06b6d4',
    shadowOpacity: 0.4,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#ffffff',
    fontSize: 32,
    fontFamily: fontFamilies.body,
    marginTop: -2,
  },
});
