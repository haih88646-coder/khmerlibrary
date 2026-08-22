-- =============================================================
-- AI ASSISTANT SETTINGS COLUMNS
-- Run this in Supabase SQL Editor (once)
-- =============================================================

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS ai_provider text DEFAULT '',
  ADD COLUMN IF NOT EXISTS ai_model text DEFAULT '';
