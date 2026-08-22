-- Favorite counters: aggregate how many users favorited each book.
-- Run once in Supabase SQL Editor.
-- Favorites are stored as a text[] column on each user row; this SECURITY
-- DEFINER function exposes only aggregated counts (no user data).

CREATE OR REPLACE FUNCTION public.favorite_counts()
RETURNS TABLE (book_id text, fav_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.fav AS book_id, COUNT(*)::bigint AS fav_count
  FROM public.users u
  CROSS JOIN LATERAL jsonb_array_elements_text(u.favorites) AS f(fav)
  GROUP BY f.fav;
$$;

GRANT EXECUTE ON FUNCTION public.favorite_counts() TO anon, authenticated;
