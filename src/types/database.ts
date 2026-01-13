// Auto-generated types from Supabase can be placed here.
// Run: npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
//
// For now, we define a minimal placeholder that will be expanded
// as we create tables in the database.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Tables will be added here as we create them in Supabase
      // Example structure:
      // profiles: {
      //   Row: { id: string; daily_time: string; timezone: string; ... }
      //   Insert: { ... }
      //   Update: { ... }
      // }
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
