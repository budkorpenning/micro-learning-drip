import { supabase } from './supabase';

export interface StatsData {
  totalReviews: number;
  reviewsToday: number;
  currentStreak: number;
  activeItems: number;
  masteredItems: number; // interval >= 21 days
  learningItems: number; // interval < 7 days
  reviewingItems: number; // interval 7-20 days
  last7Days: DayActivity[];
}

export interface DayActivity {
  date: string; // YYYY-MM-DD
  count: number;
}

/**
 * Get all stats for the current user
 */
export async function getStats(): Promise<StatsData> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Run queries in parallel for efficiency
  const [
    totalReviewsResult,
    reviewsTodayResult,
    streakResult,
    itemsResult,
    scheduleResult,
    last7DaysResult,
  ] = await Promise.all([
    getTotalReviews(user.id),
    getReviewsToday(user.id),
    calculateStreak(user.id),
    getActiveItemsCount(user.id),
    getScheduleBreakdown(user.id),
    getLast7DaysActivity(user.id),
  ]);

  return {
    totalReviews: totalReviewsResult,
    reviewsToday: reviewsTodayResult,
    currentStreak: streakResult,
    activeItems: itemsResult,
    masteredItems: scheduleResult.mastered,
    learningItems: scheduleResult.learning,
    reviewingItems: scheduleResult.reviewing,
    last7Days: last7DaysResult,
  };
}

async function getTotalReviews(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to get total reviews: ${error.message}`);
  return count ?? 0;
}

async function getReviewsToday(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('reviewed_at', today.toISOString());

  if (error) throw new Error(`Failed to get today's reviews: ${error.message}`);
  return count ?? 0;
}

async function calculateStreak(userId: string): Promise<number> {
  // Get distinct review dates, ordered descending
  const { data, error } = await supabase
    .from('reviews')
    .select('reviewed_at')
    .eq('user_id', userId)
    .order('reviewed_at', { ascending: false });

  if (error) throw new Error(`Failed to calculate streak: ${error.message}`);
  if (!data || data.length === 0) return 0;

  // Extract unique dates (YYYY-MM-DD in local timezone)
  const uniqueDates = new Set<string>();
  for (const review of data as { reviewed_at: string }[]) {
    const date = new Date(review.reviewed_at);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    uniqueDates.add(dateStr);
  }

  const sortedDates = Array.from(uniqueDates).sort().reverse();

  // Check if streak is active (reviewed today or yesterday)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
    return 0; // Streak broken
  }

  // Count consecutive days
  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i - 1]);
    const prev = new Date(sortedDates[i]);

    // Check if dates are consecutive
    const diffMs = current.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

async function getActiveItemsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('archived', false);

  if (error) throw new Error(`Failed to get active items: ${error.message}`);
  return count ?? 0;
}

interface ScheduleBreakdown {
  learning: number;
  reviewing: number;
  mastered: number;
}

async function getScheduleBreakdown(userId: string): Promise<ScheduleBreakdown> {
  const { data, error } = await supabase
    .from('schedule')
    .select('interval_days, items!inner(archived)')
    .eq('user_id', userId)
    .eq('items.archived', false);

  if (error) throw new Error(`Failed to get schedule breakdown: ${error.message}`);

  const result = { learning: 0, reviewing: 0, mastered: 0 };

  for (const row of data ?? []) {
    const interval = (row as { interval_days: number }).interval_days;
    if (interval >= 21) {
      result.mastered++;
    } else if (interval >= 7) {
      result.reviewing++;
    } else {
      result.learning++;
    }
  }

  return result;
}

async function getLast7DaysActivity(userId: string): Promise<DayActivity[]> {
  const result: DayActivity[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find Monday of current week (week starts on Monday)
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(monday.getDate() - daysFromMonday);

  // Create array for Mon-Sun
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    result.push({ date: dateStr, count: 0 });
  }

  // Get reviews from this week (Monday onwards)
  const { data, error } = await supabase
    .from('reviews')
    .select('reviewed_at')
    .eq('user_id', userId)
    .gte('reviewed_at', monday.toISOString());

  if (error) throw new Error(`Failed to get weekly activity: ${error.message}`);

  // Count reviews per day
  for (const review of (data ?? []) as { reviewed_at: string }[]) {
    const date = new Date(review.reviewed_at);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const dayEntry = result.find(d => d.date === dateStr);
    if (dayEntry) {
      dayEntry.count++;
    }
  }

  return result;
}
