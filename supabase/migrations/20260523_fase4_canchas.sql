-- FASE 4: Canchas, Reservas y Pagos Split

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla public.venues (canchas)
CREATE TABLE IF NOT EXISTS public.venues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text NOT NULL,
  lat decimal(10,8),
  lng decimal(11,8),
  price_base int NOT NULL DEFAULT 0,
  price_platform int NOT NULL DEFAULT 0,
  price_public int,
  surface text,
  size text,
  photos text[],
  amenities text[],
  schedule jsonb,
  mp_collector_id text,
  is_featured bool DEFAULT false,
  is_municipal bool DEFAULT false,
  discount_pct int DEFAULT 0,
  rating decimal(2,1) DEFAULT 0,
  review_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.venues
  ALTER COLUMN price_base SET DEFAULT 0,
  ALTER COLUMN price_platform SET DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating decimal(2,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count int DEFAULT 0;

-- 2. Tabla public.reservations
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id uuid REFERENCES public.matches(id),
  venue_id uuid REFERENCES public.venues(id),
  status text DEFAULT 'pending_payment',
  total_amount int NOT NULL,
  platform_fee int NOT NULL,
  split_count int DEFAULT 1,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS split_count int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- 3. Tabla public.reservation_payments
CREATE TABLE IF NOT EXISTS public.reservation_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  amount int NOT NULL,
  status text DEFAULT 'pending',
  mp_payment_id text,
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 4. Tabla public.venue_slots
CREATE TABLE IF NOT EXISTS public.venue_slots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  date date,
  start_time time,
  end_time time,
  is_available bool DEFAULT true,
  reserved_by uuid REFERENCES public.reservations(id),
  UNIQUE(venue_id, date, start_time)
);

-- NOTA: reservations.slot_id referencia venue_slots(id). Se agrega después
-- porque reservations y venue_slots se referencian mutuamente.
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS slot_id uuid REFERENCES public.venue_slots(id);

-- 5. Tabla public.venue_reviews
CREATE TABLE IF NOT EXISTS public.venue_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  rating int CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(venue_id, user_id)
);

-- 6. Trigger 1 - precio automatico (markup 12%)
CREATE OR REPLACE FUNCTION public.set_platform_price()
RETURNS TRIGGER AS $$
BEGIN
  NEW.price_platform := ROUND(NEW.price_base * 1.12);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_platform_price ON public.venues;
CREATE TRIGGER auto_platform_price
BEFORE INSERT OR UPDATE OF price_base ON public.venues
FOR EACH ROW EXECUTE FUNCTION public.set_platform_price();

-- 7. Trigger 2 - confirmar reserva cuando todos pagaron
CREATE OR REPLACE FUNCTION public.check_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_paid int;
  v_total int;
BEGIN
  IF NEW.status = 'paid' THEN
    SELECT COUNT(*) INTO v_paid
    FROM public.reservation_payments
    WHERE reservation_id = NEW.reservation_id
      AND status = 'paid';

    SELECT split_count INTO v_total
    FROM public.reservations
    WHERE id = NEW.reservation_id;

    IF v_paid >= v_total THEN
      UPDATE public.reservations
      SET status = 'confirmed',
          confirmed_at = now()
      WHERE id = NEW.reservation_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_payment_paid ON public.reservation_payments;
CREATE TRIGGER on_payment_paid
AFTER UPDATE ON public.reservation_payments
FOR EACH ROW EXECUTE FUNCTION public.check_reservation_completion();

-- 8. Trigger 3 - marcar slot como ocupado al confirmar reserva
CREATE OR REPLACE FUNCTION public.mark_slot_reserved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    UPDATE public.venue_slots
    SET is_available = false,
        reserved_by = NEW.id
    WHERE id = (
      SELECT slot_id
      FROM public.reservations
      WHERE id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_reservation_confirmed ON public.reservations;
CREATE TRIGGER on_reservation_confirmed
AFTER UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.mark_slot_reserved();

-- 9. RLS
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venues_public_read" ON public.venues;
CREATE POLICY "venues_public_read"
  ON public.venues FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "venues_service_role_write" ON public.venues;
CREATE POLICY "venues_service_role_write"
  ON public.venues FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "reservations_match_participants_read" ON public.reservations;
CREATE POLICY "reservations_match_participants_read"
  ON public.reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.match_calls mc
      WHERE mc.match_id = reservations.match_id
        AND mc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "reservation_payments_own" ON public.reservation_payments;
CREATE POLICY "reservation_payments_own"
  ON public.reservation_payments FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "venue_slots_public_read" ON public.venue_slots;
CREATE POLICY "venue_slots_public_read"
  ON public.venue_slots FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "venue_reviews_public_read" ON public.venue_reviews;
CREATE POLICY "venue_reviews_public_read"
  ON public.venue_reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "venue_reviews_insert_own" ON public.venue_reviews;
CREATE POLICY "venue_reviews_insert_own"
  ON public.venue_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());
