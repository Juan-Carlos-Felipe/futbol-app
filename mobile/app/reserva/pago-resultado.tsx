import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function PaymentResultScreen() {
  const { paymentId, status: rawStatus } = useLocalSearchParams<{
    paymentId: string;
    status: 'success' | 'failure' | 'pending';
  }>();
  const router = useRouter();

  const [isUpdating, setIsUpdating] = useState(true);
  const [reservationId, setReservationId] = useState<string | null>(null);

  const scaleAnim = useRef(new Animated.Value(0)).current;

  const status = rawStatus ?? 'pending';

  useEffect(() => {
    async function updatePayment() {
      if (!paymentId) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (!paymentId.startsWith('mock-')) {
          const { data: payment } = await supabase
            .from('reservation_payments')
            .select('reservation_id')
            .eq('id', paymentId)
            .single();

          if (payment) {
            setReservationId(payment.reservation_id);
          }

          const newStatus =
            status === 'success' ? 'paid'
              : status === 'failure' ? 'failed'
              : 'pending';

          await supabase
            .from('reservation_payments')
            .update({
              status: newStatus,
              paid_at: status === 'success' ? new Date().toISOString() : null,
            })
            .eq('id', paymentId)
            .eq('user_id', user.id);
        } else {
          setReservationId('mock-reservation-id');
        }
      } catch (error) {
        console.error('[PaymentResult] Error updating payment', error);
      } finally {
        setIsUpdating(false);
      }
    }

    updatePayment();
  }, [paymentId, status]);

  useEffect(() => {
    if (!isUpdating && status === 'success') {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
      }).start();
    } else if (!isUpdating) {
      scaleAnim.setValue(1);
    }
  }, [isUpdating, status, scaleAnim]);

  if (isUpdating) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons name="checkmark-circle" size={90} color="#16a34a" />
            </Animated.View>
            <Text style={[styles.title, { color: '#16a34a' }]}>
              ¡Pago registrado!
            </Text>
            <Text style={styles.subtitle}>
              Tu parte está pagada. Cuando todos paguen, la cancha queda confirmada.
            </Text>
            {reservationId ? (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#16a34a' }]}
                onPress={() =>
                  router.replace('/reserva/estado/' + reservationId as any)
                }
              >
                <Text style={styles.buttonText}>Ver estado de la reserva</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.replace('/(tabs)/canchas' as any)}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Ir a canchas
              </Text>
            </TouchableOpacity>
          </>
        );

      case 'failure':
        return (
          <>
            <Ionicons name="close-circle" size={90} color="#dc2626" />
            <Text style={[styles.title, { color: '#dc2626' }]}>
              El pago falló
            </Text>
            <Text style={styles.subtitle}>
              Podés intentarlo de nuevo.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#dc2626' }]}
                onPress={() => router.back()}
              >
                <Text style={styles.buttonText}>Reintentar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => router.replace('/(tabs)/canchas' as any)}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'pending':
      default:
        return (
          <>
            <Ionicons name="time" size={90} color="#d97706" />
            <Text style={[styles.title, { color: '#d97706' }]}>
              Pago en proceso
            </Text>
            <Text style={styles.subtitle}>
              Te avisaremos cuando se confirme.
            </Text>
            {reservationId ? (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#d97706' }]}
                onPress={() =>
                  router.replace('/reserva/estado/' + reservationId as any)
                }
              >
                <Text style={styles.buttonText}>Ver estado</Text>
              </TouchableOpacity>
            ) : null}
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#6b7280',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});