-- ============================================================
-- Corrección: Auto-confirmación del Creador y Auto-reparación de Rachas
-- ============================================================

-- 1. Modificar el trigger para auto-confirmar al creador como 'accepted'
create or replace function public.create_match_calls_for_match()
returns trigger as $$
declare
  v_creator_id uuid;
begin
  -- Obtener el creador del partido (el usuario autenticado en la sesión de Supabase)
  v_creator_id := auth.uid();

  -- Insertar convocatoria para el equipo local
  insert into public.match_calls (match_id, user_id, response, responded_at)
  select 
    NEW.id, 
    tm.user_id,
    case when tm.user_id = v_creator_id then 'accepted' else 'pending' end,
    case when tm.user_id = v_creator_id then now() else null end
  from public.team_members tm
  where tm.team_id = NEW.home_team_id
  on conflict (match_id, user_id) do update
  set 
    response = excluded.response,
    responded_at = excluded.responded_at;

  -- Insertar convocatoria para el equipo visitante (si aplica)
  if NEW.away_team_id is not null then
    insert into public.match_calls (match_id, user_id, response, responded_at)
    select 
      NEW.id, 
      tm.user_id,
      case when tm.user_id = v_creator_id then 'accepted' else 'pending' end,
      case when tm.user_id = v_creator_id then now() else null end
    from public.team_members tm
    where tm.team_id = NEW.away_team_id
    on conflict (match_id, user_id) do update
    set 
      response = excluded.response,
      responded_at = excluded.responded_at;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- 2. Corregir asistencias de partidos ya jugados
do $$
declare
  v_match record;
  v_creator_id uuid;
begin
  for v_match in 
    select m.id, m.home_team_id, t.created_by as creator_id
    from public.matches m
    join public.teams t on t.id = m.home_team_id
    where m.status = 'played'
  loop
    v_creator_id := v_match.creator_id;
    if v_creator_id is not null then
      -- Si existía una convocatoria en 'pending' para el creador, la pasamos a 'accepted'
      update public.match_calls
      set response = 'accepted', responded_at = now()
      where match_id = v_match.id 
        and user_id = v_creator_id 
        and response = 'pending';
      
      -- Si no existía convocatoria por alguna razón, la creamos como 'accepted'
      insert into public.match_calls (match_id, user_id, response, responded_at)
      values (v_match.id, v_creator_id, 'accepted', now())
      on conflict (match_id, user_id) do update
      set response = 'accepted';
    end if;
  end loop;
end;
$$;

-- 3. Recalcular de forma consistente y precisa las rachas y partidos jugados de todos los miembros
do $$
declare
  v_member record;
  v_played_count int;
  v_streak int;
  v_match record;
  v_attended boolean;
begin
  for v_member in select user_id, team_id from public.team_members loop
    -- Contar partidos jugados en los que asistió realmente
    select count(*)
    into v_played_count
    from public.matches m
    join public.match_calls mc on mc.match_id = m.id
    where m.status = 'played'
      and (m.home_team_id = v_member.team_id or m.away_team_id = v_member.team_id)
      and mc.user_id = v_member.user_id
      and mc.response = 'accepted';

    -- Calcular racha actual (partidos consecutivos jugados hacia atrás en el tiempo)
    v_streak := 0;
    for v_match in 
      select m.id
      from public.matches m
      where m.status = 'played'
        and (m.home_team_id = v_member.team_id or m.away_team_id = v_member.team_id)
      order by m.scheduled_at desc
    loop
      select exists (
        select 1 from public.match_calls
        where match_id = v_match.id
          and user_id = v_member.user_id
          and response = 'accepted'
      ) into v_attended;

      if v_attended then
        v_streak := v_streak + 1;
      else
        exit; -- Rompe la racha consecutiva
      end if;
    end loop;

    -- Actualizar con valores reales
    update public.team_members
    set 
      games_played = v_played_count,
      streak = v_streak
    where user_id = v_member.user_id 
      and team_id = v_member.team_id;
  end loop;
end;
$$;
