-- Extensiones
create extension if not exists "uuid-ossp";

-- Usuarios
create table public.users (
  id uuid references auth.users(id) primary key,
  email text unique not null,
  display_name text not null,
  avatar_url text,
  skills jsonb default '{"attack":50,"defense":50,"speed":50,"stamina":50}',
  created_at timestamptz default now()
);

-- Equipos
create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text unique not null,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- Membresía multitenant
create table public.team_members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  shirt_number int,
  streak int default 0,
  games_played int default 0,
  joined_at timestamptz default now(),
  unique(user_id, team_id)
);

-- Partidos
create table public.matches (
  id uuid primary key default uuid_generate_v4(),
  home_team_id uuid references public.teams(id),
  away_team_id uuid references public.teams(id),
  scheduled_at timestamptz not null,
  location text,
  status text default 'seeking_opponent',
  result jsonb,
  created_at timestamptz default now()
);

-- Convocatorias
create table public.match_calls (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references public.matches(id) on delete cascade,
  user_id uuid references public.users(id),
  response text default 'pending',
  responded_at timestamptz,
  unique(match_id, user_id)
);

-- Notificaciones
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null,
  payload jsonb default '{}',
  read bool default false,
  created_at timestamptz default now()
);

-- Canchas
create table public.venues (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  lat decimal(10,8),
  lng decimal(11,8),
  price_base int not null,
  price_platform int not null,
  price_public int,
  surface text,
  size text,
  photos text[],
  amenities text[],
  schedule jsonb,
  mp_collector_id text,
  is_featured bool default false,
  is_municipal bool default false,
  discount_pct int default 0,
  created_at timestamptz default now()
);

-- Reservas
create table public.reservations (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references public.matches(id),
  venue_id uuid references public.venues(id),
  status text default 'pending_payment',
  total_amount int not null,
  platform_fee int not null,
  created_at timestamptz default now()
);

-- Tienda
create table public.store_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  price_fichas int not null,
  price_clp int,
  preview_url text,
  rarity text default 'common',
  is_limited bool default false,
  created_at timestamptz default now()
);

-- Inventario
create table public.player_inventory (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  item_id uuid references store_items(id),
  acquired_at timestamptz default now(),
  equipped bool default false,
  unique(user_id, item_id)
);

-- Billetera
create table public.player_wallet (
  user_id uuid references public.users(id) primary key,
  fichas int default 0,
  total_spent_clp int default 0,
  updated_at timestamptz default now()
);

-- ─── TRIGGERS ───────────────────────────────────────────────────────────────

-- Trigger: al declinar un partido → notifica al equipo y rompe racha
create or replace function notify_slot_available()
returns trigger as $$
begin
  if new.response = 'declined' and old.response != 'declined' then
    insert into notifications (user_id, type, payload)
    select tm.user_id, 'slot_available',
      jsonb_build_object(
        'match_id', new.match_id,
        'player_name', (select display_name from users where id = new.user_id)
      )
    from team_members tm
    join matches m on m.id = new.match_id
    where tm.team_id = m.home_team_id and tm.user_id != new.user_id;

    update team_members tm set streak = 0
    from matches m
    where m.id = new.match_id and tm.user_id = new.user_id
      and (tm.team_id = m.home_team_id or tm.team_id = m.away_team_id);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_match_decline
after update on match_calls
for each row execute function notify_slot_available();

-- Función: actualizar rachas post-partido
create or replace function update_streaks_after_match(p_match_id uuid)
returns void as $$
begin
  update team_members tm
  set streak = streak + 1, games_played = games_played + 1
  from match_calls mc join matches m on m.id = mc.match_id
  where mc.match_id = p_match_id and mc.response = 'accepted'
    and mc.user_id = tm.user_id
    and (tm.team_id = m.home_team_id or tm.team_id = m.away_team_id);
end;
$$ language plpgsql;

-- ─── RLS (Row Level Security) ────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.match_calls enable row level security;
alter table public.notifications enable row level security;
alter table public.player_wallet enable row level security;
alter table public.player_inventory enable row level security;

-- Users: cada uno ve/edita solo su propio perfil
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);

-- Teams: cualquier autenticado puede leer, solo el creador puede crear/editar
create policy "teams_select_all" on public.teams for select using (auth.role() = 'authenticated');
create policy "teams_insert_auth" on public.teams for insert with check (auth.uid() = created_by);
create policy "teams_update_creator" on public.teams for update using (auth.uid() = created_by);

-- Team members: miembros ven su equipo, cualquier autenticado puede unirse
create policy "team_members_select" on public.team_members for select using (auth.role() = 'authenticated');
create policy "team_members_insert" on public.team_members for insert with check (auth.uid() = user_id);
create policy "team_members_update_own" on public.team_members for update using (auth.uid() = user_id);

-- Notificaciones: solo el dueño las ve
create policy "notifications_own" on public.notifications for all using (auth.uid() = user_id);

-- Wallet: solo el dueño
create policy "wallet_own" on public.player_wallet for all using (auth.uid() = user_id);

-- Inventario: solo el dueño
create policy "inventory_own" on public.player_inventory for all using (auth.uid() = user_id);

-- Match calls: autenticados pueden ver/insertar las suyas
create policy "match_calls_select" on public.match_calls for select using (auth.role() = 'authenticated');
create policy "match_calls_own" on public.match_calls for insert with check (auth.uid() = user_id);
create policy "match_calls_update_own" on public.match_calls for update using (auth.uid() = user_id);
