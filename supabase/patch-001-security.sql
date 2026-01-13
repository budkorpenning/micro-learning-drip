-- Patch 001: Security & Data Integrity Fixes
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1) Enforce 1 schedule row per item
-- ============================================
alter table public.schedule
  add constraint schedule_item_unique unique (item_id);

-- ============================================
-- 2) Harden update policies with WITH CHECK
-- ============================================
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can update own items" on public.items;
create policy "Users can update own items"
  on public.items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own schedule" on public.schedule;
create policy "Users can update own schedule"
  on public.schedule for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own devices" on public.devices;
create policy "Users can update own devices"
  on public.devices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- 3) Prevent cross-user item references
-- ============================================
create or replace function public.enforce_item_ownership()
returns trigger
language plpgsql
as $$
declare
  owner uuid;
begin
  select user_id into owner from public.items where id = new.item_id;

  if owner is null then
    raise exception 'Invalid item_id';
  end if;

  if new.user_id <> owner then
    raise exception 'user_id must match item owner';
  end if;

  return new;
end;
$$;

create trigger trg_schedule_enforce_item_ownership
  before insert or update on public.schedule
  for each row execute function public.enforce_item_ownership();

create trigger trg_reviews_enforce_item_ownership
  before insert on public.reviews
  for each row execute function public.enforce_item_ownership();
