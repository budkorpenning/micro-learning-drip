-- Patch 002: Push Notifications Support
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1) Add notification settings to profiles
-- ============================================
alter table public.profiles
  add column notifications_enabled boolean not null default true,
  add column last_notified_at timestamptz;

-- ============================================
-- 2) Add disabled_at to devices (for invalid tokens)
-- ============================================
alter table public.devices
  add column disabled_at timestamptz;

-- ============================================
-- 3) Create notification_log table
-- Tracks sent notifications for debugging/auditing
-- ============================================
create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'daily_reminder',
  due_count int not null,
  tokens_sent int not null default 0,
  tokens_failed int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.notification_log enable row level security;

-- Users can view their own notification history
create policy "Users can view own notification_log"
  on public.notification_log for select
  using (auth.uid() = user_id);

-- Only service role (Edge Functions) can insert
-- No insert policy for regular users - Edge Function uses service role

create index notification_log_user_created_idx
  on public.notification_log(user_id, created_at desc);

-- ============================================
-- 4) Helper function: Get users due for notification
-- Called by pg_cron to find users who should be notified
-- ============================================
create or replace function public.get_users_due_for_notification()
returns table (
  user_id uuid,
  timezone text,
  due_count bigint,
  expo_push_tokens text[]
)
language sql
security definer
set search_path = ''
as $$
  select
    p.id as user_id,
    p.timezone,
    count(s.id) as due_count,
    array_agg(distinct d.expo_push_token) filter (where d.expo_push_token is not null) as expo_push_tokens
  from public.profiles p
  inner join public.schedule s on s.user_id = p.id
  inner join public.items i on i.id = s.item_id and i.archived = false
  left join public.devices d on d.user_id = p.id and d.disabled_at is null
  where
    -- Notifications are enabled
    p.notifications_enabled = true
    -- Item is due (due_at <= now)
    and s.due_at <= now()
    -- Not notified today (in user's timezone)
    and (
      p.last_notified_at is null
      or date_trunc('day', p.last_notified_at at time zone p.timezone)
         < date_trunc('day', now() at time zone p.timezone)
    )
    -- Current time matches daily_time (within 5 minute window)
    and (
      extract(hour from now() at time zone p.timezone) = extract(hour from p.daily_time)
      and extract(minute from now() at time zone p.timezone)
          between extract(minute from p.daily_time)
          and extract(minute from p.daily_time) + 4
    )
  group by p.id, p.timezone
  having count(s.id) > 0
$$;

-- ============================================
-- 5) Helper function: Mark user as notified
-- Called by Edge Function after sending
-- ============================================
create or replace function public.mark_user_notified(
  p_user_id uuid,
  p_due_count int,
  p_tokens_sent int,
  p_tokens_failed int
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Update last_notified_at
  update public.profiles
  set last_notified_at = now()
  where id = p_user_id;

  -- Log the notification
  insert into public.notification_log (user_id, due_count, tokens_sent, tokens_failed)
  values (p_user_id, p_due_count, p_tokens_sent, p_tokens_failed);
end;
$$;

-- ============================================
-- 6) Helper function: Disable invalid push token
-- Called by Edge Function when Expo returns error
-- ============================================
create or replace function public.disable_push_token(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.devices
  set disabled_at = now()
  where expo_push_token = p_token
    and disabled_at is null;
$$;
