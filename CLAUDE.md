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
   - `app/` (Expo Router screens and layouts)
   - `app/(tabs)/` (tab screens: index, library, stats, settings)
   - `src/lib/` (supabase client, utils, business logic)
   - `src/context/` (React contexts: Auth, Theme)
   - `src/types/` (shared TypeScript types)
   - `components/` (shared UI components)
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
- profiles (id = auth uid, daily_time, timezone, notifications_enabled, last_notified_at, ...)
- decks (user_id, name, archived) — cards are organized into decks
- items (user_id, deck_id, title=Question, content=Answer, source_url, tags, archived, ...)
- schedule (item_id, user_id, due_at, interval_days, ...)
- reviews (user_id, item_id, rating, reviewed_at, interval_days, ...)
- devices (user_id, expo_push_token, platform, last_seen_at, disabled_at)
- notification_log (user_id, type, due_count, tokens_sent, tokens_failed)

All tables must enforce user isolation with Supabase RLS.
Deck ownership is enforced via both RLS policy and trigger (defense-in-depth).

## Progress (as of 2026-01-17)

### Completed
- [x] Navigation scaffold (4 tabs: Today, Library, Stats, Settings)
- [x] Supabase client setup with AsyncStorage session persistence
- [x] Database schema (profiles, items, schedule, reviews, devices) with RLS
- [x] Security patch: unique schedule per item, WITH CHECK policies, item ownership triggers
- [x] Google Auth via Supabase (expo-auth-session)
- [x] Items CRUD (create, list, archive/unarchive) in Library tab
- [x] Auto-create schedule row when item created (due_at=now, interval=1)
- [x] Today review loop: show due items, 4-grade rating (Forgot/Hard/Good/Easy)
- [x] Scheduling logic: pure function in src/lib/scheduling.ts
- [x] Review persists to reviews table, updates schedule (interval, ease_factor, due_at)
- [x] Empty state with motivational message + next due item
- [x] Stats screen: overview cards (Total, Due now, Streak), items progress, weekly activity
- [x] Push notifications: device token registration, Edge Function, pg_cron setup
- [x] Settings screen: theme (System/Light/Dark), notifications, daily_time, timezone
- [x] Flashcard UI: Question/Answer terminology, reveal behavior on Review screen
- [x] Decks: cards organized into decks, Library shows decks, deck detail shows cards
- [x] Deck archiving: archive/unarchive decks, syncs all cards, UI reflects archived state

### Tags
- v0.1.0: Navigation scaffold complete
- v0.2.0: Sprint 01 complete (Auth + Items CRUD)
- Current: 58aba0b (Decks feature complete)

### Next Steps
1. **Development build** — Required for testing push notifications on physical device
2. **Add EXPO_PUBLIC_PROJECT_ID** to `.env` — Get from expo.dev dashboard
3. **Deck rename** — Deferred from initial deck implementation
4. **Move cards between decks** — Optional enhancement

### Database Migration Required
Run the following patches in order in Supabase SQL Editor:
- `supabase/patch-004-decks.sql` — Decks table + deck_id on items
- `supabase/patch-005-review-rating-1-4.sql` — Rating constraint (1-4)
- `supabase/patch-006-archive-decks.sql` — Deck archived flag + index

### Key Files
```
src/lib/supabase.ts      # Supabase client
src/lib/auth.ts          # Google sign-in/out
src/lib/decks.ts         # Decks CRUD
src/lib/items.ts         # Items CRUD (requires deck_id)
src/lib/today.ts         # Due items, submit review
src/lib/scheduling.ts    # Pure scheduling logic (4 grades)
src/lib/stats.ts         # Stats data fetching (streak, weekly activity)
src/lib/notifications.ts # Push notification token registration
src/lib/settings.ts      # Profile settings CRUD
src/types/database.ts    # TypeScript types for DB
src/context/AuthContext.tsx  # Auth state management (+ notification registration)
src/context/ThemeContext.tsx # Theme preference (System/Light/Dark)
app/(tabs)/index.tsx     # Today screen (all due cards across decks)
app/(tabs)/library.tsx   # Library screen (shows decks)
app/(tabs)/stats.tsx     # Stats screen
app/(tabs)/settings.tsx  # Settings screen
app/create-deck.tsx      # Create deck modal
app/deck/[id].tsx        # Deck detail screen (cards in deck)
app/add-item.tsx         # Add card form (requires deckId param)
app/review.tsx           # Review screen with reveal + 4 grades
supabase/schema.sql                   # Initial DB schema
supabase/patch-001-security.sql       # Security fixes
supabase/patch-002-notifications.sql  # Notification columns & helper functions
supabase/patch-003-pgcron.sql         # pg_cron job setup (run manually)
supabase/patch-004-decks.sql          # Decks table + deck_id on items
supabase/patch-005-review-rating-1-4.sql  # Migrate rating 5→4, add constraint
supabase/patch-006-archive-decks.sql      # Deck archived flag + index
supabase/functions/send-daily-reminder/index.ts  # Edge Function
```

### Dev Notes
- Expo Go auth redirect: `exp://x1tswb0-budkorpenning-8081.exp.direct` (add to Supabase Redirect URLs)
- Custom scheme `microlearningdrip://` only works in dev/prod builds, not Expo Go
- Run with: `npx expo start -c --tunnel`
- Push notifications require physical device + development build (not Expo Go)

### Push Notifications Setup (COMPLETED 2026-01-16)
All steps below have been completed for project `wjlxpksvagrnwajgpgpn`:

1. ✅ Run `patch-002-notifications.sql` in Supabase SQL Editor
2. ✅ Deploy Edge Function: `npx supabase functions deploy send-daily-reminder --project-ref wjlxpksvagrnwajgpgpn`
3. ✅ Enable extensions: pg_cron, pg_net, pgsodium (for vault)
4. ✅ Store secrets in Vault:
   ```sql
   select vault.create_secret('https://wjlxpksvagrnwajgpgpn.supabase.co', 'project_url');
   select vault.create_secret('eyJ...your-anon-key', 'anon_key');
   ```
5. ✅ Create invoke function and schedule cron job (runs every minute)
6. ⏳ Add `EXPO_PUBLIC_PROJECT_ID` to `.env` (needed for device token registration)

**Cron job status: DISABLED** (paused during development)

### Re-enabling Push Notifications Cron
The cron job is intentionally disabled until ready for end-to-end testing.

**To re-enable:**
```sql
select cron.schedule(
  'send-daily-reminder',
  '* * * * *',
  $$select public.invoke_send_daily_reminder();$$
);
```

**To disable again:**
```sql
select cron.unschedule('send-daily-reminder');
```

**Before re-enabling, ensure:**
- [ ] `EXPO_PUBLIC_PROJECT_ID` added to `.env`
- [ ] Development build created (not Expo Go)
- [x] Settings screen complete (to configure daily_time)
- [ ] At least one test item with due schedule

**Guards already in place:**
- Sends only within ±5 min of user's `daily_time`
- `last_notified_at` prevents duplicates (once per day max)
- Invalid tokens get disabled via `disabled_at`

**Logs:** https://supabase.com/dashboard/project/wjlxpksvagrnwajgpgpn/functions/send-daily-reminder/logs

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
