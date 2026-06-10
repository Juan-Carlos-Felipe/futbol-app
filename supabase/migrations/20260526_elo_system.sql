CREATE OR REPLACE FUNCTION public.calculate_elo(
  current_elo int,
  opponent_elo int,
  result decimal,
  matches_played int
)
RETURNS int AS $$
DECLARE
  k_factor int;
  expected decimal;
  new_elo int;
BEGIN
  k_factor := CASE
    WHEN matches_played < 10 THEN 40
    WHEN matches_played < 20 THEN 48
    ELSE 24
  END;

  expected := 1.0 / (1.0 + POWER(10.0, (opponent_elo - current_elo) / 400.0));
  new_elo := current_elo + ROUND(k_factor * (result - expected));

  RETURN GREATEST(new_elo, 600);
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.elo_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  match_id uuid REFERENCES public.matches(id),
  elo_before int NOT NULL,
  elo_after int NOT NULL,
  change int GENERATED ALWAYS AS (elo_after - elo_before) STORED,
  result text NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  opponent_id uuid REFERENCES public.teams(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.elo_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "elo_history_public_read" ON public.elo_history;
CREATE POLICY "elo_history_public_read"
  ON public.elo_history FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.update_elo_after_result()
RETURNS trigger AS $$
DECLARE
  v_home_elo int;
  v_away_elo int;
  v_home_played int;
  v_away_played int;
  v_home_result decimal;
  v_away_result decimal;
  v_new_home_elo int;
  v_new_away_elo int;
  v_home_result_text text;
  v_away_result_text text;
BEGIN
  SELECT elo, matches_played INTO v_home_elo, v_home_played
  FROM public.team_stats WHERE team_id = NEW.team_home_id;

  SELECT elo, matches_played INTO v_away_elo, v_away_played
  FROM public.team_stats WHERE team_id = NEW.team_away_id;

  v_home_elo := COALESCE(v_home_elo, 1000);
  v_away_elo := COALESCE(v_away_elo, 1000);
  v_home_played := COALESCE(v_home_played, 0);
  v_away_played := COALESCE(v_away_played, 0);

  IF NEW.goals_home > NEW.goals_away THEN
    v_home_result := 1.0;
    v_away_result := 0.0;
    v_home_result_text := 'win';
    v_away_result_text := 'loss';
  ELSIF NEW.goals_home < NEW.goals_away THEN
    v_home_result := 0.0;
    v_away_result := 1.0;
    v_home_result_text := 'loss';
    v_away_result_text := 'win';
  ELSE
    v_home_result := 0.5;
    v_away_result := 0.5;
    v_home_result_text := 'draw';
    v_away_result_text := 'draw';
  END IF;

  v_new_home_elo := public.calculate_elo(
    v_home_elo,
    v_away_elo,
    v_home_result,
    v_home_played
  );
  v_new_away_elo := public.calculate_elo(
    v_away_elo,
    v_home_elo,
    v_away_result,
    v_away_played
  );

  UPDATE public.team_stats
  SET elo = v_new_home_elo, updated_at = now()
  WHERE team_id = NEW.team_home_id;

  UPDATE public.team_stats
  SET elo = v_new_away_elo, updated_at = now()
  WHERE team_id = NEW.team_away_id;

  INSERT INTO public.elo_history
    (team_id, match_id, elo_before, elo_after, result, opponent_id)
  VALUES
    (NEW.team_home_id, NEW.match_id, v_home_elo, v_new_home_elo,
     v_home_result_text, NEW.team_away_id),
    (NEW.team_away_id, NEW.match_id, v_away_elo, v_new_away_elo,
     v_away_result_text, NEW.team_home_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS on_result_update_elo ON public.match_results;
CREATE TRIGGER on_result_update_elo
AFTER INSERT ON public.match_results
FOR EACH ROW EXECUTE FUNCTION public.update_elo_after_result();

CREATE TABLE IF NOT EXISTS public.player_levels (
  elo_min int NOT NULL,
  elo_max int NOT NULL,
  level int PRIMARY KEY,
  title text NOT NULL,
  badge_color text NOT NULL,
  icon text NOT NULL
);

INSERT INTO public.player_levels
  (elo_min, elo_max, level, title, badge_color, icon)
VALUES
  (0, 799, 1, 'Rookie', '#9ca3af', '🥉'),
  (800, 899, 2, 'Amateur', '#6b7280', '⚽'),
  (900, 999, 3, 'Semi-Pro', '#3b82f6', '🔵'),
  (1000, 1099, 4, 'Competitivo', '#8b5cf6', '💜'),
  (1100, 1199, 5, 'Élite', '#f59e0b', '⭐'),
  (1200, 1349, 6, 'Campeón', '#f59e0b', '🏆'),
  (1350, 9999, 7, 'Leyenda', '#dc2626', '🔥')
ON CONFLICT (level) DO UPDATE
SET elo_min = EXCLUDED.elo_min,
    elo_max = EXCLUDED.elo_max,
    title = EXCLUDED.title,
    badge_color = EXCLUDED.badge_color,
    icon = EXCLUDED.icon;

ALTER TABLE public.player_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "player_levels_public_read" ON public.player_levels;
CREATE POLICY "player_levels_public_read"
  ON public.player_levels FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.get_player_level(p_elo int)
RETURNS TABLE(
  level int,
  title text,
  badge_color text,
  icon text,
  elo_min int,
  elo_max int,
  progress decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT pl.level,
         pl.title,
         pl.badge_color,
         pl.icon,
         pl.elo_min,
         pl.elo_max,
         LEAST(
           100,
           GREATEST(
             0,
             ROUND(
               ((p_elo - pl.elo_min)::decimal /
                NULLIF(pl.elo_max - pl.elo_min, 0)) * 100,
               1
             )
           )
         )
  FROM public.player_levels pl
  WHERE p_elo BETWEEN pl.elo_min AND pl.elo_max
  ORDER BY pl.level
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
