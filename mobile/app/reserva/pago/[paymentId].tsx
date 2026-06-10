// ✅ REDISEÑADO con theme.ts
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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { SectionHeader } from '@/components/ui/SectionHeader';

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
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  const paymentMethods = [
    { id: 'card' as PaymentMethod, label: '💳 Tarjeta de crédito/débito', icon: 'card-outline' },
    { id: 'transfer' as PaymentMethod, label: '🏦 Transferencia bancaria', icon: 'business-outline' },
    { id: 'mercadopago' as PaymentMethod, label: '📱 Mercado Pago (app)', icon: 'phone-portrait-outline' },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'CONFIRMAR PAGO',
        headerStyle: { backgroundColor: theme.colors.primaryDark },
        headerTitleStyle: { fontFamily: theme.fonts.bebas, color: theme.colors.white },
        headerLeft: () => (
          <TouchableOpacity onPress={handleCancel} style={{ marginLeft: 16 }}>
            <Ionicons name="close" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        ),
        headerShown: true
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {paymentData && (
          <>
            <SectionHeader title="Detalles del Pago" />
            <View style={styles.card}>
              <Text style={styles.cardLabel}>PAGO POR CANCHA</Text>
              <Text style={styles.cardTitle}>{paymentData.venueName.toUpperCase()}</Text>
              <View style={styles.divider} />
              <Text style={styles.cardAmount}>{formatPrice(paymentData.amount)}</Text>
              <Text style={styles.cardSplit}>Dividido entre {paymentData.splitCount} jugadores</Text>
              <View style={styles.cardExpiresRow}>
                <Ionicons name="time-outline" size={14} color={theme.colors.gray} style={styles.expiresIcon} />
                <Text style={styles.cardExpires}>Vence en 24 horas</Text>
              </View>
            </View>
          </>
        )}

        <SectionHeader title="Método de Pago" />

        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              selectedMethod === method.id ? styles.methodCardSelected : null,
            ]}
            onPress={() => setSelectedMethod(method.id)}
          >
             <View style={[styles.methodIconContainer, selectedMethod === method.id && { backgroundColor: '#dcfce7' }]}>
                <Ionicons name={method.icon as any} size={20} color={selectedMethod === method.id ? theme.colors.primary : theme.colors.gray} />
             </View>
            <Text style={[
              styles.methodLabel,
              selectedMethod === method.id ? styles.methodLabelSelected : null,
            ]}>
              {method.label}
            </Text>
            {selectedMethod === method.id && (
               <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
            )}
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
              <ActivityIndicator size="small" color={theme.colors.white} style={styles.paySpinner} />
              <Text style={styles.payButtonText}>PROCESANDO...</Text>
            </>
          ) : paymentData ? (
            <Text style={styles.payButtonText}>PAGAR {formatPrice(paymentData.amount)}</Text>
          ) : null}
        </TouchableOpacity>

        <Text style={styles.simulationNote}>
           Modo simulación — los pagos no son reales
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: theme.colors.gray,
    fontFamily: theme.fonts.dmSans,
    fontSize: 16,
  },
  scrollContent: {
    padding: 24,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    ...theme.shadow.sm,
  },
  cardLabel: {
    color: theme.colors.gray,
    fontSize: 11,
    fontFamily: theme.fonts.dmSansBold,
    marginBottom: 4,
  },
  cardTitle: {
    color: theme.colors.dark,
    fontSize: 20,
    fontFamily: theme.fonts.bebas,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.gray100,
    marginVertical: 16,
  },
  cardAmount: {
    color: theme.colors.primary,
    fontSize: 32,
    fontFamily: theme.fonts.bebas,
    marginBottom: 4,
  },
  cardSplit: {
    color: theme.colors.gray,
    fontSize: 14,
    fontFamily: theme.fonts.dmSans,
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
    color: theme.colors.loss,
    fontSize: 12,
    fontFamily: theme.fonts.dmSansBold,
  },
  methodCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.gray100,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f0fdf4',
  },
  methodIconContainer: {
     width: 40,
     height: 40,
     borderRadius: 10,
     backgroundColor: theme.colors.gray100,
     alignItems: 'center',
     justifyContent: 'center',
  },
  methodLabel: {
    color: theme.colors.gray,
    fontSize: 15,
    flex: 1,
    fontFamily: theme.fonts.dmSansBold,
  },
  methodLabelSelected: {
    color: theme.colors.dark,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  paySpinner: {
    marginRight: 8,
  },
  payButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontFamily: theme.fonts.dmSansBold,
  },
  simulationNote: {
    color: theme.colors.gray,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    fontFamily: theme.fonts.dmSans,
  },
});
