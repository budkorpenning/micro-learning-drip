// Database types for Supabase tables
// Can be auto-generated with: npx supabase gen types typescript --project-id <id>

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Row types for direct use in the app
export interface Item {
  id: string;
  user_id: string;
  title: string;
  content: string;
  source_url: string | null;
  tags: string[];
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  item_id: string;
  user_id: string;
  due_at: string;
  interval_days: number;
  ease_factor: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  daily_time: string;
  timezone: string;
  drip_size: number;
  notifications_enabled: boolean;
  last_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  user_id: string;
  expo_push_token: string;
  platform: 'ios' | 'android' | 'web';
  disabled_at: string | null;
  last_seen_at: string;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  type: string;
  due_count: number;
  tokens_sent: number;
  tokens_failed: number;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  item_id: string;
  rating: number;
  interval_days: number;
  reviewed_at: string;
}

// Insert types (omit auto-generated fields)
export interface ItemInsert {
  title: string;
  content: string;
  source_url?: string | null;
  tags?: string[];
}

export interface ScheduleInsert {
  item_id: string;
  user_id: string;
  due_at?: string;
  interval_days?: number;
  ease_factor?: number;
}

export interface ReviewInsert {
  user_id: string;
  item_id: string;
  rating: number;
  interval_days: number;
  reviewed_at?: string;
}

export interface DeviceInsert {
  user_id: string;
  expo_push_token: string;
  platform: 'ios' | 'android' | 'web';
}

// Supabase Database type for typed client
export interface Database {
  public: {
    Tables: {
      items: {
        Row: Item;
        Insert: ItemInsert & { user_id: string };
        Update: Partial<ItemInsert> & { archived?: boolean };
      };
      schedule: {
        Row: Schedule;
        Insert: ScheduleInsert;
        Update: Partial<Omit<ScheduleInsert, 'item_id' | 'user_id'>>;
      };
      profiles: {
        Row: Profile;
        Insert: { id: string } & Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      reviews: {
        Row: Review;
        Insert: ReviewInsert;
        Update: Partial<Omit<ReviewInsert, 'user_id' | 'item_id'>>;
      };
      devices: {
        Row: Device;
        Insert: DeviceInsert;
        Update: Partial<Omit<DeviceInsert, 'user_id'>> & { disabled_at?: string | null };
      };
      notification_log: {
        Row: NotificationLog;
        Insert: Omit<NotificationLog, 'id' | 'created_at'>;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
