import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

// Disable entry animations on Android due to shadow rendering issues during animation
const shouldAnimate = Platform.OS === 'ios';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { GradientButton } from '@/components/ui/GradientButton';
import { GradientText } from '@/components/ui/GradientText';
import { RatingButtonRow } from '@/components/ui/RatingButton';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslations } from '@/hooks/use-translations';
import { supabase } from '@/src/lib/supabase';
import { submitReview } from '@/src/lib/today';
import { type Grade } from '@/src/lib/scheduling';
import type { Item } from '@/src/types/database';
import { borderRadius, fontFamilies } from '@/constants/theme';

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

  const cardBorder = useThemeColor({}, 'cardBorder');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const errorColor = useThemeColor({}, 'error');
  const { t } = useTranslations();

  const gradeLabels: Record<Grade, string> = {
    1: t('review.grade.forgot'),
    2: t('review.grade.hard'),
    3: t('review.grade.good'),
    4: t('review.grade.easy'),
  };

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

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <AmbientBackground intensity="subtle" />
        <ActivityIndicator size="large" color={primaryColor} />
      </ThemedView>
    );
  }

  if (!item) {
    return (
      <ThemedView style={styles.container}>
        <AmbientBackground intensity="subtle" />
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.error, { color: errorColor }]}>
            {error || t('review.notFound')}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground intensity="medium" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Section */}
        <Animated.View entering={shouldAnimate ? FadeInUp.duration(400) : undefined}>
          <ThemedText style={[styles.label, { color: textSecondary }]}>
            {t('review.question')}
          </ThemedText>
          <ThemedText type="displayMedium" style={styles.questionText}>
            {item.title}
          </ThemedText>
        </Animated.View>

        {/* Reveal Button or Answer */}
        {revealed ? (
          <Animated.View entering={shouldAnimate ? FadeInDown.duration(500).delay(100) : undefined}>
            <View style={styles.divider} />

            <ThemedText style={[styles.label, { color: textSecondary }]}>
              {t('review.answer')}
            </ThemedText>
            <GradientText size="displaySmall" style={styles.answerText}>
              {item.content}
            </GradientText>

            {/* Source URL */}
            {item.source_url && (
              <Pressable
                style={({ pressed }) => [
                  styles.sourceLink,
                  { borderColor: cardBorder, backgroundColor: cardBackground },
                  pressed && styles.linkPressed,
                ]}
                onPress={() => handleOpenUrl(item.source_url!)}>
                <ThemedText
                  style={[styles.sourceLinkText, { color: primaryColor }]}
                  numberOfLines={1}
                >
                  {item.source_url}
                </ThemedText>
              </Pressable>
            )}

            {/* Tags */}
            {item.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {item.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[styles.tag, { borderColor: cardBorder, backgroundColor: cardBackground }]}
                  >
                    <ThemedText style={[styles.tagText, { color: textSecondary }]}>
                      {tag}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        ) : (
          <Animated.View
            entering={shouldAnimate ? FadeInUp.duration(400).delay(200) : undefined}
            style={styles.revealContainer}
          >
            <GradientButton
              title={t('review.reveal')}
              onPress={() => setRevealed(true)}
              size="lg"
            />
          </Animated.View>
        )}
      </ScrollView>

      {/* Error Banner */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: `${errorColor}20` }]}>
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            {error}
          </ThemedText>
        </View>
      )}

      {/* Rating Buttons */}
      {revealed && (
        <Animated.View
          entering={shouldAnimate ? FadeInDown.duration(400).delay(200) : undefined}
          style={styles.gradeContainer}
        >
          <ThemedText style={[styles.gradePrompt, { color: textSecondary }]}>
            {t('review.prompt')}
          </ThemedText>
          <RatingButtonRow
            onGrade={handleGrade}
            disabled={isSubmitting}
            labels={gradeLabels}
          />
        </Animated.View>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  label: {
    fontSize: 13,
    fontFamily: fontFamilies.bodyMedium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  questionText: {
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginVertical: 32,
  },
  answerText: {
    marginBottom: 24,
  },
  revealContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  sourceLink: {
    marginTop: 24,
    padding: 16,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
  linkPressed: {
    opacity: 0.7,
  },
  sourceLinkText: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyMedium,
  },
  error: {
    textAlign: 'center',
  },
  errorBanner: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 12,
    borderRadius: borderRadius.md,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
  },
  gradeContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  gradePrompt: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
  },
});
