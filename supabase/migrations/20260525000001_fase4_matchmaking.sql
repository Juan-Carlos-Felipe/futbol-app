-- FASE 4 MODULO 1: Matchmaking y perfiles publicos de equipos

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.match_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.users(id),
  title text NOT NULL,
  description text,
  preferred_date date,
  preferred_time time,
  venue_id uuid REFERENCES public.venues(id),
  location_text text,
  lat decimal(10,8) CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  lng decimal(11,8) CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
  size text,
  surface text,
  level text NOT NULL DEFAULT 'amateur'
    CHECK (level IN ('amateur', 'intermedio', 'competitivo')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'matched', 'cancelled', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS match_requests_status_expires_at_idx
  ON public.match_requests (status, expires_at);
CREATE INDEX IF NOT EXISTS match_requests_team_id_idx
  ON public.match_requests (team_id);

CREATE TABLE IF NOT EXISTS public.match_request_responses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id uuid NOT NULL REFERENCES public.match_requests(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.users(id),
  message text,
  proposed_date date,
  proposed_time time,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, team_id)
);

CREATE INDEX IF NOT EXISTS match_request_responses_request_id_idx
  ON public.match_request_responses (request_id);
CREATE INDEX IF NOT EXISTS match_request_responses_team_id_idx
  ON public.match_request_responses (team_id);

CREATE TABLE IF NOT EXISTS public.team_stats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE UNIQUE,
  matches_played int NOT NULL DEFAULT 0 CHECK (matches_played >= 0),
  wins int NOT NULL DEFAULT 0 CHECK (wins >= 0),
  draws int NOT NULL DEFAULT 0 CHECK (draws >= 0),
  losses int NOT NULL DEFAULT 0 CHECK (losses >= 0),
  goals_for int NOT NULL DEFAULT 0 CHECK (goals_for >= 0),
  goals_against int NOT NULL DEFAULT 0 CHECK (goals_against >= 0),
  win_streak int NOT NULL DEFAULT 0 CHECK (win_streak >= 0),
  best_streak int NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
  elo int NOT NULL DEFAULT 1000 CHECK (elo >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_stats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  matches_played int NOT NULL DEFAULT 0 CHECK (matches_played >= 0),
  wins int NOT NULL DEFAULT 0 CHECK (wins >= 0),
  draws int NOT NULL DEFAULT 0 CHECK (draws >= 0),
  losses int NOT NULL DEFAULT 0 CHECK (losses >= 0),
  goals int NOT NULL DEFAULT 0 CHECK (goals >= 0),
  assists int NOT NULL DEFAULT 0 CHECK (assists >= 0),
  win_streak int NOT NULL DEFAULT 0 CHECK (win_streak >= 0),
  best_streak int NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
  elo int NOT NULL DEFAULT 1000 CHECK (elo >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.match_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE UNIQUE,
  team_home_id uuid NOT NULL REFERENCES public.teams(id),
  team_away_id uuid NOT NULL REFERENCES public.teams(id),
  goals_home int NOT NULL DEFAULT 0 CHECK (goals_home >= 0),
  goals_away int NOT NULL DEFAULT 0 CHECK (goals_away >= 0),
  confirmed_by uuid NOT NULL REFERENCES public.users(id),
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (team_home_id <> team_away_id)
);

CREATE TABLE IF NOT EXISTS public.team_public_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE UNIQUE,
  bio text,
  founded_year int CHECK (founded_year IS NULL OR founded_year BETWEEN 1800 AND 2100),
  home_zone text,
  preferred_size text,
  preferred_surface text,
  logo_url text,
  banner_url text,
  social_instagram text,
  is_public bool NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.goal_difference(ts public.team_stats)
RETURNS int AS $$
  SELECT ts.goals_for - ts.goals_against
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.win_rate(ts public.team_stats)
RETURNS decimal AS $$
  SELECT CASE
    WHEN ts.matches_played = 0 THEN 0
    ELSE ROUND((ts.wins::decimal / ts.matches_played) * 100, 1)
  END
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.update_stats_after_result()
RETURNS trigger AS $$
DECLARE
  v_home_result text;
  v_away_result text;
BEGIN
  IF NEW.goals_home > NEW.goals_away THEN
    v_home_result := 'win'; v_away_result := 'loss';
  ELSIF NEW.goals_home < NEW.goals_away THEN
    v_home_result := 'loss'; v_away_result := 'win';
  ELSE
    v_home_result := 'draw'; v_away_result := 'draw';
  END IF;

  INSERT INTO public.team_stats (
    team_id, matches_played, wins, draws, losses, goals_for, goals_against,
    win_streak, best_streak
  )
  VALUES (
    NEW.team_home_id, 1, (v_home_result = 'win')::int,
    (v_home_result = 'draw')::int, (v_home_result = 'loss')::int,
    NEW.goals_home, NEW.goals_away, (v_home_result = 'win')::int,
    (v_home_result = 'win')::int
  )
  ON CONFLICT (team_id) DO UPDATE SET
    matches_played = team_stats.matches_played + 1,
    wins = team_stats.wins + (v_home_result = 'win')::int,
    draws = team_stats.draws + (v_home_result = 'draw')::int,
    losses = team_stats.losses + (v_home_result = 'loss')::int,
    goals_for = team_stats.goals_for + NEW.goals_home,
    goals_against = team_stats.goals_against + NEW.goals_away,
    win_streak = CASE WHEN v_home_result = 'win' THEN team_stats.win_streak + 1 ELSE 0 END,
    best_streak = GREATEST(
      team_stats.best_streak,
      CASE WHEN v_home_result = 'win' THEN team_stats.win_streak + 1 ELSE 0 END
    ),
    updated_at = now();

  INSERT INTO public.team_stats (
    team_id, matches_played, wins, draws, losses, goals_for, goals_against,
    win_streak, best_streak
  )
  VALUES (
    NEW.team_away_id, 1, (v_away_result = 'win')::int,
    (v_away_result = 'draw')::int, (v_away_result = 'loss')::int,
    NEW.goals_away, NEW.goals_home, (v_away_result = 'win')::int,
    (v_away_result = 'win')::int
  )
  ON CONFLICT (team_id) DO UPDATE SET
    matches_played = team_stats.matches_played + 1,
    wins = team_stats.wins + (v_away_result = 'win')::int,
    draws = team_stats.draws + (v_away_result = 'draw')::int,
    losses = team_stats.losses + (v_away_result = 'loss')::int,
    goals_for = team_stats.goals_for + NEW.goals_away,
    goals_against = team_stats.goals_against + NEW.goals_home,
    win_streak = CASE WHEN v_away_result = 'win' THEN team_stats.win_streak + 1 ELSE 0 END,
    best_streak = GREATEST(
      team_stats.best_streak,
      CASE WHEN v_away_result = 'win' THEN team_stats.win_streak + 1 ELSE 0 END
    ),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS on_match_result_insert ON public.match_results;
CREATE TRIGGER on_match_result_insert
AFTER INSERT ON public.match_results
FOR EACH ROW EXECUTE FUNCTION public.update_stats_after_result();

CREATE OR REPLACE FUNCTION public.expire_match_request()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'open' AND NEW.expires_at <= now() THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS expire_match_request_before_write ON public.match_requests;
CREATE TRIGGER expire_match_request_before_write
BEFORE INSERT OR UPDATE ON public.match_requests
FOR EACH ROW EXECUTE FUNCTION public.expire_match_request();

ALTER TABLE public.match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_public_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_requests_public_read" ON public.match_requests;
CREATE POLICY "match_requests_public_read" ON public.match_requests
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "match_requests_team_insert" ON public.match_requests;
CREATE POLICY "match_requests_team_insert" ON public.match_requests
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = match_requests.team_id AND tm.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "match_requests_owner_update" ON public.match_requests;
CREATE POLICY "match_requests_owner_update" ON public.match_requests
  FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "responses_read" ON public.match_request_responses;
CREATE POLICY "responses_read" ON public.match_request_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = match_request_responses.team_id AND tm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.match_requests mr
      WHERE mr.id = match_request_responses.request_id AND mr.created_by = auth.uid()
    )
  );
DROP POLICY IF EXISTS "responses_insert" ON public.match_request_responses;
CREATE POLICY "responses_insert" ON public.match_request_responses
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = match_request_responses.team_id AND tm.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.match_requests mr
      WHERE mr.id = match_request_responses.request_id
        AND mr.team_id <> match_request_responses.team_id
        AND mr.status = 'open' AND mr.expires_at > now()
    )
  );
DROP POLICY IF EXISTS "responses_request_owner_update" ON public.match_request_responses;
CREATE POLICY "responses_request_owner_update" ON public.match_request_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.match_requests mr
      WHERE mr.id = match_request_responses.request_id AND mr.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.match_requests mr
      WHERE mr.id = match_request_responses.request_id AND mr.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "team_stats_public_read" ON public.team_stats;
CREATE POLICY "team_stats_public_read" ON public.team_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "player_stats_public_read" ON public.player_stats;
CREATE POLICY "player_stats_public_read" ON public.player_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "match_results_public_read" ON public.match_results;
CREATE POLICY "match_results_public_read" ON public.match_results FOR SELECT USING (true);
DROP POLICY IF EXISTS "match_results_participant_insert" ON public.match_results;
CREATE POLICY "match_results_participant_insert" ON public.match_results
  FOR INSERT WITH CHECK (
    confirmed_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.team_members tm ON tm.team_id IN (m.home_team_id, m.away_team_id)
      WHERE m.id = match_results.match_id
        AND tm.user_id = auth.uid()
        AND match_results.team_home_id = m.home_team_id
        AND match_results.team_away_id = m.away_team_id
    )
  );

DROP POLICY IF EXISTS "profiles_public_read" ON public.team_public_profiles;
CREATE POLICY "profiles_public_read" ON public.team_public_profiles
  FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "profiles_team_write" ON public.team_public_profiles;
CREATE POLICY "profiles_team_write" ON public.team_public_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_public_profiles.team_id AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_public_profiles.team_id AND tm.user_id = auth.uid()
    )
  );
