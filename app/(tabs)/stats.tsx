import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslations } from '@/hooks/use-translations';
import { getLocale } from '@/src/lib/i18n';
import { fontFamilies, shadows } from '@/constants/theme';
import { getStats, type StatsData } from '@/src/lib/stats';

export default function StatsScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  const bgColor = useThemeColor({}, 'background');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const accentColor = useThemeColor({}, 'primary');
  const barBgColor = useThemeColor({}, 'borderSecondary');
  const learningColor = useThemeColor({}, 'warning');
  const reviewingColor = useThemeColor({}, 'primary');
  const masteredColor = useThemeColor({}, 'secondary');
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
      <View style={[styles.centered, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: bgColor }]}>
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          {error}
        </ThemedText>
      </View>
    );
  }

  if (!stats) return null;

  const maxCount = Math.max(...stats.last7Days.map(d => d.count), 1);
  const todayStr = new Date().toLocaleDateString(locale, { weekday: 'short' });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Overview */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t('stats.overview')}
      </ThemedText>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.statValue, { color: textColor }]}>
            {stats.totalReviews}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textMuted }]}>
            {t('stats.total')}
          </ThemedText>
        </View>
        <View style={[styles.statCard, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.statValue, { color: textColor }]}>
            {stats.dueNow}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textMuted }]}>
            {t('stats.dueNow')}
          </ThemedText>
        </View>
        <View style={[styles.statCard, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.statValue, { color: textColor }]}>
            {stats.currentStreak > 0 ? `${stats.currentStreak}d` : '-'}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textMuted }]}>
            {t('stats.streak')}
          </ThemedText>
        </View>
      </View>

      {/* Items Progress */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t('stats.itemsProgress')}
      </ThemedText>
      <View style={[styles.card, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
        <View style={styles.progressRow}>
          <View style={[styles.dot, { backgroundColor: learningColor }]} />
          <ThemedText style={[styles.progressLabel, { color: textColor }]}>
            {t('stats.learning')}
          </ThemedText>
          <ThemedText style={[styles.progressValue, { color: textColor }]}>
            {stats.learningItems}
          </ThemedText>
        </View>
        <View style={styles.progressRow}>
          <View style={[styles.dot, { backgroundColor: reviewingColor }]} />
          <ThemedText style={[styles.progressLabel, { color: textColor }]}>
            {t('stats.reviewing')}
          </ThemedText>
          <ThemedText style={[styles.progressValue, { color: textColor }]}>
            {stats.reviewingItems}
          </ThemedText>
        </View>
        <View style={styles.progressRow}>
          <View style={[styles.dot, { backgroundColor: masteredColor }]} />
          <ThemedText style={[styles.progressLabel, { color: textColor }]}>
            {t('stats.mastered')}
          </ThemedText>
          <ThemedText style={[styles.progressValue, { color: textColor }]}>
            {stats.masteredItems}
          </ThemedText>
        </View>
        <View style={[styles.progressRow, styles.totalRow, { borderTopColor: cardBorder }]}>
          <ThemedText style={[styles.progressLabel, { color: textColor }]}>
            {t('stats.totalActive')}
          </ThemedText>
          <ThemedText style={[styles.progressValue, { color: textColor }]}>
            {stats.activeItems}
          </ThemedText>
        </View>
      </View>

      {/* Reviewed */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t('stats.reviewed')}
      </ThemedText>
      <View style={[styles.card, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
        <View style={styles.barsRow}>
          {stats.last7Days.map((day) => {
            const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'short' });
            const isToday = dayLabel === todayStr;
            const barHeight = maxCount > 0 ? (day.count / maxCount) * 50 : 0;

            return (
              <View key={day.date} style={styles.barCol}>
                <View style={[styles.barBg, { backgroundColor: barBgColor }]}>
                  <View
                    style={[
                      styles.barFill,
                      { height: barHeight, backgroundColor: accentColor },
                    ]}
                  />
                </View>
                <ThemedText style={[styles.countText, { color: textColor }]}>
                  {day.count > 0 ? day.count : '-'}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.dayText,
                    { color: isToday ? accentColor : textMuted },
                    isToday && styles.dayTextToday,
                  ]}
                >
                  {dayLabel}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    textAlign: 'center',
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
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontSize: 28,
    fontFamily: fontFamilies.bodyBold,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: fontFamilies.bodyMedium,
  },
  card: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    ...shadows.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barBg: {
    width: 24,
    height: 50,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
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
