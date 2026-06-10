// ✅ REDISEÑADO con theme.ts
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { getVenueById } from '@/lib/venues';
import {
  createReservation,
  createSplitPayments,
  notifyReservationCreated,
} from '@/lib/reservations';
import { theme } from '@/lib/theme';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function ConfirmReservationScreen() {
  const { venueId, slotId, date, startTime, endTime } = useLocalSearchParams<{
    venueId: string;
    slotId: string;
    date: string;
    startTime: string;
    endTime: string;
  }>();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [venue, setVenue] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    async function loadVenue() {
      if (!venueId) return;

      try {
        const data = await getVenueById(venueId);
        setVenue(data);
      } catch (error) {
        console.error('[ConfirmReservation] Error loading venue', error);
        Alert.alert('Error', 'No se pudo cargar la información');
        router.back();
      } finally {
        setIsLoading(false);
      }
    }

    loadVenue();
  }, [venueId]);

  const handleConfirm = async () => {
    if (!venue || !venueId || !slotId) return;

    setIsCreating(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'No hay usuario autenticado');
        setIsCreating(false);
        return;
      }

      const reservation = await createReservation({
        matchId: null,
        venueId,
        slotId,
        totalAmount: venue.price_platform ?? 0,
        splitCount: 1,
      });

      await createSplitPayments(reservation.id, [
        { userId: user.id, amount: venue.price_platform ?? 0 },
      ]);

      notifyReservationCreated(reservation.id).catch(console.error);

      router.replace({
        pathname: '/reserva/estado/[reservationId]' as any,
        params: { reservationId: reservation.id },
      });
    } catch (error) {
      console.error('[ConfirmReservation] Error', error);
      Alert.alert('Error', 'No se pudo crear la reserva');
    } finally {
      setIsCreating(false);
    }
  };

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
        title: 'RESERVA',
        headerStyle: { backgroundColor: theme.colors.primaryDark },
        headerTitleStyle: { fontFamily: theme.fonts.bebas, color: theme.colors.white },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        ),
        headerShown: true
      }} />

      <View style={styles.content}>
        {venue && (
          <>
            <SectionHeader title="Confirmar Reserva" />
            <View style={styles.card}>
              <Text style={styles.venueName}>{venue.name.toUpperCase()}</Text>
              <Text style={styles.venueAddress}>{venue.address}</Text>
              <View style={styles.divider} />

              <View style={styles.row}>
                 <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                 <Text style={styles.dateText}>{date}</Text>
              </View>

              <View style={[styles.row, { marginTop: 8 }]}>
                 <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
                 <Text style={styles.timeText}>{startTime} - {endTime}</Text>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>TOTAL A PAGAR</Text>
                <Text style={styles.priceText}>{formatPrice(venue.price_platform)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, isCreating && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <ActivityIndicator size="small" color={theme.colors.white} style={styles.spinner} />
                  <Text style={styles.confirmButtonText}>PROCESANDO...</Text>
                </>
              ) : (
                <Text style={styles.confirmButtonText}>RESERVAR AHORA</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
               <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
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
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    ...theme.shadow.sm,
  },
  venueName: {
    color: theme.colors.dark,
    fontSize: 22,
    fontFamily: theme.fonts.bebas,
    marginBottom: 4,
  },
  venueAddress: {
    color: theme.colors.gray,
    fontSize: 14,
    fontFamily: theme.fonts.dmSans,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.gray100,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    color: theme.colors.dark,
    fontSize: 15,
    fontFamily: theme.fonts.dmSansBold,
  },
  timeText: {
    color: theme.colors.dark,
    fontSize: 15,
    fontFamily: theme.fonts.dmSansBold,
  },
  priceContainer: {
    marginTop: 24,
    backgroundColor: theme.colors.gray100,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  priceLabel: {
    color: theme.colors.gray,
    fontSize: 11,
    fontFamily: theme.fonts.dmSansBold,
    marginBottom: 4,
  },
  priceText: {
    color: theme.colors.primary,
    fontSize: 32,
    fontFamily: theme.fonts.bebas,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  spinner: {
    marginRight: 8,
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontFamily: theme.fonts.dmSansBold,
  },
  cancelBtn: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: theme.colors.gray,
    fontFamily: theme.fonts.dmSansBold,
    fontSize: 14,
  },
});
