-- =============================================================
-- READERS COUNT (reads column + increment function)
-- Run this in Supabase SQL Editor (once)
-- =============================================================

-- 1. Add reads column to books
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS reads int DEFAULT 0;

-- 2. Counter function called by the app (one click = one reader)
CREATE OR REPLACE FUNCTION public.increment_reads(book_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE books SET reads = COALESCE(reads, 0) + 1 WHERE id = book_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_reads(uuid) TO anon, authenticated;
