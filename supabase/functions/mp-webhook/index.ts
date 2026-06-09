// ─────────────────────────────────────────────────────
// PENDIENTE: Configurar Mercado Pago
// ─────────────────────────────────────────────────────
// Para activar el webhook:
// 1. Configurar el token de acceso en supabase secrets set MP_ACCESS_TOKEN
// 2. Descomentar el código a continuación
// 3. supabase functions deploy mp-webhook
// 4. Configurar el webhook en el panel de Mercado Pago
// ─────────────────────────────────────────────────────

// import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
//
// serve(async (req) => {
//   try {
//     const body = await req.json()
//
//     // MP envía type='payment' cuando un pago se completa
//     if (body.type !== 'payment') {
//       return new Response('ok', { status: 200 })
//     }
//
//     const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
//
//     // Obtener detalle del pago desde MP
//     const mpRes = await fetch(
//       `https://api.mercadopago.com/v1/payments/${body.data.id}`,
//       { headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` } }
//     )
//     const mpPayment = await mpRes.json()
//
//     const supabase = createClient(
//       Deno.env.get('SUPABASE_URL')!,
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
//     )
//
//     // external_reference es nuestro paymentId de reservation_payments
//     const paymentId = mpPayment.external_reference
//     const mpStatus = mpPayment.status // approved | rejected | pending
//
//     const newStatus = mpStatus === 'approved' ? 'paid'
//       : mpStatus === 'rejected' ? 'failed'
//       : 'pending'
//
//     await supabase
//       .from('reservation_payments')
//       .update({
//         status: newStatus,
//         mp_payment_id: String(body.data.id),
//         paid_at: mpStatus === 'approved' ? new Date().toISOString() : null,
//       })
//       .eq('id', paymentId)
//
//     return new Response('ok', { status: 200 })
//   } catch (error) {
//     return new Response(JSON.stringify({ error: error.message }), { status: 500 })
//   }
// })