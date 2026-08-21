-- =============================================================
-- FOOTER SETTINGS COLUMNS + ACCESS POLICIES
-- Run this in Supabase SQL Editor (once)
-- =============================================================

-- 1. Add footer/contact columns + home banner image
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS footer_about_km text DEFAULT '',
  ADD COLUMN IF NOT EXISTS footer_about_en text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_website text DEFAULT '',
  ADD COLUMN IF NOT EXISTS hero_image_url text DEFAULT '';

-- 1b. Rename banner column to camelCase to match the app (logoUrl style)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'hero_image_url'
  ) THEN
    ALTER TABLE public.settings RENAME COLUMN hero_image_url TO "heroImageUrl";
  END IF;
END $$;

-- 2. Seed current footer text (only if empty)
UPDATE public.settings
SET footer_about_km = 'បណ្ណាល័យឌីជីថលខ្មែរជាវេទិកាសម្រាប់រក្សាទុក និងចែករំលែកសៀវភៅខ្មែរ។',
    footer_about_en = 'Khmer Digital Library is a platform for preserving and sharing Khmer books.',
    contact_email = 'info@khmerlibrary.com',
    contact_website = 'khmerlibrary.com'
WHERE id = 'site'
  AND COALESCE(footer_about_km, '') = ''
  AND COALESCE(footer_about_en, '') = '';

-- 3. Make sure RLS is on and everyone can READ settings,
--    only admins can CHANGE settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'settings' AND policyname = 'settings_select_all'
  ) THEN
    CREATE POLICY settings_select_all ON public.settings
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'settings' AND policyname = 'settings_insert_admin'
  ) THEN
    CREATE POLICY settings_insert_admin ON public.settings
      FOR INSERT WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'settings' AND policyname = 'settings_update_admin'
  ) THEN
    CREATE POLICY settings_update_admin ON public.settings
      FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;
