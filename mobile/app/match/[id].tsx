import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useMatchById,
  useMatchCalls,
  useMyMatchCall,
  useRespondToCall,
  useMarkMatchPlayed,
  usePlayerStreak,
  MatchStatus,
} from '@/hooks/useMatch';
import { useAuth } from '@/hooks/useAuth';
import { useTeamById, useIsTeamMember } from '@/hooks/useTeam';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type MatchCallRow = {
  id: string;
  response: string;
  users: { display_name: string } | null;
};

type ReservationVenueInfo = {
  id: string;
  venue_id: string | null;
  status: string;
  venues?: { name: string; address: string | null } | null;
};

export default function MatchScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = typeof idParam === 'string' ? idParam : '';
  const router = useRouter();
  const { userId } = useAuth();

  const { data: match, isLoading: loadingMatch } = useMatchById(id);
  const { data: calls, isLoading: loadingCalls } = useMatchCalls(id);
  const { data: myCall, refetch: refetchMyCall } = useMyMatchCall(id);
  const { data: homeTeam } = useTeamById(match?.home_team_id ?? '');
  const { data: isHomeMember } = useIsTeamMember(match?.home_team_id ?? '');
  const { data: isAwayMember } = useIsTeamMember(match?.away_team_id ?? '');
  const { data: streak, isLoading: streakLoading } = usePlayerStreak(
    match?.home_team_id ?? ''
  );

  const [reservationVenue, setReservationVenue] = useState<ReservationVenueInfo | null>(null);
  const [reservationVenueLoading, setReservationVenueLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    async function loadReservationVenue() {
      setReservationVenueLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*, venues(name, address)')
        .eq('match_id', id)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        console.error('[Match] Error loading reservation venue', error);
      }

      setReservationVenue(data ?? null);
      setReservationVenueLoading(false);
    }

    loadReservationVenue();

    return () => {
      mounted = false;
    };
  }, [id]);

  const respondToCall = useRespondToCall();
  const markPlayed = useMarkMatchPlayed();

  if (loadingMatch) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#00C853" />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Partido no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCreator = !!userId && homeTeam?.created_by === userId;
  const isPlayed = match.status === 'played';
  const isCancelled = match.status === 'cancelled';
  const isTeamMember = isHomeMember || isAwayMember;
  const canMarkPlayed = (isCreator || isHomeMember) && !isPlayed && !isCancelled;
  const canRespond = isTeamMember && !isPlayed && !isCancelled;

  const accepted = calls?.filter((c) => c.response === 'accepted') ?? [];
  const declined = calls?.filter((c) => c.response === 'declined') ?? [];
  const pending = calls?.filter((c) => c.response === 'pending') ?? [];

  const handleRespond = (response: 'accepted' | 'declined') => {
    respondToCall.mutate(
      { matchId: id, response },
      {
        onSuccess: () => refetchMyCall(),
        onError: (e) => Alert.alert('Error', e.message),
      }
    );
  };

  const handleMarkPlayed = () => {
    Alert.alert(
      '¿Confirmar partido jugado?',
      'Esto actualizará las rachas de todos los jugadores que aceptaron.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            markPlayed.mutate(id, {
              onSuccess: () =>
                Alert.alert('✅ ¡Listo!', 'Rachas actualizadas correctamente.'),
              onError: (e) => Alert.alert('Error', e.message),
            });
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>← Volver</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, statusStyle(match.status)]}>
            <Text style={styles.statusText}>{STATUS_LABELS[match.status]}</Text>
          </View>
        </View>

        <Text style={styles.dateText}>
          {format(new Date(match.scheduled_at), "EEEE d 'de' MMMM · HH:mm'h'", {
            locale: es,
          })}
        </Text>

        {match.location ? (
          <Text style={styles.locationText}>📍 {match.location}</Text>
        ) : null}

        {reservationVenue?.venues?.name ? (
          <View style={styles.reservationCard}>
            <Text style={styles.sectionTitle}>¿Dónde juegan?</Text>
            <Text style={styles.locationText}>{reservationVenue.venues.name}</Text>
            {reservationVenue.venues.address ? (
              <Text style={styles.locationText}>{reservationVenue.venues.address}</Text>
            ) : null}
            {reservationVenue.status === 'pending_payment' ? (
              <Text style={styles.hint}>Reserva en espera de pagos</Text>
            ) : reservationVenue.status === 'confirmed' ? (
              <Text style={styles.hint}>Reserva confirmada</Text>
            ) : null}
          </View>
        ) : null}

        {homeTeam ? (
          <Text style={styles.teamName}>🏠 {homeTeam.name}</Text>
        ) : null}
      </View>

      {/* Pieza 3 — Racha en tiempo real */}
      {isHomeMember ? (
        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>Tu racha en este equipo</Text>
          {streakLoading ? (
            <ActivityIndicator color="#00C853" />
          ) : (
            <View style={styles.streakRow}>
              <Text style={styles.streakValue}>{streak?.streak ?? 0}</Text>
              <Text style={styles.streakFire}>🔥</Text>
            </View>
          )}
          <Text style={styles.streakMeta}>
            {streak?.games_played ?? 0} partidos jugados
          </Text>
        </View>
      ) : null}

      {canRespond ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mi respuesta</Text>
          {!myCall && pending.length === 0 && accepted.length === 0 ? (
            <Text style={styles.hint}>
              Pulsa para confirmar si juegas este partido.
            </Text>
          ) : null}
          <View style={styles.responseRow}>
            <TouchableOpacity
              style={[
                styles.responseBtn,
                myCall?.response === 'accepted' && styles.responseBtnActive,
              ]}
              onPress={() => handleRespond('accepted')}
              disabled={respondToCall.isPending}
            >
              <Text style={styles.responseBtnText}>✅ Voy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.responseBtn,
                styles.responseBtnDecline,
                myCall?.response === 'declined' && styles.responseBtnDeclineActive,
              ]}
              onPress={() => handleRespond('declined')}
              disabled={respondToCall.isPending}
            >
              <Text style={styles.responseBtnText}>❌ No puedo</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Jugadores ({accepted.length} confirmados)
        </Text>

        {loadingCalls ? (
          <ActivityIndicator color="#00C853" />
        ) : calls?.length === 0 ? (
          <Text style={styles.hint}>
            Sin convocatoria aún. Crea el partido de nuevo tras aplicar migraciones
            o espera a que el capitán convoque al equipo.
          </Text>
        ) : (
          <>
            {accepted.length > 0 ? (
              <>
                <Text style={styles.groupLabel}>✅ Confirmados</Text>
                {accepted.map((call) => (
                  <PlayerRow key={call.id} call={call as MatchCallRow} />
                ))}
              </>
            ) : null}

            {pending.length > 0 ? (
              <>
                <Text style={styles.groupLabel}>⏳ Pendientes</Text>
                {pending.map((call) => (
                  <PlayerRow key={call.id} call={call as MatchCallRow} />
                ))}
              </>
            ) : null}

            {declined.length > 0 ? (
              <>
                <Text style={styles.groupLabel}>❌ No pueden</Text>
                {declined.map((call) => (
                  <PlayerRow key={call.id} call={call as MatchCallRow} />
                ))}
              </>
            ) : null}
          </>
        )}
      </View>

      {canMarkPlayed ? (
        <TouchableOpacity
          style={[styles.playedBtn, markPlayed.isPending && styles.btnDisabled]}
          onPress={handleMarkPlayed}
          disabled={markPlayed.isPending}
        >
          {markPlayed.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.playedBtnText}>⚽ Marcar como jugado</Text>
          )}
        </TouchableOpacity>
      ) : null}

      {!canMarkPlayed && isTeamMember && !isPlayed && !isCancelled ? (
        <Text style={styles.hint}>
          Solo el capitán del equipo local puede marcar el partido como jugado.
        </Text>
      ) : null}
    </ScrollView>
  );
}

function PlayerRow({ call }: { call: MatchCallRow }) {
  return (
    <View style={styles.playerRow}>
      <View style={styles.playerAvatar}>
        <Text style={styles.playerAvatarText}>
          {call.users?.display_name?.charAt(0).toUpperCase() ?? '?'}
        </Text>
      </View>
      <Text style={styles.playerName}>
        {call.users?.display_name ?? 'Jugador'}
      </Text>
    </View>
  );
}

const STATUS_LABELS: Record<MatchStatus, string> = {
  seeking_opponent: 'Buscando rival',
  confirmed: 'Confirmado',
  played: 'Jugado',
  cancelled: 'Cancelado',
};

function statusStyle(status: MatchStatus) {
  switch (status) {
    case 'seeking_opponent':
      return styles.status_seeking_opponent;
    case 'confirmed':
      return styles.status_confirmed;
    case 'played':
      return styles.status_played;
    case 'cancelled':
      return styles.status_cancelled;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
    gap: 12,
  },
  errorText: { color: '#fff' },
  link: { color: '#00C853', fontSize: 16, fontWeight: '600' },

  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  streakCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00C85344',
  },
  streakLabel: { color: '#888', fontSize: 13 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  streakValue: { fontSize: 48, fontWeight: '800', color: '#fff' },
  streakFire: { fontSize: 36 },
  streakMeta: { color: '#666', fontSize: 13, marginTop: 6 },

  statusRow: { flexDirection: 'row' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  reservationCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  status_seeking_opponent: { backgroundColor: '#1A3A5C' },
  status_confirmed: { backgroundColor: '#1A4A2A' },
  status_played: { backgroundColor: '#333' },
  status_cancelled: { backgroundColor: '#4A1A1A' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  dateText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  locationText: { color: '#999', fontSize: 14 },
  teamName: { color: '#00C853', fontSize: 14, fontWeight: '600' },
  hint: { color: '#666', fontSize: 13, lineHeight: 18 },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  groupLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },

  responseRow: { flexDirection: 'row', gap: 8 },
  responseBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#222',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  responseBtnActive: { borderColor: '#00C853', backgroundColor: '#0A2A15' },
  responseBtnDecline: {},
  responseBtnDeclineActive: { borderColor: '#FF3D00', backgroundColor: '#2A0A0A' },
  responseBtnText: { color: '#fff', fontWeight: '600' },

  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: { color: '#000', fontWeight: '700', fontSize: 14 },
  playerName: { color: '#fff', fontSize: 15 },

  playedBtn: {
    backgroundColor: '#00C853',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  playedBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
