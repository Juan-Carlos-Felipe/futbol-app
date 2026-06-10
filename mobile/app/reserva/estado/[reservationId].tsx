// ✅ REDISEÑADO con theme.ts
import { useEffect, useMemo, useState } from 'react';
import { Alert, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Reservation, ReservationPayment } from '@/lib/reservations';
import { theme } from '@/lib/theme';
import { SectionHeader } from '@/components/ui/SectionHeader';

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
  const progressWidth = totalCount > 0 ? (paidCount / totalCount) : 0;

  const countdownText = remainingMs === null
    ? null
    : remainingMs <= 0
    ? 'Expirado'
    : `${String(Math.floor((remainingMs / 3600000) % 24)).padStart(2, '0')}:${String(
        Math.floor((remainingMs / 60000) % 60)
      ).padStart(2, '0')}:${String(Math.floor((remainingMs / 1000) % 60)).padStart(2, '0')}`;

  const countdownColor = remainingMs !== null && remainingMs > 0 && remainingMs < 2 * 60 * 60 * 1000
    ? theme.colors.loss
    : theme.colors.gray;

  const statusText =
    reservation?.status === 'confirmed'
      ? 'Confirmada'
      : reservation?.status === 'cancelled'
      ? 'Cancelada'
      : 'Esperando pagos';

  const badgeStyle =
    reservation?.status === 'confirmed'
      ? { backgroundColor: '#dcfce7', color: theme.colors.win }
      : reservation?.status === 'cancelled'
      ? { backgroundColor: '#fee2e2', color: theme.colors.loss }
      : { backgroundColor: '#fef3c7', color: theme.colors.draw };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'ESTADO RESERVA',
        headerStyle: { backgroundColor: theme.colors.primaryDark },
        headerTitleStyle: { fontFamily: theme.fonts.bebas, color: theme.colors.white },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.replace('/(tabs)/canchas')} style={{ marginLeft: 16 }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        ),
        headerShown: true
      }} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <SectionHeader title="Estado de la Reserva" />
          <View style={[styles.statusBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
            <Text style={[styles.statusBadgeText, { color: badgeStyle.color }]}>{statusText.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.venueName}>{reservation?.venues?.name?.toUpperCase() ?? 'CANCHA'}</Text>
          <View style={styles.infoRow}>
             <Ionicons name="calendar-outline" size={16} color={theme.colors.gray} />
             <Text style={styles.infoText}>
               {reservation?.created_at ? new Date(reservation.created_at).toLocaleDateString('es-CL') : '—'}
             </Text>
          </View>
          <View style={styles.infoRow}>
             <Ionicons name="time-outline" size={16} color={theme.colors.gray} />
             <Text style={styles.infoText}>
               {reservation?.created_at ? new Date(reservation.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '—'}
             </Text>
          </View>

          <View style={styles.progressSection}>
             <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>PROGRESO DE PAGOS</Text>
                <Text style={styles.progressValue}>{paidCount}/{totalCount}</Text>
             </View>
             <View style={styles.progressBarBg}>
                <View style={[styles.progressFill, { width: `${progressWidth * 100}%` }]} />
             </View>
             <Text style={styles.progressHint}>
                {paidCount} de {totalCount} jugadores han pagado su parte
             </Text>
          </View>

          {countdownText ? (
            <View style={styles.countdownContainer}>
               <Ionicons name="timer-outline" size={20} color={countdownColor} />
               <Text style={[styles.countdownText, { color: countdownColor }]}>VENCE EN {countdownText}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)/canchas')}
          >
            <Text style={styles.primaryBtnText}>VOLVER A CANCHAS</Text>
          </TouchableOpacity>

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
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: theme.fonts.dmSansBold,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    ...theme.shadow.sm,
  },
  venueName: {
    fontSize: 24,
    fontFamily: theme.fonts.bebas,
    color: theme.colors.dark,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.gray,
    fontFamily: theme.fonts.dmSansBold,
  },
  progressSection: {
    marginTop: 24,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.dmSansBold,
    color: theme.colors.gray,
  },
  progressValue: {
    fontSize: 11,
    fontFamily: theme.fonts.dmSansBold,
    color: theme.colors.primary,
  },
  progressBarBg: {
    width: '100%',
    height: 10,
    backgroundColor: theme.colors.gray100,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressHint: {
    fontSize: 12,
    color: theme.colors.gray,
    fontFamily: theme.fonts.dmSans,
    marginTop: 8,
    textAlign: 'center',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 12,
  },
  countdownText: {
    fontSize: 14,
    fontFamily: theme.fonts.dmSansBold,
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: theme.colors.white,
    fontSize: 16,
    fontFamily: theme.fonts.dmSansBold,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.loss,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.loss,
    fontSize: 14,
    fontFamily: theme.fonts.dmSansBold,
  },
});
