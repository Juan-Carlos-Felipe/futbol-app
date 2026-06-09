import { supabase } from './supabase';

export interface Reservation {
  id: string;
  match_id: string | null;
  venue_id: string | null;
  slot_id: string | null;
  total_amount: number;
  platform_fee: number;
  split_count: number;
  status: 'pending_payment' | 'confirmed' | 'cancelled';
  created_at: string | null;
}

export interface ReservationPayment {
  id: string;
  reservation_id: string | null;
  user_id: string | null;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  expires_at: string | null;
  mp_payment_id: string | null;
  paid_at: string | null;
  created_at: string | null;
}

export interface PaymentWithUser extends ReservationPayment {
  display_name: string;
}

export async function createReservation({
  matchId,
  venueId,
  slotId,
  totalAmount,
  splitCount,
}: {
  matchId: string | null;
  venueId: string;
  slotId: string;
  totalAmount: number;
  splitCount: number;
}): Promise<Reservation> {
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      match_id: matchId,
      venue_id: venueId,
      slot_id: slotId,
      total_amount: totalAmount,
      platform_fee: Math.round(totalAmount * 0.12),
      split_count: splitCount,
      status: 'pending_payment',
    })
    .select()
    .returns<Reservation[]>();

  if (error) {
    console.error('[reservations] Error creating reservation', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned after insert');
  }

  return data[0];
}

export async function createSplitPayments(
  reservationId: string,
  players: { userId: string; amount: number }[]
): Promise<ReservationPayment[]> {
  const { data, error } = await supabase
    .from('reservation_payments')
    .insert(
      players.map((p) => ({
        reservation_id: reservationId,
        user_id: p.userId,
        amount: p.amount,
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }))
    )
    .select()
    .returns<ReservationPayment[]>();

  if (error) {
    console.error('[reservations] Error creating split payments', error);
    throw error;
  }

  return data ?? [];
}

export const notifyReservationCreated = async (reservationId: string) => {
  const { error } = await supabase.functions.invoke('notify-reservation', {
    body: { type: 'RESERVATION_CREATED', reservationId },
  });

  if (error) {
    console.error('[reservations] Error enviando notificación:', error);
  }
};

export async function getReservationWithPayments(reservationId: string): Promise<{
  reservation: Reservation;
  payments: PaymentWithUser[];
}> {
  const { data: reservation, error: reservationError } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .limit(1)
    .returns<Reservation[]>();

  if (reservationError) {
    console.error('[reservations] Error fetching reservation', reservationError);
    throw reservationError;
  }

  if (!reservation || reservation.length === 0) {
    throw new Error('Reservation not found');
  }

  const { data: payments, error: paymentsError } = await supabase
    .from('reservation_payments')
    .select(
      `
        *,
        users (
          display_name
        )
      `
    )
    .eq('reservation_id', reservationId)
    .returns<
      Array<
        ReservationPayment & {
          users: { display_name: string } | null;
        }
      >
    >();

  if (paymentsError) {
    console.error('[reservations] Error fetching payments', paymentsError);
    throw paymentsError;
  }

  return {
    reservation: reservation[0],
    payments: (payments ?? []).map((p) => ({
      ...p,
      display_name: p.users?.display_name ?? 'Jugador',
    })),
  };
}

export async function markMyPaymentPaid(paymentId: string, mpPaymentId: string): Promise<ReservationPayment> {
  const { data, error } = await supabase
    .from('reservation_payments')
    .update({
      status: 'paid',
      mp_payment_id: mpPaymentId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .select()
    .returns<ReservationPayment[]>();

  if (error) {
    console.error('[reservations] Error marking payment as paid', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Payment not found');
  }

  return data[0];
}