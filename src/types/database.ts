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
  created_at: string;
  updated_at: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
