-- Convocatorias automáticas al crear un partido
create or replace function public.create_match_calls_for_match()
returns trigger as $$
begin
  insert into public.match_calls (match_id, user_id)
  select NEW.id, tm.user_id
  from public.team_members tm
  where tm.team_id = NEW.home_team_id
  on conflict (match_id, user_id) do nothing;

  if NEW.away_team_id is not null then
    insert into public.match_calls (match_id, user_id)
    select NEW.id, tm.user_id
    from public.team_members tm
    where tm.team_id = NEW.away_team_id
    on conflict (match_id, user_id) do nothing;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_match_calls_created on public.matches;
create trigger on_match_calls_created
  after insert on public.matches
  for each row execute function public.create_match_calls_for_match();

-- Partidos existentes sin convocatoria
insert into public.match_calls (match_id, user_id)
select m.id, tm.user_id
from public.matches m
join public.team_members tm on tm.team_id = m.home_team_id
on conflict (match_id, user_id) do nothing;

insert into public.match_calls (match_id, user_id)
select m.id, tm.user_id
from public.matches m
join public.team_members tm on tm.team_id = m.away_team_id
where m.away_team_id is not null
on conflict (match_id, user_id) do nothing;

-- Ver nombre de compañeros de equipo (join en match_calls)
create policy "users_select_teammates"
  on public.users for select
  using (
    exists (
      select 1
      from public.team_members tm1
      join public.team_members tm2 on tm1.team_id = tm2.team_id
      where tm1.user_id = auth.uid()
        and tm2.user_id = users.id
    )
  );
