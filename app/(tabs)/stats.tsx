import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { getStats, type StatsData } from '@/src/lib/stats';

export default function StatsScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#ddd', dark: '#333' }, 'text');
  const accentColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'text');
  const mutedColor = useThemeColor({ light: '#8E8E93', dark: '#636366' }, 'text');
  const barBgColor = useThemeColor({ light: '#E5E5EA', dark: '#3A3A3C' }, 'text');

  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

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
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!stats) return null;

  const maxCount = Math.max(...stats.last7Days.map(d => d.count), 1);
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Overview */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>Overview</Text>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor }]}>
          <Text style={[styles.statValue, { color: textColor }]}>{stats.totalReviews}</Text>
          <Text style={[styles.statLabel, { color: mutedColor }]}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderColor }]}>
          <Text style={[styles.statValue, { color: textColor }]}>{stats.dueNow}</Text>
          <Text style={[styles.statLabel, { color: mutedColor }]}>Due now</Text>
        </View>
        <View style={[styles.statCard, { borderColor }]}>
          <Text style={[styles.statValue, { color: textColor }]}>
            {stats.currentStreak > 0 ? `${stats.currentStreak}d` : '-'}
          </Text>
          <Text style={[styles.statLabel, { color: mutedColor }]}>Streak</Text>
        </View>
      </View>

      {/* Items Progress */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>Items Progress</Text>
      <View style={[styles.card, { borderColor }]}>
        <View style={styles.progressRow}>
          <View style={[styles.dot, { backgroundColor: '#FF9500' }]} />
          <Text style={[styles.progressLabel, { color: textColor }]}>Learning</Text>
          <Text style={[styles.progressValue, { color: textColor }]}>{stats.learningItems}</Text>
        </View>
        <View style={styles.progressRow}>
          <View style={[styles.dot, { backgroundColor: '#007AFF' }]} />
          <Text style={[styles.progressLabel, { color: textColor }]}>Reviewing</Text>
          <Text style={[styles.progressValue, { color: textColor }]}>{stats.reviewingItems}</Text>
        </View>
        <View style={styles.progressRow}>
          <View style={[styles.dot, { backgroundColor: '#34C759' }]} />
          <Text style={[styles.progressLabel, { color: textColor }]}>Mastered</Text>
          <Text style={[styles.progressValue, { color: textColor }]}>{stats.masteredItems}</Text>
        </View>
        <View style={[styles.progressRow, styles.totalRow]}>
          <Text style={[styles.progressLabel, { color: textColor }]}>Total Active</Text>
          <Text style={[styles.progressValue, { color: textColor }]}>{stats.activeItems}</Text>
        </View>
      </View>

      {/* Reviewed */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>Reviewed</Text>
      <View style={[styles.card, { borderColor }]}>
        <View style={styles.barsRow}>
          {stats.last7Days.map((day) => {
            const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
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
                <Text style={[styles.countText, { color: textColor }]}>
                  {day.count > 0 ? day.count : '-'}
                </Text>
                <Text
                  style={[
                    styles.dayText,
                    { color: isToday ? accentColor : mutedColor },
                    isToday && styles.dayTextToday,
                  ]}
                >
                  {dayLabel}
                </Text>
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
    color: '#ff4444',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3333',
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
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '600',
    marginTop: 8,
  },
  dayText: {
    fontSize: 11,
    marginTop: 4,
  },
  dayTextToday: {
    fontWeight: '700',
  },
});
