-- Patch 006: Add deck archiving
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1) Add archived flag to decks
-- ============================================
ALTER TABLE public.decks
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- 2) Index for archived filtering
-- ============================================
CREATE INDEX IF NOT EXISTS decks_user_archived_idx
  ON public.decks(user_id, archived);
