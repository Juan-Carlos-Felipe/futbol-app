-- No insertamos usuarios reales aquí (Auth los crea)
-- Solo datos de referencia para testing

insert into public.store_items (name, category, price_fichas, price_clp, rarity)
values
  ('Kit Rojo Clásico', 'kit', 150, 1490, 'common'),
  ('Celebración Tijera', 'celebration', 80, 990, 'common'),
  ('Marco Llamas', 'frame', 200, null, 'rare'),
  ('Efecto Racha x10', 'effect', 500, null, 'legendary');

-- SEED FASE 4: Canchas de prueba
-- NOTA: el trigger calcula price_platform automáticamente.
-- No insertes price_platform manualmente.

INSERT INTO public.venues
  (name, address, lat, lng, price_base, price_public, surface, size,
   photos, amenities, is_featured, is_municipal, rating, review_count)
VALUES
  (
    'Cancha El Pino',
    'Av. Irarrázaval 3500, Ñuñoa',
    -33.45600000, -70.61930000,
    20000, 25000, 'pasto sintético', 'F5',
    ARRAY['https://picsum.photos/seed/cancha1/400/300'],
    ARRAY['vestuarios','estacionamiento'],
    true, false, 4.5, 12
  ),
  (
    'SportCenter Las Condes',
    'Av. Apoquindo 6500, Las Condes',
    -33.40890000, -70.57840000,
    30000, NULL, 'pasto sintético', 'F7',
    ARRAY['https://picsum.photos/seed/cancha2/400/300'],
    ARRAY['vestuarios','camarines','bar'],
    true, false, 4.8, 28
  ),
  (
    'Cancha Municipal Providencia',
    'Pedro de Valdivia 1774, Providencia',
    -33.43200000, -70.62100000,
    0, NULL, 'cemento', 'F5',
    ARRAY['https://picsum.photos/seed/cancha3/400/300'],
    ARRAY[]::text[],
    false, true, 3.9, 5
  );

-- Marcar la municipal
UPDATE public.venues
SET is_municipal = true
WHERE name = 'Cancha Municipal Providencia';

-- Slots de prueba para los próximos 3 días para las canchas no municipales
INSERT INTO public.venue_slots (venue_id, date, start_time, end_time)
SELECT
  v.id,
  CURRENT_DATE + s.day_offset,
  (s.hour || ':00')::time,
  (s.hour + 2 || ':00')::time
FROM public.venues v
CROSS JOIN (
  SELECT day_offset, hour
  FROM generate_series(0,2) AS day_offset
  CROSS JOIN generate_series(9,21,2) AS hour
) s
WHERE v.name IN ('Cancha El Pino', 'SportCenter Las Condes')
  AND v.is_municipal = false;

-- SEED FASE 4 MODULO 1: Matchmaking
INSERT INTO public.team_stats (
  team_id, matches_played, wins, draws, losses, goals_for, goals_against,
  win_streak, best_streak, elo
)
SELECT
  t.id,
  s.matches_played,
  s.wins,
  s.draws,
  s.matches_played - s.wins - s.draws,
  floor(random() * 35 + 10)::int,
  floor(random() * 25 + 5)::int,
  s.win_streak,
  GREATEST(s.win_streak, floor(random() * 7 + 1)::int),
  floor(random() * 200 + 900)::int
FROM public.teams t
CROSS JOIN LATERAL (
  SELECT floor(random() * 20 + 5)::int AS matches_played
  WHERE t.id IS NOT NULL
) played
CROSS JOIN LATERAL (
  SELECT floor(random() * (played.matches_played + 1))::int AS wins
) won
CROSS JOIN LATERAL (
  SELECT floor(random() * (played.matches_played - won.wins + 1))::int AS draws
) drawn
CROSS JOIN LATERAL (
  SELECT
    played.matches_played,
    won.wins,
    drawn.draws,
    floor(random() * 4)::int AS win_streak
) s
ON CONFLICT (team_id) DO NOTHING;

INSERT INTO public.team_public_profiles (
  team_id, bio, founded_year, home_zone, preferred_size, preferred_surface, is_public
)
SELECT
  t.id,
  'Equipo amateur de ' || t.name || '. Buscamos rivales para partidos amistosos.',
  2020 + floor(random() * 5)::int,
  'Santiago Centro',
  'F5',
  'pasto sintetico',
  true
FROM public.teams t
ON CONFLICT (team_id) DO NOTHING;

-- team_members no tiene una columna role. Para datos de prueba usamos al creador
-- del equipo, siempre que tambien sea miembro.
INSERT INTO public.match_requests (
  team_id, created_by, title, description, preferred_date,
  preferred_time, location_text, size, surface, level, status
)
SELECT
  t.id,
  t.created_by,
  'Buscamos rival para partido amistoso',
  'Equipo de nivel amateur busca rival para partido amistoso. Tenemos cancha disponible.',
  CURRENT_DATE + floor(random() * 14 + 1)::int,
  ('18:00'::time + (floor(random() * 4) * interval '1 hour')),
  'Providencia, Santiago',
  'F5',
  'pasto sintetico',
  'amateur',
  'open'
FROM public.teams t
WHERE EXISTS (
  SELECT 1
  FROM public.team_members tm
  WHERE tm.team_id = t.id
    AND tm.user_id = t.created_by
)
  AND NOT EXISTS (
    SELECT 1
    FROM public.match_requests mr
    WHERE mr.team_id = t.id
      AND mr.status = 'open'
  )
LIMIT 3;

-- SELECT name, price_base, price_platform FROM venues; → price_platform debe ser price_base * 1.12
-- SELECT venue_id, COUNT(*) FROM venue_slots GROUP BY venue_id; → ~21 slots por cancha no municipal
