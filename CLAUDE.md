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
- profiles (id = auth uid, daily_time, timezone, drip_size, ...)
- items (user_id, title, content, source_url, tags, archived, ...)
- schedule (item_id, user_id, due_at, interval_days, ...)
- reviews (user_id, item_id, rating, reviewed_at, interval_days, ...)
- devices (user_id, expo_push_token, platform, last_seen_at)
- notification_log (optional)

All tables must enforce user isolation with Supabase RLS.

## Current sprint
Sprint 01: Foundations
- Navigation scaffold
- Supabase client setup
- Auth (Google via Supabase)
- Items CRUD
- RLS sanity checks

## Output format for every response
Always include:
1) Plan
2) Files changed
3) Code (snippets or full files as needed)
4) How to test
5) Notes / risks (brief)
