-- Patch 007: Sync item archived state with deck
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1) Backfill existing items to match deck state
-- ============================================
UPDATE public.items
SET archived = decks.archived
FROM public.decks
WHERE items.deck_id = decks.id;

-- ============================================
-- 2) Trigger to keep items in sync
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_items_archived_with_deck()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.items
  SET archived = NEW.archived
  WHERE deck_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decks_sync_items_archived ON public.decks;

CREATE TRIGGER trg_decks_sync_items_archived
  AFTER UPDATE OF archived ON public.decks
  FOR EACH ROW EXECUTE FUNCTION public.sync_items_archived_with_deck();
