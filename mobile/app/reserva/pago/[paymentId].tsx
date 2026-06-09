import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

type PaymentMethod = 'card' | 'transfer' | 'mercadopago';

export default function PaymentScreen() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentData, setPaymentData] = useState<{
    amount: number;
    venueName: string;
    splitCount: number;
    reservationId: string;
  } | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    async function loadPayment() {
      if (!paymentId) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('No user');
        }

        const { data, error } = await supabase
          .from('reservation_payments')
          .select(
            `
              amount,
              reservations!inner (
                venue_id,
                split_count,
                venues!inner ( name )
              )
            `
          )
          .eq('id', paymentId)
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          console.log('[PaymentScreen] No payment found, using mock data');
          setPaymentData({
            amount: 15000,
            venueName: 'Cancha Central',
            splitCount: 5,
            reservationId: 'mock-venue-id',
          });
          return;
        }

        const reservation = (data as any).reservations;
        const venueName = Array.isArray(reservation.venues) 
          ? reservation.venues[0]?.name 
          : reservation.venues?.name;
        
        if (!venueName || !reservation?.venue_id) throw new Error('Missing data');

        setPaymentData({
          amount: data.amount,
          venueName,
          splitCount: reservation.split_count,
          reservationId: reservation.venue_id,
        });
      } catch (error) {
        console.error('[PaymentScreen] Error loading payment', error);
        Alert.alert('Error', 'No se pudo cargar la información del pago');
        router.back();
      } finally {
        setIsLoading(false);
      }
    }

    loadPayment();
  }, [paymentId]);

  const handleCancel = () => {
    Alert.alert(
      '¿Cancelar el pago?',
      'Podrás volver a intentarlo más tarde.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí', onPress: () => router.back() },
      ]
    );
  };

  const handlePay = async () => {
    if (!selectedMethod || !paymentId || !paymentData) return;

    setIsPaying(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No user');
      }

      if (!paymentId.startsWith('mock-')) {
        await supabase
          .from('reservation_payments')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            mp_payment_id: 'SIMULATED-' + Date.now(),
          })
          .eq('id', paymentId)
          .eq('user_id', user.id);
      }

      router.replace({
        pathname: '/reserva/pago-resultado',
        params: { paymentId, status: 'success' },
      });
    } catch (error) {
      console.error('[PaymentScreen] Error paying', error);
      Alert.alert('Error', 'No se pudo procesar el pago');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  const paymentMethods = [
    { id: 'card' as PaymentMethod, label: '💳 Tarjeta de crédito/débito' },
    { id: 'transfer' as PaymentMethod, label: '🏦 Transferencia bancaria' },
    { id: 'mercadopago' as PaymentMethod, label: '📱 Mercado Pago (app)' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar pago</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {paymentData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cancha: {paymentData.venueName}</Text>
            <Text style={styles.cardAmount}>{formatPrice(paymentData.amount)}</Text>
            <Text style={styles.cardSplit}>Split entre {paymentData.splitCount} jugadores</Text>
            <View style={styles.cardExpiresRow}>
              <Ionicons name="time-outline" size={14} color="#6b7280" style={styles.expiresIcon} />
              <Text style={styles.cardExpires}>Vence en 24 horas</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Seleccioná tu método de pago</Text>

        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              selectedMethod === method.id ? styles.methodCardSelected : null,
            ]}
            onPress={() => setSelectedMethod(method.id)}
          >
            {selectedMethod === method.id ? (
              <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
            ) : null}
            <Text style={[
              styles.methodLabel,
              selectedMethod === method.id ? styles.methodLabelSelected : null,
            ]}>
              {method.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[
            styles.payButton,
            !selectedMethod ? styles.payButtonDisabled : null,
          ]}
          onPress={handlePay}
          disabled={!selectedMethod || isPaying}
        >
          {isPaying ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" style={styles.paySpinner} />
              <Text style={styles.payButtonText}>Procesando...</Text>
            </>
          ) : paymentData ? (
            <Text style={styles.payButtonText}>Pagar {formatPrice(paymentData.amount)}</Text>
          ) : null}
        </TouchableOpacity>

        <Text style={styles.simulationNote}>
          ⚠️ Modo simulación — los pagos no son reales
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
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
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 4,
  },
  cardAmount: {
    color: '#16a34a',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSplit: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 8,
  },
  cardExpiresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiresIcon: {
    marginTop: 2,
  },
  cardExpires: {
    color: '#6b7280',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  methodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodCardSelected: {
    borderColor: '#16a34a',
  },
  methodLabel: {
    color: '#111827',
    fontSize: 15,
    flex: 1,
  },
  methodLabelSelected: {
    color: '#16a34a',
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  paySpinner: {
    marginRight: 8,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  simulationNote: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});