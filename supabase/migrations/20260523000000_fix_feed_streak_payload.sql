-- Corrige payload del feed: new_streak usaba tm.streak + 1 DESPUÉS del update,
-- duplicando el valor (primer partido mostraba racha 2 en vez de 1).

create or replace function public.update_streaks_after_match(p_match_id uuid)
returns void as $$
declare
  v_home_team_id uuid;
  v_away_team_id uuid;
begin
  select home_team_id, away_team_id
  into v_home_team_id, v_away_team_id
  from public.matches
  where id = p_match_id;

  update public.team_members tm
  set
    streak = streak + 1,
    games_played = games_played + 1
  from public.match_calls mc
  where mc.match_id = p_match_id
    and mc.response = 'accepted'
    and mc.user_id = tm.user_id
    and (tm.team_id = v_home_team_id or tm.team_id = v_away_team_id);

  insert into public.activity_feed (team_id, user_id, type, payload)
  select
    case
      when tm.team_id = v_home_team_id then v_home_team_id
      else v_away_team_id
    end,
    mc.user_id,
    'match_played',
    jsonb_build_object(
      'match_id', p_match_id,
      'player_name', u.display_name,
      'new_streak', tm.streak,
      'games_played', tm.games_played
    )
  from public.match_calls mc
  join public.team_members tm on tm.user_id = mc.user_id
    and (tm.team_id = v_home_team_id or tm.team_id = v_away_team_id)
  join public.users u on u.id = mc.user_id
  where mc.match_id = p_match_id
    and mc.response = 'accepted';

  insert into public.activity_feed (team_id, user_id, type, payload)
  select
    tm.team_id,
    mc.user_id,
    'streak_milestone',
    jsonb_build_object(
      'match_id', p_match_id,
      'player_name', u.display_name,
      'streak', tm.streak
    )
  from public.match_calls mc
  join public.team_members tm on tm.user_id = mc.user_id
    and (tm.team_id = v_home_team_id or tm.team_id = v_away_team_id)
  join public.users u on u.id = mc.user_id
  where mc.match_id = p_match_id
    and mc.response = 'accepted'
    and tm.streak in (5, 10, 20, 50);

end;
$$ language plpgsql security definer;

-- Eventos ya guardados con el valor inflado en +1
update public.activity_feed
set payload = payload
  || jsonb_build_object(
    'new_streak', greatest(1, (payload->>'new_streak')::int - 1),
    'games_played', greatest(1, (payload->>'games_played')::int - 1)
  )
where type = 'match_played'
  and payload ? 'new_streak';

update public.activity_feed
set payload = payload
  || jsonb_build_object(
    'streak', greatest(1, (payload->>'streak')::int - 1)
  )
where type = 'streak_milestone'
  and payload ? 'streak';
