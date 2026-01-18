import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
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
import { Card } from '@/components/ui/Card';
import { GradientText } from '@/components/ui/GradientText';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslations } from '@/hooks/use-translations';
import { getLocale } from '@/src/lib/i18n';
import { borderRadius, fontFamilies, gradient, ratingColors, shadows } from '@/constants/theme';
import { getStats, type StatsData } from '@/src/lib/stats';

export default function StatsScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const primaryColor = useThemeColor({}, 'primary');
  const errorColor = useThemeColor({}, 'error');
  const { t, language } = useTranslations();
  const locale = getLocale(language);

  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('stats.errorLoad'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats(false);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <AmbientBackground intensity="subtle" />
        <ActivityIndicator size="large" color={primaryColor} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <AmbientBackground intensity="subtle" />
        <View style={[styles.errorBanner, { backgroundColor: `${errorColor}20` }]}>
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            {error}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!stats) return null;

  const maxCount = Math.max(...stats.last7Days.map(d => d.count), 1);
  const todayStr = new Date().toLocaleDateString(locale, { weekday: 'short' });

  // Progress item colors
  const progressColors = {
    learning: ratingColors.hard.colors[0], // amber
    reviewing: ratingColors.good.colors[0], // cyan
    mastered: ratingColors.easy.colors[0], // emerald
  };

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground intensity="subtle" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={primaryColor}
          />
        }
      >
        {/* Overview Section */}
        <Animated.View entering={shouldAnimate ? FadeInDown.duration(400) : undefined}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t('stats.overview')}
          </ThemedText>
          <View style={styles.statsRow}>
            <Card glow style={styles.statCard}>
              <GradientText size="h1">{stats.totalReviews.toString()}</GradientText>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                {t('stats.total')}
              </ThemedText>
            </Card>
            <Card style={styles.statCard}>
              <GradientText size="h1">{stats.dueNow.toString()}</GradientText>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                {t('stats.dueNow')}
              </ThemedText>
            </Card>
            <Card style={styles.statCard}>
              <GradientText size="h1">
                {stats.currentStreak > 0 ? `${stats.currentStreak}d` : '-'}
              </GradientText>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                {t('stats.streak')}
              </ThemedText>
            </Card>
          </View>
        </Animated.View>

        {/* Items Progress Section */}
        <Animated.View entering={shouldAnimate ? FadeInUp.duration(400).delay(100) : undefined}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t('stats.itemsProgress')}
          </ThemedText>
          <Card style={styles.progressCard}>
            <View style={styles.progressRow}>
              <View style={[styles.dot, { backgroundColor: progressColors.learning }]} />
              <ThemedText style={styles.progressLabel}>
                {t('stats.learning')}
              </ThemedText>
              <ThemedText style={styles.progressValue}>
                {stats.learningItems}
              </ThemedText>
            </View>
            <View style={styles.progressRow}>
              <View style={[styles.dot, { backgroundColor: progressColors.reviewing }]} />
              <ThemedText style={styles.progressLabel}>
                {t('stats.reviewing')}
              </ThemedText>
              <ThemedText style={styles.progressValue}>
                {stats.reviewingItems}
              </ThemedText>
            </View>
            <View style={styles.progressRow}>
              <View style={[styles.dot, { backgroundColor: progressColors.mastered }]} />
              <ThemedText style={styles.progressLabel}>
                {t('stats.mastered')}
              </ThemedText>
              <ThemedText style={styles.progressValue}>
                {stats.masteredItems}
              </ThemedText>
            </View>
            <View style={[styles.progressRow, styles.totalRow, { borderTopColor: cardBorder }]}>
              <ThemedText style={styles.progressLabel}>
                {t('stats.totalActive')}
              </ThemedText>
              <ThemedText style={styles.progressValue}>
                {stats.activeItems}
              </ThemedText>
            </View>
          </Card>
        </Animated.View>

        {/* Weekly Activity Section */}
        <Animated.View entering={shouldAnimate ? FadeInUp.duration(400).delay(200) : undefined}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t('stats.reviewed')}
          </ThemedText>
          <Card style={styles.chartCard}>
            <View style={styles.barsRow}>
              {stats.last7Days.map((day) => {
                const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'short' });
                const isToday = dayLabel === todayStr;
                const barHeight = maxCount > 0 ? (day.count / maxCount) * 60 : 0;

                return (
                  <View key={day.date} style={styles.barCol}>
                    <View style={[styles.barBg, { backgroundColor: cardBorder }]}>
                      <LinearGradient
                        colors={gradient.colors}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        style={[styles.barFill, { height: barHeight }]}
                      />
                    </View>
                    <ThemedText style={styles.countText}>
                      {day.count > 0 ? day.count : '-'}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.dayText,
                        { color: isToday ? primaryColor : textMuted },
                        isToday && styles.dayTextToday,
                      ]}
                    >
                      {dayLabel}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: borderRadius.md,
  },
  errorText: {
    textAlign: 'center',
    fontFamily: fontFamilies.bodyMedium,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 6,
    fontFamily: fontFamilies.bodyMedium,
    textAlign: 'center',
  },
  progressCard: {
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  progressLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamilies.bodyMedium,
  },
  progressValue: {
    fontSize: 16,
    fontFamily: fontFamilies.bodySemiBold,
  },
  chartCard: {
    marginBottom: 16,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barBg: {
    width: 28,
    height: 60,
    borderRadius: borderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: borderRadius.sm,
  },
  countText: {
    fontSize: 13,
    fontFamily: fontFamilies.bodySemiBold,
    marginTop: 8,
  },
  dayText: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: fontFamilies.bodyMedium,
  },
  dayTextToday: {
    fontFamily: fontFamilies.bodyBold,
  },
});
