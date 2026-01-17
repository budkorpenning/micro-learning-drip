-- Patch 004: Add Decks
-- Run this in the Supabase SQL Editor
-- WARNING: This clears existing items/schedule/reviews data (only 2 test items)

-- ============================================
-- 1) Clear existing test data
-- ============================================
-- DELETE FROM items cascades to schedule and reviews via FK
DELETE FROM public.items;

-- ============================================
-- 2) Create decks table
-- ============================================
CREATE TABLE public.decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT decks_user_name_unique UNIQUE (user_id, name)
);

ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

-- RLS policies for decks
CREATE POLICY "Users can view own decks"
  ON public.decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decks"
  ON public.decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decks"
  ON public.decks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own decks"
  ON public.decks FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX decks_user_id_idx ON public.decks(user_id);

-- Updated_at trigger (consistent with other tables)
CREATE TRIGGER decks_updated_at
  BEFORE UPDATE ON public.decks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 3) Add deck_id to items (NOT NULL, FK, CASCADE)
-- ============================================
ALTER TABLE public.items
  ADD COLUMN deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE;

-- Index for efficient deck queries
CREATE INDEX items_deck_id_idx ON public.items(deck_id);

-- ============================================
-- 4) Security: Enforce deck ownership on items
-- ============================================

-- 4a) Trigger for defense-in-depth
CREATE OR REPLACE FUNCTION public.enforce_deck_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  deck_owner UUID;
BEGIN
  SELECT user_id INTO deck_owner FROM public.decks WHERE id = NEW.deck_id;

  IF deck_owner IS NULL THEN
    RAISE EXCEPTION 'Invalid deck_id';
  END IF;

  IF NEW.user_id <> deck_owner THEN
    RAISE EXCEPTION 'user_id must match deck owner';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_items_enforce_deck_ownership
  BEFORE INSERT OR UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_deck_ownership();

-- 4b) Update items insert policy to also check deck ownership
DROP POLICY "Users can insert own items" ON public.items;

CREATE POLICY "Users can insert own items"
  ON public.items FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.decks
      WHERE id = deck_id AND user_id = auth.uid()
    )
  );

-- 4c) Update items update policy to prevent changing deck to another user's deck
DROP POLICY "Users can update own items" ON public.items;

CREATE POLICY "Users can update own items"
  ON public.items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.decks
      WHERE id = deck_id AND user_id = auth.uid()
    )
  );
