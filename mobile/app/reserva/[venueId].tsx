import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { getVenueById } from '@/lib/venues';
import {
  createReservation,
  createSplitPayments,
  notifyReservationCreated,
} from '@/lib/reservations';

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
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar reserva</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        {venue && (
          <>
            <View style={styles.card}>
              <Text style={styles.venueName}>{venue.name}</Text>
              <Text style={styles.venueAddress}>{venue.address}</Text>
              <Text style={styles.dateText}>{date}</Text>
              <Text style={styles.timeText}>{startTime} - {endTime}</Text>
              <Text style={styles.priceText}>{formatPrice(venue.price_platform)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, isCreating && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" style={styles.spinner} />
                  <Text style={styles.confirmButtonText}>Creando...</Text>
                </>
              ) : (
                <Text style={styles.confirmButtonText}>Crear reserva</Text>
              )}
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
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  venueName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  venueAddress: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 8,
  },
  dateText: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 4,
  },
  timeText: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 12,
  },
  priceText: {
    color: '#16a34a',
    fontSize: 28,
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  spinner: {
    marginRight: 8,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});