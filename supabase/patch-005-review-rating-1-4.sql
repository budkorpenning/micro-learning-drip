-- Patch 005: Migrate review rating from 1-5 to 1-4
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1) Normalize existing ratings (if any)
-- ============================================
UPDATE public.reviews
SET rating = 4
WHERE rating = 5;

-- ============================================
-- 2) Enforce 1..4 constraint
-- ============================================
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_rating_check;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 4);
