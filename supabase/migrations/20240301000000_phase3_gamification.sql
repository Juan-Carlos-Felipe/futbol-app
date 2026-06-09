-- ============================================================
-- FASE 3: Gamificación — Rachas + Feed de Actividad
-- ============================================================

-- 1. Tabla de feed de actividad
create table if not exists public.activity_feed (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  type text not null,
  -- tipos: 'match_played' | 'streak_milestone' | 'streak_broken'
  --        | 'player_joined' | 'match_created' | 'match_confirmed'
  payload jsonb default '{}',
  created_at timestamptz default now()
);

-- Índices para queries rápidas
create index if not exists activity_feed_team_id_idx
  on public.activity_feed(team_id, created_at desc);

create index if not exists activity_feed_user_id_idx
  on public.activity_feed(user_id, created_at desc);

-- RLS
alter table public.activity_feed enable row level security;

-- Solo miembros del equipo ven el feed de ese equipo
create policy "team members can view feed"
  on public.activity_feed for select
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = activity_feed.team_id
        and tm.user_id = auth.uid()
    )
  );

-- Solo el sistema (service role) inserta en el feed
create policy "service role can insert feed"
  on public.activity_feed for insert
  with check (auth.role() = 'service_role');

-- ============================================================
-- 2. Trigger: notificar slot disponible cuando alguien declina
-- ============================================================
create or replace function public.notify_slot_available()
returns trigger as $$
begin
  if NEW.response = 'declined' and OLD.response != 'declined' then

    -- Notificar a todos los miembros del equipo
    insert into public.notifications (user_id, type, payload)
    select
      tm.user_id,
      'slot_available',
      jsonb_build_object(
        'match_id', NEW.match_id,
        'player_name', (select display_name from public.users where id = NEW.user_id)
      )
    from public.team_members tm
    join public.matches m on m.id = NEW.match_id
    where tm.team_id = m.home_team_id
      and tm.user_id != NEW.user_id;

    -- Romper racha del jugador que declinó
    update public.team_members tm
    set streak = 0
    from public.matches m
    where m.id = NEW.match_id
      and tm.user_id = NEW.user_id
      and (tm.team_id = m.home_team_id or tm.team_id = m.away_team_id);

    -- Registrar en feed
    insert into public.activity_feed (team_id, user_id, type, payload)
    select
      m.home_team_id,
      NEW.user_id,
      'streak_broken',
      jsonb_build_object(
        'match_id', NEW.match_id,
        'player_name', (select display_name from public.users where id = NEW.user_id)
      )
    from public.matches m
    where m.id = NEW.match_id;

  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_match_decline on public.match_calls;
create trigger on_match_decline
  after update on public.match_calls
  for each row execute function public.notify_slot_available();

-- ============================================================
-- 3. Función: actualizar rachas después de partido jugado
-- ============================================================
create or replace function public.update_streaks_after_match(p_match_id uuid)
returns void as $$
declare
  v_home_team_id uuid;
  v_away_team_id uuid;
begin
  -- Obtener equipos del partido
  select home_team_id, away_team_id
  into v_home_team_id, v_away_team_id
  from public.matches
  where id = p_match_id;

  -- Actualizar rachas y partidos jugados de quienes aceptaron
  update public.team_members tm
  set
    streak = streak + 1,
    games_played = games_played + 1
  from public.match_calls mc
  where mc.match_id = p_match_id
    and mc.response = 'accepted'
    and mc.user_id = tm.user_id
    and (tm.team_id = v_home_team_id or tm.team_id = v_away_team_id);

  -- Registrar en feed: partido jugado (por cada jugador que asistió)
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
      'new_streak', tm.streak + 1,
      'games_played', tm.games_played + 1
    )
  from public.match_calls mc
  join public.team_members tm on tm.user_id = mc.user_id
    and (tm.team_id = v_home_team_id or tm.team_id = v_away_team_id)
  join public.users u on u.id = mc.user_id
  where mc.match_id = p_match_id
    and mc.response = 'accepted';

  -- Registrar hitos de racha (5, 10, 20 partidos seguidos)
  insert into public.activity_feed (team_id, user_id, type, payload)
  select
    tm.team_id,
    mc.user_id,
    'streak_milestone',
    jsonb_build_object(
      'match_id', p_match_id,
      'player_name', u.display_name,
      'streak', tm.streak + 1
    )
  from public.match_calls mc
  join public.team_members tm on tm.user_id = mc.user_id
    and (tm.team_id = v_home_team_id or tm.team_id = v_away_team_id)
  join public.users u on u.id = mc.user_id
  where mc.match_id = p_match_id
    and mc.response = 'accepted'
    and (tm.streak + 1) in (5, 10, 20, 50);  -- hitos

end;
$$ language plpgsql security definer;

-- ============================================================
-- 4. Trigger: registrar en feed cuando se une un jugador
-- ============================================================
create or replace function public.on_player_joined_team()
returns trigger as $$
declare
  v_player_name text;
begin
  select display_name into v_player_name
  from public.users where id = NEW.user_id;

  insert into public.activity_feed (team_id, user_id, type, payload)
  values (
    NEW.team_id,
    NEW.user_id,
    'player_joined',
    jsonb_build_object('player_name', v_player_name)
  );

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_team_member_joined on public.team_members;
create trigger on_team_member_joined
  after insert on public.team_members
  for each row execute function public.on_player_joined_team();

-- ============================================================
-- 5. Trigger: registrar en feed cuando se crea un partido
-- ============================================================
create or replace function public.on_match_created()
returns trigger as $$
declare
  v_creator_name text;
begin
  select display_name into v_creator_name
  from public.users where id = auth.uid();

  insert into public.activity_feed (team_id, user_id, type, payload)
  values (
    NEW.home_team_id,
    auth.uid(),
    'match_created',
    jsonb_build_object(
      'match_id', NEW.id,
      'scheduled_at', NEW.scheduled_at,
      'location', NEW.location,
      'creator_name', v_creator_name
    )
  );

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_match_created_feed on public.matches;
create trigger on_match_created_feed
  after insert on public.matches
  for each row execute function public.on_match_created();
