-- =============================================================
-- DONATE SETTINGS COLUMNS (bank QR code + donate text)
-- Run this in Supabase SQL Editor (once)
-- =============================================================

-- 1. Add donate columns to the settings table
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS "donateQrUrl" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS donate_text_km text DEFAULT '',
  ADD COLUMN IF NOT EXISTS donate_text_en text DEFAULT '';
