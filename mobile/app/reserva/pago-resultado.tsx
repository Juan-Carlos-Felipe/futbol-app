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
import { theme } from '@/lib/theme';

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
    if (!isUpdating) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
      }).start();
    }
  }, [isUpdating, scaleAnim]);

  if (isUpdating) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons name="checkmark-circle" size={100} color={theme.colors.primary} />
            </Animated.View>
            <Text style={styles.title}>¡PAGO REGISTRADO!</Text>
            <Text style={styles.subtitle}>
              Tu parte está pagada. Cuando todos paguen, la cancha queda confirmada.
            </Text>
            {reservationId ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  router.replace('/reserva/estado/' + reservationId as any)
                }
              >
                <Text style={styles.primaryButtonText}>VER ESTADO DE RESERVA</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => router.replace('/(tabs)/canchas' as any)}
            >
              <Text style={styles.outlineButtonText}>IR A CANCHAS</Text>
            </TouchableOpacity>
          </>
        );

      case 'failure':
        return (
          <>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons name="close-circle" size={100} color={theme.colors.loss} />
            </Animated.View>
            <Text style={[styles.title, { color: theme.colors.loss }]}>
              EL PAGO FALLÓ
            </Text>
            <Text style={styles.subtitle}>
              Hubo un problema al procesar tu pago. Podés intentarlo de nuevo.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.loss }]}
              onPress={() => router.back()}
            >
              <Text style={styles.primaryButtonText}>REINTENTAR PAGO</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => router.replace('/(tabs)/canchas' as any)}
            >
              <Text style={styles.outlineButtonText}>CANCELAR</Text>
            </TouchableOpacity>
          </>
        );

      case 'pending':
      default:
        return (
          <>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons name="time" size={100} color={theme.colors.gold} />
            </Animated.View>
            <Text style={[styles.title, { color: theme.colors.gold }]}>
              PAGO EN PROCESO
            </Text>
            <Text style={styles.subtitle}>
              Estamos procesando tu pago. Te avisaremos cuando se confirme.
            </Text>
            {reservationId ? (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.gold }]}
                onPress={() =>
                  router.replace('/reserva/estado/' + reservationId as any)
                }
              >
                <Text style={styles.primaryButtonText}>VER ESTADO</Text>
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
    backgroundColor: theme.colors.primaryDark,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 36,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    color: theme.colors.white,
    opacity: 0.7,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.display,
    fontSize: 18,
  },
  outlineButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.white,
  },
  outlineButtonText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.display,
    fontSize: 18,
  },
});
