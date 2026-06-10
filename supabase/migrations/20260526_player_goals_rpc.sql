CREATE OR REPLACE FUNCTION public.increment_player_goals(
  p_user_id uuid,
  p_goals int
)
RETURNS void AS $$
BEGIN
  IF p_goals <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.player_stats (user_id, goals)
  VALUES (p_user_id, p_goals)
  ON CONFLICT (user_id) DO UPDATE
  SET goals = public.player_stats.goals + p_goals,
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
