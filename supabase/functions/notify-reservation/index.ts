import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { type, reservationId, userId, targetUserId, fromTeamName, requestId } = await req.json()

    if (!type) {
      return new Response('Missing type', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (type === 'MATCH_PROPOSAL') {
      if (!targetUserId || !requestId) {
        return new Response('Missing targetUserId or requestId', { status: 400 })
      }

      const title = 'Nueva propuesta de partido'
      const body = `${fromTeamName ?? 'Un equipo'} quiere jugar contra vos`

      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('push_token')
        .eq('id', targetUserId)
        .single()

      if (userError) {
        console.error('[notify-reservation] Error loading proposal target user', userError)
      }

      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type,
          payload: { title, body, requestId },
          read: false,
        })

      if (insertError) {
        console.error('[notify-reservation] Error inserting proposal notification', insertError)
      }

      let sent = 0
      const Expo = await import('https://esm.sh/expo-server-sdk@3.7.0')
      const expo = new Expo.Expo()

      if (targetUser?.push_token && Expo.Expo.isExpoPushToken(targetUser.push_token)) {
        await expo.sendPushNotificationsAsync([
          {
            to: targetUser.push_token,
            title,
            body,
            data: { requestId, type },
            sound: 'default',
          },
        ])
        sent = 1
      }

      return new Response(
        JSON.stringify({ sent }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!reservationId) {
      return new Response('Missing reservationId', { status: 400 })
    }

    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        *,
        venues(name, address),
        reservation_payments(
          id, user_id, status, amount,
          users(push_token, display_name)
        )
      `)
      .eq('id', reservationId)
      .single()

    if (reservationError) {
      console.error('[notify-reservation] Error loading reservation', reservationError)
      return new Response('Error loading reservation', { status: 500 })
    }

    if (!reservation) {
      return new Response('Reservation not found', { status: 404 })
    }

    const venueName = reservation.venues?.name ?? 'la cancha'
    const payments = reservation.reservation_payments ?? []
    const paidCount = payments.filter((p: any) => p.status === 'paid').length
    const totalCount = payments.length

    let title = ''
    let body = ''
    let excludeUserId: string | null = null

    switch (type) {
      case 'RESERVATION_CREATED':
        title = '⚽ Reserva creada'
        body = `Se reservó ${venueName}. Tenés 24hs para pagar tu parte.`
        break

      case 'PAYMENT_COMPLETED':
        title = '✅ Pago recibido'
        body = `${paidCount} de ${totalCount} jugadores pagaron. Faltan ${Math.max(
          totalCount - paidCount,
          0
        )}.`
        excludeUserId = userId ?? null
        break

      case 'RESERVATION_CONFIRMED':
        title = '🎉 ¡Cancha confirmada!'
        body = `${venueName} está reservada para su partido. ¡A jugar!`
        break

      case 'RESERVATION_CANCELLED':
        title = '❌ Reserva cancelada'
        body = `La reserva en ${venueName} fue cancelada por tiempo vencido.`
        break

      default:
        return new Response('Unknown notification type', { status: 400 })
    }

    const Expo = await import('https://esm.sh/expo-server-sdk@3.7.0')
    const expo = new Expo.Expo()

    const messages = payments
      .filter(
        (p: any) =>
          p.users?.push_token &&
          p.user_id !== excludeUserId &&
          Expo.Expo.isExpoPushToken(p.users.push_token)
      )
      .map((p: any) => ({
        to: p.users.push_token,
        title,
        body,
        data: { reservationId, type },
        sound: 'default',
      }))

    const notificationInserts = payments
      .filter((p: any) => p.user_id !== excludeUserId)
      .map((p: any) => ({
        user_id: p.user_id,
        type,
        payload: { title, body, reservationId },
        read: false,
      }))

    if (notificationInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notificationInserts)

      if (insertError) {
        console.error('[notify-reservation] Error inserting notifications', insertError)
      }
    }

    if (messages.length > 0) {
      const chunks = expo.chunkPushNotifications(messages)
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk)
      }
    }

    return new Response(
      JSON.stringify({ sent: messages.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[notify-reservation] Unexpected error', error)
    return new Response('Internal server error', { status: 500 })
  }
})
