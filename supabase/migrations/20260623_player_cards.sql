-- Migration: Player Cards System
-- Description: Adds columns to users table and creates storage bucket for player cards

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS card_photo_url text,
ADD COLUMN IF NOT EXISTS card_photo_processed_url text,
ADD COLUMN IF NOT EXISTS card_shirt_id text DEFAULT 'white-classic',
ADD COLUMN IF NOT EXISTS card_shirt_number int DEFAULT 10,
ADD COLUMN IF NOT EXISTS card_position text DEFAULT 'DEL',
ADD COLUMN IF NOT EXISTS card_country_flag text DEFAULT '🇦🇷',
ADD COLUMN IF NOT EXISTS card_style text DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS card_created_at timestamptz;

-- Bucket de Supabase Storage para fotos de tarjeta
-- Note: Storage buckets cannot be created via SQL in all Supabase environments,
-- but the table definition for the bucket is standard.
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-cards', 'player-cards', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'player-cards');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'player-cards' AND auth.role() = 'authenticated');
