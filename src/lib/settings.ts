import { Database } from '@/src/types/database';
import { supabase } from './supabase';

export type ProfileSettings = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'daily_time' | 'timezone' | 'notifications_enabled'
>;

export type ProfileUpdate = Partial<ProfileSettings>;

/**
 * Get the current user's profile settings
 */
export async function getProfile(): Promise<ProfileSettings> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('daily_time, timezone, notifications_enabled')
    .eq('id', user.id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data as ProfileSettings;
}

/**
 * Update the current user's profile settings
 */
export async function updateProfile(updates: ProfileUpdate): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates as never)
    .eq('id', user.id);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

/**
 * Format time for display (HH:MM:SS -> HH:MM)
 */
export function formatTimeForDisplay(dbTime: string): string {
  return dbTime.slice(0, 5);
}

/**
 * Format time for database (HH:MM -> HH:MM:00)
 */
export function formatTimeForDb(displayTime: string): string {
  return `${displayTime}:00`;
}

/**
 * Parse HH:MM string to Date object (for picker)
 */
export function parseTimeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.slice(0, 5).split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Format Date to HH:MM string (from picker)
 */
export function formatDateToTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
