import { supabase } from './supabase';
import { calculateNextSchedule, calculateDueDate, type Grade } from './scheduling';
import type { Item, Schedule } from '@/src/types/database';

export interface DueItem {
  item: Item;
  schedule: Schedule;
}

/**
 * Get all due items for the current user
 */
export async function getDueItems(): Promise<DueItem[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Get due items: schedule.due_at <= now, items.archived = false
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('schedule')
    .select(`
      *,
      items!inner (*)
    `)
    .eq('user_id', user.id)
    .lte('due_at', now)
    .eq('items.archived', false)
    .order('due_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch due items: ${error.message}`);
  }

  // Transform the joined data
  return (data ?? []).map((row: Record<string, unknown>) => ({
    item: row.items as Item,
    schedule: {
      id: row.id,
      item_id: row.item_id,
      user_id: row.user_id,
      due_at: row.due_at,
      interval_days: row.interval_days,
      ease_factor: row.ease_factor,
      created_at: row.created_at,
      updated_at: row.updated_at,
    } as Schedule,
  }));
}

/**
 * Get the next due item (for empty state display)
 */
export async function getNextDueItem(): Promise<{ dueAt: Date; title: string } | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('schedule')
    .select(`
      due_at,
      items!inner (title, archived)
    `)
    .eq('user_id', user.id)
    .gt('due_at', now)
    .eq('items.archived', false)
    .order('due_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as { due_at: string; items: { title: string } };
  return {
    dueAt: new Date(row.due_at),
    title: row.items.title,
  };
}

/**
 * Submit a review for an item
 */
export async function submitReview(
  itemId: string,
  scheduleId: string,
  currentIntervalDays: number,
  currentEaseFactor: number,
  grade: Grade
): Promise<void> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Calculate new schedule
  const { intervalDays, easeFactor } = calculateNextSchedule({
    intervalDays: currentIntervalDays,
    easeFactor: currentEaseFactor,
    grade,
  });

  const dueAt = calculateDueDate(intervalDays);

  // Insert review record
  const { error: reviewError } = await supabase
    .from('reviews')
    .insert({
      user_id: user.id,
      item_id: itemId,
      rating: grade,
      interval_days: intervalDays,
      reviewed_at: new Date().toISOString(),
    } as never);

  if (reviewError) {
    throw new Error(`Failed to save review: ${reviewError.message}`);
  }

  // Update schedule
  const { error: scheduleError } = await supabase
    .from('schedule')
    .update({
      interval_days: intervalDays,
      ease_factor: easeFactor,
      due_at: dueAt.toISOString(),
    } as never)
    .eq('id', scheduleId);

  if (scheduleError) {
    throw new Error(`Failed to update schedule: ${scheduleError.message}`);
  }
}
