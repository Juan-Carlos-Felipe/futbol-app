ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_3d_url text,
ADD COLUMN IF NOT EXISTS avatar_pose text DEFAULT 'jogging',
ADD COLUMN IF NOT EXISTS avatar_team_color text DEFAULT '#16a34a';
