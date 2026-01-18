import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslations } from '@/hooks/use-translations';
import { supabase } from '@/src/lib/supabase';
import { submitReview } from '@/src/lib/today';
import { type Grade } from '@/src/lib/scheduling';
import type { Item } from '@/src/types/database';

const GRADE_COLORS: Record<Grade, string> = {
  1: '#E53935', // Forgot - red
  2: '#FB8C00', // Hard - orange
  3: '#FDD835', // Good - yellow
  4: '#43A047', // Easy - green
};

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    itemId: string;
    scheduleId: string;
    intervalDays: string;
    easeFactor: string;
  }>();

  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const borderColor = useThemeColor({ light: '#ddd', dark: '#333' }, 'text');
  const { t } = useTranslations();

  // Reset revealed state when itemId changes
  useEffect(() => {
    setRevealed(false);
  }, [params.itemId]);

  useEffect(() => {
    async function fetchItem() {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', params.itemId)
          .single();

        if (error) throw error;
        setItem(data as Item);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('review.errorLoad'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchItem();
  }, [params.itemId, t]);

  async function handleGrade(grade: Grade) {
    if (isSubmitting || !params.itemId || !params.scheduleId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitReview(
        params.itemId,
        params.scheduleId,
        parseInt(params.intervalDays, 10),
        parseFloat(params.easeFactor),
        grade
      );
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('review.errorSubmit'));
      setIsSubmitting(false);
    }
  }

  async function handleOpenUrl(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setError(t('review.errorOpenUrl'));
    }
  }

  function gradeLabel(grade: Grade): string {
    switch (grade) {
      case 1:
        return t('review.grade.forgot');
      case 2:
        return t('review.grade.hard');
      case 3:
        return t('review.grade.good');
      case 4:
        return t('review.grade.easy');
      default:
        return String(grade);
    }
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!item) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.error}>
          {error || t('review.notFound')}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="subtitle" style={styles.label}>
          {t('review.question')}
        </ThemedText>
        <ThemedText type="title" style={styles.title}>
          {item.title}
        </ThemedText>

        {revealed ? (
          <>
            <ThemedText type="subtitle" style={styles.label}>
              {t('review.answer')}
            </ThemedText>
            <ThemedText style={styles.content}>
              {item.content}
            </ThemedText>

            {item.source_url && (
              <Pressable
                style={({ pressed }) => [
                  styles.sourceLink,
                  { borderColor },
                  pressed && styles.linkPressed,
                ]}
                onPress={() => handleOpenUrl(item.source_url!)}>
                <ThemedText style={styles.sourceLinkText} numberOfLines={1}>
                  {item.source_url}
                </ThemedText>
              </Pressable>
            )}

            {item.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {item.tags.map((tag, index) => (
                  <View key={index} style={[styles.tag, { borderColor }]}>
                    <ThemedText style={styles.tagText}>{tag}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.revealButton,
              pressed && styles.revealButtonPressed,
            ]}
            onPress={() => setRevealed(true)}>
            <ThemedText style={styles.revealButtonText}>{t('review.reveal')}</ThemedText>
          </Pressable>
        )}
      </ScrollView>

      {error && (
        <ThemedText style={styles.error}>{error}</ThemedText>
      )}

      {revealed && (
        <View style={styles.gradeContainer}>
          <ThemedText style={styles.gradePrompt}>
            {t('review.prompt')}
          </ThemedText>
          <View style={styles.gradeButtons}>
            {([1, 2, 3, 4] as Grade[]).map((grade) => (
              <Pressable
                key={grade}
                style={({ pressed }) => [
                  styles.gradeButton,
                  { backgroundColor: GRADE_COLORS[grade] },
                  pressed && styles.gradeButtonPressed,
                  isSubmitting && styles.gradeButtonDisabled,
                ]}
                onPress={() => handleGrade(grade)}
                disabled={isSubmitting}>
                <ThemedText style={styles.gradeNumber}>{grade}</ThemedText>
                <ThemedText style={styles.gradeLabel}>
                  {gradeLabel(grade)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  label: {
    opacity: 0.6,
    marginBottom: 8,
    marginTop: 16,
  },
  title: {
    marginBottom: 16,
  },
  revealButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  revealButtonPressed: {
    opacity: 0.8,
  },
  revealButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    fontSize: 18,
    lineHeight: 28,
  },
  sourceLink: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  linkPressed: {
    opacity: 0.7,
  },
  sourceLinkText: {
    color: '#4285F4',
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    opacity: 0.7,
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  gradeContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  gradePrompt: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  gradeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  gradeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  gradeButtonPressed: {
    opacity: 0.8,
  },
  gradeButtonDisabled: {
    opacity: 0.5,
  },
  gradeNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gradeLabel: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
});
