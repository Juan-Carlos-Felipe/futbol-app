import { useEffect, useMemo, useState } from 'react';
import { Alert, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Reservation, ReservationPayment } from '@/lib/reservations';

type ReservationWithVenue = Reservation & {
  venues?: { name: string } | null;
};

export default function ReservationStatusScreen() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const router = useRouter();

  const [reservation, setReservation] = useState<ReservationWithVenue | null>(null);
  const [payments, setPayments] = useState<ReservationPayment[]>([]);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userId } = useAuth();

  const fetchReservation = async () => {
    if (!reservationId) return;

    setIsLoading(true);

    try {
      const reservationResult = await supabase
        .from('reservations')
        .select('*, venues(name)')
        .eq('id', reservationId)
        .single();

      const reservationData = reservationResult.data as ReservationWithVenue | null;
      const reservationError = reservationResult.error;

      if (reservationError || !reservationData) {
        throw reservationError ?? new Error('Reserva no encontrada');
      }

      const { data: paymentData, error: paymentError } = await supabase
        .from('reservation_payments')
        .select('*')
        .eq('reservation_id', reservationId);

      if (paymentError) {
        throw paymentError;
      }

      setReservation(reservationData);
      setPayments(paymentData ?? []);
    } catch (error) {
      console.error('[ReservationStatus] Error loading reservation', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservation();
  }, [reservationId]);

  const pendingPayments = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === 'pending' && payment.expires_at)
        .sort(
          (a, b) =>
            new Date(a.expires_at ?? '').getTime() -
            new Date(b.expires_at ?? '').getTime()
        ),
    [payments]
  );

  const firstPending = pendingPayments[0] ?? null;
  const creatorId = useMemo(() => {
    if (payments.length === 0) return null;
    const sortedByCreated = [...payments].sort(
      (a, b) =>
        new Date(a.created_at ?? '').getTime() -
        new Date(b.created_at ?? '').getTime()
    );
    return sortedByCreated[0]?.user_id ?? null;
  }, [payments]);

  const isCreator = !!userId && creatorId === userId;
  const showCancelButton = reservation?.status === 'pending_payment' && isCreator;

  useEffect(() => {
    if (!reservationId) return;

    const channel = supabase
      .channel('reservation-' + reservationId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservation_payments',
          filter: 'reservation_id=eq.' + reservationId,
        },
        () => {
          fetchReservation();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations',
          filter: 'id=eq.' + reservationId,
        },
        () => {
          fetchReservation();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reservationId]);

  useEffect(() => {
    if (!firstPending?.expires_at) {
      setRemainingMs(null);
      return;
    }

    const updateRemaining = () => {
      setRemainingMs(new Date(firstPending.expires_at!).getTime() - Date.now());
    };

    updateRemaining();
    const timer = setInterval(updateRemaining, 1000);
    return () => clearInterval(timer);
  }, [firstPending?.expires_at]);

  const paidCount = payments.filter((payment) => payment.status === 'paid').length;
  const totalCount = payments.length;
  const progressWidth = totalCount > 0 ? `${Math.round((paidCount / totalCount) * 100)}%` : '0%';
  const progressStyle = { width: progressWidth } as const;

  const countdownText = remainingMs === null
    ? null
    : remainingMs <= 0
    ? 'Expirado'
    : `${String(Math.floor((remainingMs / 3600000) % 24)).padStart(2, '0')}:${String(
        Math.floor((remainingMs / 60000) % 60)
      ).padStart(2, '0')}:${String(Math.floor((remainingMs / 1000) % 60)).padStart(2, '0')}`;

  const countdownColor = remainingMs !== null && remainingMs > 0 && remainingMs < 2 * 60 * 60 * 1000
    ? '#dc2626'
    : '#374151';

  const statusText =
    reservation?.status === 'confirmed'
      ? '✅ Confirmada'
      : reservation?.status === 'cancelled'
      ? '❌ Cancelada'
      : '⏳ Esperando pagos';

  const badgeStyle =
    reservation?.status === 'confirmed'
      ? styles.badgeGreen
      : reservation?.status === 'cancelled'
      ? styles.badgeRed
      : styles.badgeYellow;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estado de la reserva</Text>
        <View style={[styles.statusBadge, badgeStyle]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.venueName}>{reservation?.venues?.name ?? 'Cancha'}</Text>
        <Text style={styles.date}>
          Fecha: {reservation?.created_at ? new Date(reservation.created_at).toLocaleDateString('es-CL') : '—'}
        </Text>
        <Text style={styles.time}>
          Hora: {reservation?.created_at ? new Date(reservation.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '—'}
        </Text>

        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { flex: paidCount }]} />
            <View style={[styles.progressEmpty, { flex: totalCount - paidCount }]} />
          </View>
          <Text style={styles.progressText}>
            {paidCount} de {totalCount} jugadores pagaron
          </Text>
        </View>

        {countdownText ? (
          <Text style={[styles.countdownText, { color: countdownColor }]}>Vence en {countdownText}</Text>
        ) : null}
      </View>

      {showCancelButton ? (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            Alert.alert(
              '¿Cancelar reserva?',
              'Se cancelará la reserva y se notificará a los jugadores.',
              [
                { text: 'No, mantener', style: 'cancel' },
                {
                  text: 'Sí, cancelar',
                  style: 'destructive',
                  onPress: async () => {
                    const { error } = await supabase
                      .from('reservations')
                      .update({ status: 'cancelled' })
                      .eq('id', reservationId);

                    if (error) {
                      Alert.alert('Error', 'No se pudo cancelar la reserva');
                      return;
                    }

                    router.replace('/(tabs)/canchas' as any);
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/(tabs)/canchas' as any)}
      >
        <Text style={styles.buttonText}>Volver a canchas</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeYellow: {
    backgroundColor: '#fef3c7',
  },
  badgeGreen: {
    backgroundColor: '#d1fae5',
  },
  badgeRed: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 20,
  },
  progressRow: {
    gap: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16a34a',
  },
  progressEmpty: {
    height: '100%',
    backgroundColor: 'transparent',
  },
  progressText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '700',
  },
});