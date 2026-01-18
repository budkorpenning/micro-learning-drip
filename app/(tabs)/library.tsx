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
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslations } from '@/hooks/use-translations';
import { listDecks, setDeckArchived } from '@/src/lib/decks';
import type { DeckWithCount } from '@/src/types/database';
import { borderRadius, fontFamilies, gradient, shadows } from '@/constants/theme';

export default function LibraryScreen() {
  const router = useRouter();
  const [decks, setDecks] = useState<DeckWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const cardBorder = useThemeColor({}, 'cardBorder');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const errorColor = useThemeColor({}, 'error');
  const primaryColor = useThemeColor({}, 'primary');
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

  function handleSegmentChange(value: string) {
    const archived = value === 'archived';
    if (archived === showArchived) return;
    setShowArchived(archived);
    fetchDecks(archived);
  }

  function renderDeck({ item, index }: { item: DeckWithCount; index: number }) {
    // Disable entry animations on Android due to shadow rendering issues
    const entering = Platform.OS === 'ios' ? FadeInUp.duration(300).delay(index * 50) : undefined;

    return (
      <Animated.View entering={entering}>
        <View style={[styles.deckCard, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
          <Pressable
            style={({ pressed }) => [
              styles.deckMain,
              pressed && styles.deckMainPressed,
            ]}
            onPress={() => router.push(`/deck/${item.id}` as never)}
          >
            <View style={styles.deckContent}>
              <ThemedText type="defaultSemiBold" numberOfLines={1}>
                {item.name}
              </ThemedText>
              <ThemedText style={[styles.cardCount, { color: textSecondary }]}>
                {t(
                  item.card_count === 1
                    ? 'library.cardCount_one'
                    : 'library.cardCount_other',
                  { count: item.card_count }
                )}
              </ThemedText>
            </View>
            <LinearGradient
              colors={gradient.colors}
              start={gradient.start}
              end={gradient.end}
              style={styles.chevronContainer}
            >
              <ThemedText style={styles.chevron}>{'>'}</ThemedText>
            </LinearGradient>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.archiveButton,
              { borderColor: primaryColor },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleDeckArchiveToggle(item)}
          >
            <ThemedText style={[styles.archiveButtonText, { color: primaryColor }]}>
              {item.archived ? t('common.unarchive') : t('common.archive')}
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
        <ThemedText style={styles.emptyText}>
          {showArchived ? t('library.emptyArchived') : t('library.emptyActive')}
        </ThemedText>
        {!showArchived && (
          <ThemedText style={[styles.emptySubtext, { color: textSecondary }]}>
            {t('library.emptyActiveHint')}
          </ThemedText>
        )}
      </View>
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

      {/* Segmented control for active/archived decks */}
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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(deck) => deck.id}
          renderItem={renderDeck}
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

      {/* Add deck FAB */}
      {!showArchived && (
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
          onPress={() => router.push('/create-deck' as never)}
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
  deckCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadows.sm,
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
    marginTop: 4,
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
  },
  chevronContainer: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  chevron: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: fontFamilies.bodyBold,
  },
  archiveButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
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
    fontSize: 18,
    fontFamily: fontFamilies.bodySemiBold,
    marginBottom: 8,
  },
  emptySubtext: {
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
