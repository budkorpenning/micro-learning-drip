-- Micro-Learning Drip Database Schema
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- ============================================
-- PROFILES
-- User settings, linked to Supabase Auth
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  daily_time time not null default '09:00',
  timezone text not null default 'UTC',
  drip_size int not null default 5 check (drip_size between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================
-- DECKS
-- Card organization (each card belongs to one deck)
-- ============================================
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint decks_user_name_unique unique (user_id, name)
);

alter table public.decks enable row level security;

create policy "Users can view own decks"
  on public.decks for select
  using (auth.uid() = user_id);

create policy "Users can insert own decks"
  on public.decks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own decks"
  on public.decks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own decks"
  on public.decks for delete
  using (auth.uid() = user_id);

create index decks_user_id_idx on public.decks(user_id);
create index decks_user_archived_idx on public.decks(user_id, archived);

-- ============================================
-- ITEMS
-- Learning items (flashcards) belonging to a deck
-- ============================================
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  title text not null,
  content text not null,
  source_url text,
  tags text[] not null default '{}',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.items enable row level security;

create policy "Users can view own items"
  on public.items for select
  using (auth.uid() = user_id);

create policy "Users can insert own items"
  on public.items for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.decks
      where id = deck_id and user_id = auth.uid()
    )
  );

create policy "Users can update own items"
  on public.items for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.decks
      where id = deck_id and user_id = auth.uid()
    )
  );

create policy "Users can delete own items"
  on public.items for delete
  using (auth.uid() = user_id);

create index items_user_id_idx on public.items(user_id);
create index items_deck_id_idx on public.items(deck_id);
create index items_archived_idx on public.items(user_id, archived);

-- Defense-in-depth: Trigger to enforce deck ownership
create or replace function public.enforce_deck_ownership()
returns trigger
language plpgsql
as $$
declare
  deck_owner uuid;
begin
  select user_id into deck_owner from public.decks where id = new.deck_id;

  if deck_owner is null then
    raise exception 'Invalid deck_id';
  end if;

  if new.user_id <> deck_owner then
    raise exception 'user_id must match deck owner';
  end if;

  return new;
end;
$$;

create trigger trg_items_enforce_deck_ownership
  before insert or update on public.items
  for each row execute function public.enforce_deck_ownership();

-- ============================================
-- SCHEDULE
-- Spaced repetition schedule for items
-- ============================================
create table public.schedule (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  due_at timestamptz not null,
  interval_days int not null default 1 check (interval_days >= 1),
  ease_factor real not null default 2.5 check (ease_factor >= 1.3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.schedule enable row level security;

create policy "Users can view own schedule"
  on public.schedule for select
  using (auth.uid() = user_id);

create policy "Users can insert own schedule"
  on public.schedule for insert
  with check (auth.uid() = user_id);

create policy "Users can update own schedule"
  on public.schedule for update
  using (auth.uid() = user_id);

create policy "Users can delete own schedule"
  on public.schedule for delete
  using (auth.uid() = user_id);

create index schedule_user_due_idx on public.schedule(user_id, due_at);
create index schedule_item_id_idx on public.schedule(item_id);

-- ============================================
-- REVIEWS
-- History of item reviews
-- ============================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  rating int not null check (rating between 1 and 4),
  interval_days int not null,
  reviewed_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Users can view own reviews"
  on public.reviews for select
  using (auth.uid() = user_id);

create policy "Users can insert own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create index reviews_user_id_idx on public.reviews(user_id);
create index reviews_item_id_idx on public.reviews(item_id);
create index reviews_reviewed_at_idx on public.reviews(user_id, reviewed_at);

-- ============================================
-- DEVICES
-- Push notification tokens
-- ============================================
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.devices enable row level security;

create policy "Users can view own devices"
  on public.devices for select
  using (auth.uid() = user_id);

create policy "Users can insert own devices"
  on public.devices for insert
  with check (auth.uid() = user_id);

create policy "Users can update own devices"
  on public.devices for update
  using (auth.uid() = user_id);

create policy "Users can delete own devices"
  on public.devices for delete
  using (auth.uid() = user_id);

create unique index devices_user_token_idx on public.devices(user_id, expo_push_token);

-- ============================================
-- HELPER FUNCTION: Auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- HELPER FUNCTION: Auto-update updated_at
-- ============================================
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger decks_updated_at
  before update on public.decks
  for each row execute function public.update_updated_at();

create trigger items_updated_at
  before update on public.items
  for each row execute function public.update_updated_at();

create trigger schedule_updated_at
  before update on public.schedule
  for each row execute function public.update_updated_at();
