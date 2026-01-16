# CLAUDE.md — Micro-Learning Drip

You are working inside this repo as a coding assistant.

## Project goal
Build a production-grade single-user micro-learning app ("daily drip") that demonstrates:
- Expo React Native app
- Real backend (Supabase/Postgres)
- Google auth
- Push notifications (Expo)
- Background jobs (scheduled pushes)
- Monitoring + basic privacy lifecycle

## Stack (v1)
- Expo (managed), TypeScript
- React Navigation
- Supabase (Postgres, Auth, RLS)
- Expo Notifications (push tokens stored in DB)
- Sentry (client; server logs for functions)

## Non-goals (v1)
- Social/community features
- Payments
- Complex SM-2 tuning
- Web app

## Working rules (STRICT)
1. **Small changes only**: One task per PR-sized change. No refactors unless requested.
2. **Plan first**: Always output:
   - Plan (bullets)
   - Files to edit/create
   - Implementation
   - How to test locally
3. **Type safety**: TypeScript only. No `any` unless absolutely necessary (and justify it).
4. **No secrets**: Never hardcode credentials. Use env vars (.env) and document required keys.
5. **Keep structure clean**:
   - `src/screens/`
   - `src/navigation/`
   - `src/lib/` (supabase client, utils)
   - `src/components/` (shared UI)
   - `src/types/` (shared types)
6. **Consistency**:
   - Use functional components
   - Use named exports where sensible
   - Keep UI minimal (no design polish unless asked)
7. **Error handling**:
   - Handle loading/error states on screens with async calls
   - Avoid silent failures
8. **Testing**:
   - At minimum: "How to test locally" steps after each change
   - If adding business logic (scheduling), include unit-testable pure functions

## Data model (reference)
Tables:
- profiles (id = auth uid, daily_time, timezone, drip_size, notifications_enabled, last_notified_at, ...)
- items (user_id, title, content, source_url, tags, archived, ...)
- schedule (item_id, user_id, due_at, interval_days, ...)
- reviews (user_id, item_id, rating, reviewed_at, interval_days, ...)
- devices (user_id, expo_push_token, platform, last_seen_at, disabled_at)
- notification_log (user_id, type, due_count, tokens_sent, tokens_failed)

All tables must enforce user isolation with Supabase RLS.

## Progress (as of 2026-01-16)

### Completed
- [x] Navigation scaffold (4 tabs: Today, Library, Stats, Settings)
- [x] Supabase client setup with AsyncStorage session persistence
- [x] Database schema (profiles, items, schedule, reviews, devices) with RLS
- [x] Security patch: unique schedule per item, WITH CHECK policies, item ownership triggers
- [x] Google Auth via Supabase (expo-auth-session)
- [x] Items CRUD (create, list, archive/unarchive) in Library tab
- [x] Auto-create schedule row when item created (due_at=now, interval=1)
- [x] Today review loop: show due items, 5-grade rating (Again/Hard/Good/Easy/Perfect)
- [x] Scheduling logic: pure function in src/lib/scheduling.ts
- [x] Review persists to reviews table, updates schedule (interval, ease_factor, due_at)
- [x] Empty state with motivational message + next due item
- [x] Stats screen: overview cards, items progress, weekly activity bar chart
- [x] Push notifications: device token registration, Edge Function, pg_cron setup

### Tags
- v0.1.0: Navigation scaffold complete
- v0.2.0: Sprint 01 complete (Auth + Items CRUD)
- Current: Push notifications implementation

### Next Steps (Sprint 02)
1. ~~Stats screen~~ ✓
2. ~~Push notifications~~ ✓ (code complete, needs deployment)
3. **Settings** — Edit profile (drip_size, daily_time, timezone, notifications_enabled)
4. **Development build** — Required for testing push notifications on physical device

### Key Files
```
src/lib/supabase.ts      # Supabase client
src/lib/auth.ts          # Google sign-in/out
src/lib/items.ts         # Items CRUD
src/lib/today.ts         # Due items, submit review
src/lib/scheduling.ts    # Pure scheduling logic (5 grades)
src/lib/stats.ts         # Stats data fetching (streak, weekly activity)
src/lib/notifications.ts # Push notification token registration
src/types/database.ts    # TypeScript types for DB
src/context/AuthContext.tsx  # Auth state management (+ notification registration)
app/(tabs)/index.tsx     # Today screen
app/(tabs)/library.tsx   # Library screen
app/(tabs)/stats.tsx     # Stats screen
app/add-item.tsx         # Add item form
app/review.tsx           # Review screen with 5 grades
supabase/schema.sql                   # Initial DB schema
supabase/patch-001-security.sql       # Security fixes
supabase/patch-002-notifications.sql  # Notification columns & helper functions
supabase/patch-003-pgcron.sql         # pg_cron job setup (run manually)
supabase/functions/send-daily-reminder/index.ts  # Edge Function
```

### Dev Notes
- Expo Go auth redirect: `exp://x1tswb0-budkorpenning-8081.exp.direct` (add to Supabase Redirect URLs)
- Custom scheme `microlearningdrip://` only works in dev/prod builds, not Expo Go
- Run with: `npx expo start -c --tunnel`
- Push notifications require physical device + development build (not Expo Go)

### Push Notifications Setup
1. Run `patch-002-notifications.sql` in Supabase SQL Editor
2. Deploy Edge Function: `supabase functions deploy send-daily-reminder`
3. Set database config for pg_cron (in SQL Editor):
   ```sql
   ALTER DATABASE postgres SET "app.settings.supabase_url" = 'https://your-project.supabase.co';
   ALTER DATABASE postgres SET "app.settings.service_role_key" = 'your-service-role-key';
   ```
4. Run `patch-003-pgcron.sql` to enable cron job
5. Add `EXPO_PUBLIC_PROJECT_ID` to `.env` (from Expo dashboard)

### Required Environment Variables
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id  # For push tokens
```

## Output format for every response
Always include:
1) Plan
2) Files changed
3) Code (snippets or full files as needed)
4) How to test
5) Notes / risks (brief)
