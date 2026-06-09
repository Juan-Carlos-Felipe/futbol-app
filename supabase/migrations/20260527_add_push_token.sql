-- FASE 1-2: Add missing push_token to users table

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS push_token text;
