// ─────────────────────────────────────────────────────
// PENDIENTE: Configurar Mercado Pago
// ─────────────────────────────────────────────────────
// Para activar el pago real:
// 1. Obtener Access Token TEST- desde mercadopago.cl/developers/panel
// 2. Ejecutar: supabase secrets set MP_ACCESS_TOKEN=TEST-xxxx
// 3. Descomentar el código de esta función
// 4. supabase functions deploy create-mp-preference
// 5. En mobile/lib/mercadopago.ts: cambiar simulated:true por llamada real
// ─────────────────────────────────────────────────────

// import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
//
// const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
// const APP_SCHEME = Deno.env.get('APP_SCHEME') ?? 'futbolapp'
//
// serve(async (req) => {
//   try {
//     const { paymentId, amount, venueId, userName } = await req.json()
//
//     // Crear preferencia en Mercado Pago
//     const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         items: [{
//           title: `Reserva de cancha`,
//           description: `Pago split - ${userName}`,
//           quantity: 1,
//           currency_id: 'CLP',
//           unit_price: amount,
//         }],
//         back_urls: {
//           success: `${APP_SCHEME}://reserva/pago-resultado?paymentId=${paymentId}&status=success`,
//           failure: `${APP_SCHEME}://reserva/pago-resultado?paymentId=${paymentId}&status=failure`,
//           pending: `${APP_SCHEME}://reserva/pago-resultado?paymentId=${paymentId}&status=pending`,
//         },
//         auto_return: 'approved',
//         external_reference: paymentId,
//         notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
//       }),
//     })
//
//     const mpData = await mpResponse.json()
//
//     if (!mpResponse.ok) {
//       throw new Error(mpData.message ?? 'Error creando preferencia MP')
//     }
//
//     return new Response(
//       JSON.stringify({
//         preferenceId: mpData.id,
//         initPoint: mpData.init_point,        // producción
//         sandboxInitPoint: mpData.sandbox_init_point  // testing
//       }),
//       { headers: { 'Content-Type': 'application/json' } }
//     )
//   } catch (error) {
//     return new Response(
//       JSON.stringify({ error: error.message }),
//       { status: 500, headers: { 'Content-Type': 'application/json' } }
//     )
//   }
// })