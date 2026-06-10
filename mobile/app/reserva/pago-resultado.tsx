// ✅ REDISEÑADO con theme.ts
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
              <View style={styles.iconCircle}>
                <Ionicons name="checkmark" size={60} color={theme.colors.white} />
              </View>
            </Animated.View>
            <Text style={styles.title}>
              ¡PAGO EXITOSO!
            </Text>
            <Text style={styles.subtitle}>
              Tu parte ha sido registrada correctamente. Cuando todos los jugadores paguen, la reserva quedará confirmada automáticamente.
            </Text>

            <View style={styles.actions}>
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
                style={styles.ghostButton}
                onPress={() => router.replace('/(tabs)/feed')}
              >
                <Text style={styles.ghostButtonText}>
                  VOLVER AL INICIO
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'failure':
        return (
          <>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.loss }]}>
              <Ionicons name="close" size={60} color={theme.colors.white} />
            </View>
            <Text style={[styles.title, { color: theme.colors.white }]}>
              EL PAGO FALLÓ
            </Text>
            <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.7)' }]}>
              Hubo un problema al procesar tu pago. Podés volver a intentarlo o elegir otro método.
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.white }]}
                onPress={() => router.back()}
              >
                <Text style={[styles.primaryButtonText, { color: theme.colors.primaryDark }]}>REINTENTAR PAGO</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ghostButton}
                onPress={() => router.replace('/(tabs)/canchas' as any)}
              >
                <Text style={[styles.ghostButtonText, { color: 'rgba(255,255,255,0.8)' }]}>
                  CANCELAR
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'pending':
      default:
        return (
          <>
             <View style={[styles.iconCircle, { backgroundColor: theme.colors.draw }]}>
              <Ionicons name="time-outline" size={60} color={theme.colors.white} />
            </View>
            <Text style={[styles.title, { color: theme.colors.white }]}>
              PAGO PENDIENTE
            </Text>
            <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.7)' }]}>
              Estamos procesando tu pago. Te avisaremos apenas tengamos la confirmación.
            </Text>
            {reservationId ? (
              <TouchableOpacity
                style={styles.primaryButton}
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
    <View style={[styles.container, status === 'success' ? styles.successBg : styles.otherBg]}>
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  successBg: {
    backgroundColor: theme.colors.primaryDark,
  },
  otherBg: {
    backgroundColor: theme.colors.primaryDark,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...theme.shadow.sm,
  },
  title: {
    fontSize: 32,
    fontFamily: theme.fonts.bebas,
    textAlign: 'center',
    color: theme.colors.white,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: theme.fonts.dmSans,
    marginBottom: 20,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontFamily: theme.fonts.dmSansBold,
  },
  ghostButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  ghostButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: theme.fonts.dmSansBold,
  },
});
