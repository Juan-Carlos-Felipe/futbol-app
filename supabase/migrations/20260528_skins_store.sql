CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.store_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'jersey_color',
  category text NOT NULL DEFAULT 'jersey_color',
  price_balones int NOT NULL DEFAULT 0,
  price_fichas int NOT NULL DEFAULT 0,
  price_clp int,
  preview_url text,
  rarity text DEFAULT 'common',
  is_limited bool DEFAULT false,
  is_free bool DEFAULT false,
  is_premium bool DEFAULT false,
  level_required int DEFAULT 1,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.store_items
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'jersey_color',
  ADD COLUMN IF NOT EXISTS price_balones int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_free bool DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_premium bool DEFAULT false,
  ADD COLUMN IF NOT EXISTS level_required int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active bool DEFAULT true;

UPDATE public.store_items
SET type = COALESCE(NULLIF(type, ''), NULLIF(category, ''), 'jersey_color'),
    price_balones = COALESCE(price_balones, price_fichas, 0),
    is_free = COALESCE(is_free, COALESCE(price_balones, price_fichas, 0) = 0),
    is_premium = COALESCE(is_premium, false),
    level_required = COALESCE(level_required, 1),
    data = COALESCE(data, '{}'::jsonb),
    is_active = COALESCE(is_active, true);

ALTER TABLE public.store_items
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN price_balones SET NOT NULL,
  ALTER COLUMN price_balones SET DEFAULT 0,
  ALTER COLUMN is_free SET DEFAULT false,
  ALTER COLUMN is_premium SET DEFAULT false,
  ALTER COLUMN level_required SET DEFAULT 1,
  ALTER COLUMN data SET NOT NULL,
  ALTER COLUMN data SET DEFAULT '{}'::jsonb,
  ALTER COLUMN is_active SET DEFAULT true;

CREATE TABLE IF NOT EXISTS public.user_inventory (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.store_items(id) ON DELETE CASCADE,
  equipped bool DEFAULT false,
  obtained_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.user_balones (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  balance int DEFAULT 0,
  total_earned int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.balones_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  amount int NOT NULL,
  type text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS store_items_type_idx ON public.store_items(type);
CREATE INDEX IF NOT EXISTS user_inventory_user_id_idx ON public.user_inventory(user_id);
CREATE INDEX IF NOT EXISTS balones_transactions_user_id_idx
  ON public.balones_transactions(user_id, created_at DESC);

ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balones_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_items_public_read" ON public.store_items;
CREATE POLICY "store_items_public_read"
  ON public.store_items FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "inventory_own_select" ON public.user_inventory;
CREATE POLICY "inventory_own_select"
  ON public.user_inventory FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "inventory_own_update" ON public.user_inventory;
CREATE POLICY "inventory_own_update"
  ON public.user_inventory FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "balones_own_select" ON public.user_balones;
CREATE POLICY "balones_own_select"
  ON public.user_balones FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "transactions_own_select" ON public.balones_transactions;
CREATE POLICY "transactions_own_select"
  ON public.balones_transactions FOR SELECT USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.earn_balones(
  p_user_id uuid,
  p_amount int,
  p_type text,
  p_description text DEFAULT NULL
)
RETURNS int AS $$
DECLARE
  v_new_balance int;
BEGIN
  INSERT INTO public.user_balones (user_id, balance, total_earned)
  VALUES (p_user_id, p_amount, GREATEST(p_amount, 0))
  ON CONFLICT (user_id) DO UPDATE
  SET balance = public.user_balones.balance + p_amount,
      total_earned = public.user_balones.total_earned + GREATEST(p_amount, 0),
      updated_at = now()
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.balones_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, p_type, p_description);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.purchase_item(
  p_user_id uuid,
  p_item_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_item public.store_items;
  v_balance int;
  v_user_level int;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario no autorizado');
  END IF;

  SELECT * INTO v_item
  FROM public.store_items
  WHERE id = p_item_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item no encontrado');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_inventory
    WHERE user_id = p_user_id AND item_id = p_item_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya tienes este item');
  END IF;

  SELECT COALESCE(pl.level, 1) INTO v_user_level
  FROM public.player_stats ps
  LEFT JOIN public.player_levels pl ON ps.elo BETWEEN pl.elo_min AND pl.elo_max
  WHERE ps.user_id = p_user_id
  ORDER BY pl.level
  LIMIT 1;

  v_user_level := COALESCE(v_user_level, 1);

  IF v_user_level < v_item.level_required THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nivel insuficiente. Necesitas nivel ' || v_item.level_required
    );
  END IF;

  IF NOT v_item.is_free THEN
    SELECT balance INTO v_balance
    FROM public.user_balones
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF COALESCE(v_balance, 0) < v_item.price_balones THEN
      RETURN jsonb_build_object('success', false, 'error', 'Balones insuficientes');
    END IF;

    UPDATE public.user_balones
    SET balance = balance - v_item.price_balones,
        updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO public.balones_transactions (user_id, amount, type, description)
    VALUES (p_user_id, -v_item.price_balones, 'purchase', 'Compra: ' || v_item.name);
  END IF;

  INSERT INTO public.user_inventory (user_id, item_id)
  VALUES (p_user_id, p_item_id);

  RETURN jsonb_build_object('success', true, 'item', v_item.name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.award_balones_after_result()
RETURNS trigger AS $$
DECLARE
  v_player record;
  v_outcome text;
  v_amount int;
BEGIN
  FOR v_player IN
    SELECT DISTINCT mc.user_id, tm.team_id
    FROM public.match_calls mc
    JOIN public.team_members tm ON tm.user_id = mc.user_id
    WHERE mc.match_id = NEW.match_id
      AND COALESCE(mc.response, 'pending') = 'accepted'
      AND tm.team_id IN (NEW.team_home_id, NEW.team_away_id)
  LOOP
    IF v_player.team_id = NEW.team_home_id THEN
      v_outcome := CASE
        WHEN NEW.goals_home > NEW.goals_away THEN 'win'
        WHEN NEW.goals_home < NEW.goals_away THEN 'loss'
        ELSE 'draw'
      END;
    ELSE
      v_outcome := CASE
        WHEN NEW.goals_away > NEW.goals_home THEN 'win'
        WHEN NEW.goals_away < NEW.goals_home THEN 'loss'
        ELSE 'draw'
      END;
    END IF;

    v_amount := CASE v_outcome
      WHEN 'win' THEN 50
      WHEN 'draw' THEN 20
      ELSE 10
    END;

    PERFORM public.earn_balones(
      v_player.user_id,
      v_amount,
      'match_' || v_outcome,
      'Partido ' || v_outcome
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_result_award_balones ON public.match_results;
CREATE TRIGGER on_result_award_balones
AFTER INSERT ON public.match_results
FOR EACH ROW EXECUTE FUNCTION public.award_balones_after_result();

WITH seed_items(name, description, type, price_balones, is_free, level_required, data) AS (
  VALUES
    ('Verde Clasico', 'El color original', 'jersey_color', 0, true, 1, '{"color": "#16a34a"}'::jsonb),
    ('Azul Profundo', 'Intenso y profesional', 'jersey_color', 100, false, 1, '{"color": "#1e40af"}'::jsonb),
    ('Rojo Fuego', 'Para los valientes', 'jersey_color', 100, false, 1, '{"color": "#dc2626"}'::jsonb),
    ('Negro Elite', 'Estilo premium', 'jersey_color', 200, false, 2, '{"color": "#111827"}'::jsonb),
    ('Morado Campeon', 'Solo para campeones', 'jersey_color', 300, false, 4, '{"color": "#7c3aed"}'::jsonb),
    ('Dorado Leyenda', 'Solo para leyendas', 'jersey_color', 500, false, 7, '{"color": "#f59e0b"}'::jsonb),
    ('Trotando', 'Pose de calentamiento', 'pose', 0, true, 1, '{"pose": "jogging"}'::jsonb),
    ('Estirando', 'Estiramiento de piernas', 'pose', 150, false, 2, '{"pose": "stretching"}'::jsonb),
    ('Posicion previa', 'Como en FIFA', 'pose', 200, false, 3, '{"pose": "idle"}'::jsonb),
    ('Brazos cruzados', 'Actitud de crack', 'pose', 250, false, 4, '{"pose": "arms_crossed"}'::jsonb),
    ('Calentando', 'Listo para todo', 'pose', 200, false, 3, '{"pose": "warmup"}'::jsonb),
    ('Rookie Badge', 'Tu primera insignia', 'badge', 0, true, 1, '{"icon": "🥉", "color": "#9ca3af"}'::jsonb),
    ('Badge Amateur', 'Jugador amateur', 'badge', 50, false, 2, '{"icon": "⚽", "color": "#6b7280"}'::jsonb),
    ('Badge Elite', 'Jugador de elite', 'badge', 400, false, 5, '{"icon": "⭐", "color": "#f59e0b"}'::jsonb),
    ('Badge Leyenda', 'Leyenda del barrio', 'badge', 1000, false, 7, '{"icon": "🔥", "color": "#dc2626"}'::jsonb),
    ('Marco Basico', 'Marco estandar', 'card_frame', 0, true, 1, '{"gradient": ["#9ca3af", "#6b7280"]}'::jsonb),
    ('Marco Dorado', 'Carta de oro', 'card_frame', 300, false, 5, '{"gradient": ["#f59e0b", "#d97706"]}'::jsonb),
    ('Marco Rojo Fuego', 'Carta especial', 'card_frame', 500, false, 6, '{"gradient": ["#dc2626", "#991b1b"]}'::jsonb),
    ('Marco Leyenda', 'La carta definitiva', 'card_frame', 1000, false, 7, '{"gradient": ["#7c3aed", "#4c1d95"]}'::jsonb)
)
INSERT INTO public.store_items (
  name, description, type, category, price_balones, price_fichas, is_free,
  level_required, data, is_active
)
SELECT name, description, type, type, price_balones, price_balones, is_free,
       level_required, data, true
FROM seed_items si
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_items existing
  WHERE existing.name = si.name AND existing.type = si.type
);

WITH seed_names(name) AS (
  VALUES
    ('Verde Clasico'),
    ('Azul Profundo'),
    ('Rojo Fuego'),
    ('Negro Elite'),
    ('Morado Campeon'),
    ('Dorado Leyenda'),
    ('Trotando'),
    ('Estirando'),
    ('Posicion previa'),
    ('Brazos cruzados'),
    ('Calentando'),
    ('Rookie Badge'),
    ('Badge Amateur'),
    ('Badge Elite'),
    ('Badge Leyenda'),
    ('Marco Basico'),
    ('Marco Dorado'),
    ('Marco Rojo Fuego'),
    ('Marco Leyenda')
)
DELETE FROM public.store_items si
WHERE NOT EXISTS (SELECT 1 FROM seed_names sn WHERE sn.name = si.name)
  AND NOT EXISTS (SELECT 1 FROM public.player_inventory pi WHERE pi.item_id = si.id)
  AND NOT EXISTS (SELECT 1 FROM public.user_inventory ui WHERE ui.item_id = si.id);

INSERT INTO public.user_balones (user_id, balance, total_earned)
SELECT id, 200, 200 FROM public.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.balones_transactions (user_id, amount, type, description)
SELECT u.id, 200, 'welcome', 'Balones de bienvenida'
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.balones_transactions bt
  WHERE bt.user_id = u.id AND bt.type = 'welcome'
);

INSERT INTO public.user_inventory (user_id, item_id)
SELECT u.id, si.id
FROM public.users u
CROSS JOIN public.store_items si
WHERE si.is_free = true
ON CONFLICT (user_id, item_id) DO NOTHING;
