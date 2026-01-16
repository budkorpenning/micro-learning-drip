-- Patch 003: pg_cron Setup for Daily Notifications
-- Uses Supabase Vault for secure secret storage (official pattern)
--
-- Run this in the Supabase SQL Editor AFTER:
-- 1. Running patch-002-notifications.sql
-- 2. Deploying the send-daily-reminder Edge Function

-- ============================================
-- 1) Enable required extensions
-- ============================================
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists vault with schema vault;

-- ============================================
-- 2) Store secrets in Vault
-- Replace YOUR_ANON_KEY with your actual anon/publishable key
-- Found in: Project Settings → API → API Keys
-- ============================================

-- NOTE: Run these one at a time, replacing the placeholder values
-- If secrets already exist, delete them first with:
--   delete from vault.secrets where name = 'project_url';
--   delete from vault.secrets where name = 'anon_key';

select vault.create_secret(
  'https://wjlxpksvagrnwajgpgpn.supabase.co',
  'project_url'
);

select vault.create_secret(
  'YOUR_ANON_KEY_HERE',  -- Replace with your actual anon key!
  'anon_key'
);

-- ============================================
-- 3) Create function to invoke Edge Function
-- ============================================
create or replace function public.invoke_send_daily_reminder()
returns void
language plpgsql
security definer
as $$
declare
  v_project_url text;
  v_anon_key text;
begin
  -- Fetch secrets from vault
  select decrypted_secret into v_project_url
  from vault.decrypted_secrets
  where name = 'project_url';

  select decrypted_secret into v_anon_key
  from vault.decrypted_secrets
  where name = 'anon_key';

  -- Call the Edge Function
  perform net.http_post(
    url := v_project_url || '/functions/v1/send-daily-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon_key,
      'apikey', v_anon_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

-- ============================================
-- 4) Schedule the cron job (every minute)
-- ============================================

-- Remove existing job if present
select cron.unschedule('send-daily-reminder')
where exists (
  select 1 from cron.job where jobname = 'send-daily-reminder'
);

-- Schedule new job
select cron.schedule(
  'send-daily-reminder',
  '* * * * *',
  $$select public.invoke_send_daily_reminder();$$
);

-- ============================================
-- 5) Verify setup
-- ============================================

-- View scheduled jobs:
-- select jobid, jobname, schedule, command, active from cron.job;

-- View recent job runs:
-- select * from cron.job_run_details order by start_time desc limit 20;

-- Test the function manually:
-- select public.invoke_send_daily_reminder();

-- Check vault secrets exist (names only, not values):
-- select name from vault.decrypted_secrets where name in ('project_url', 'anon_key');
