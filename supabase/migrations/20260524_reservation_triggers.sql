CREATE EXTENSION IF NOT EXISTS pg_net;

-- Trigger: notificar cuando reserva cambia de estado
CREATE OR REPLACE FUNCTION public.notify_reservation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  PERFORM pg_net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/notify-reservation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'type', CASE NEW.status
        WHEN 'confirmed' THEN 'RESERVATION_CONFIRMED'
        WHEN 'cancelled' THEN 'RESERVATION_CANCELLED'
        ELSE 'RESERVATION_CREATED'
      END,
      'reservationId', NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_reservation_status_change ON public.reservations;
CREATE TRIGGER on_reservation_status_change
AFTER UPDATE OF status ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.notify_reservation_status_change();

-- Trigger: notificar cuando alguien paga su parte
CREATE OR REPLACE FUNCTION public.notify_payment_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'paid' AND NEW.status = 'paid' THEN
    PERFORM pg_net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/notify-reservation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'PAYMENT_COMPLETED',
        'reservationId', NEW.reservation_id,
        'userId', NEW.user_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_payment_completed ON public.reservation_payments;
CREATE TRIGGER on_payment_completed
AFTER UPDATE OF status ON public.reservation_payments
FOR EACH ROW EXECUTE FUNCTION public.notify_payment_completed();
