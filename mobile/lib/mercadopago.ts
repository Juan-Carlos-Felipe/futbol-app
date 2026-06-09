import { supabase } from './supabase';

export interface MPPreference {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  simulated?: boolean;
}

export const createPaymentPreference = async ({
  paymentId,
  amount,
  venueId,
  userName,
}: {
  paymentId: string;
  amount: number;
  venueId: string;
  userName: string;
}): Promise<MPPreference> => {
  // SIMULADO — reemplazar con llamada real a edge function cuando MP esté configurado
  await new Promise(resolve => setTimeout(resolve, 1500)); // simular latencia
  return {
    preferenceId: 'SIMULATED-' + paymentId,
    initPoint: 'https://www.mercadopago.cl',
    sandboxInitPoint: 'https://www.mercadopago.cl',
    simulated: true,
  };
};