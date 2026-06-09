import { useQuery } from '@tanstack/react-query';
import { getReservationWithPayments, Reservation, PaymentWithUser } from '@/lib/reservations';

export function useReservation(reservationId: string | null) {
  const query = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: async () => {
      if (!reservationId) {
        return null;
      }
      return getReservationWithPayments(reservationId);
    },
    enabled: reservationId !== null,
    refetchInterval: 10000,
  });

  return {
    reservation: query.data?.reservation ?? null,
    payments: query.data?.payments ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}