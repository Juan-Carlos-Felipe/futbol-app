-- Fix RLS para Reservas y Pagos para permitir flujo de reserva

-- 1. Permitir que cualquier usuario autenticado pueda crear una reserva
DROP POLICY IF EXISTS "reservations_insert_auth" ON public.reservations;
CREATE POLICY "reservations_insert_auth"
  ON public.reservations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Permitir que cualquier usuario autenticado pueda leer cualquier reserva (necesario para el insert.select() y la vista de estado)
DROP POLICY IF EXISTS "reservations_select_auth" ON public.reservations;
CREATE POLICY "reservations_select_auth"
  ON public.reservations FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 3. Permitir que cualquier usuario autenticado pueda actualizar una reserva (para cancelarla)
DROP POLICY IF EXISTS "reservations_update_auth" ON public.reservations;
CREATE POLICY "reservations_update_auth"
  ON public.reservations FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Permitir lectura de TODOS los pagos de una reserva (para poder ver cuántos faltan por pagar)
DROP POLICY IF EXISTS "reservation_payments_read_all" ON public.reservation_payments;
CREATE POLICY "reservation_payments_read_all"
  ON public.reservation_payments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- (La política de escritura de pagos sigue siendo propia)
