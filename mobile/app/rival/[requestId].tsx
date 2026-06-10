// ✅ REDISEÑADO con theme.ts
import { useEffect, useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ProposeMatchModal } from '@/components/matchmaking/ProposeMatchModal';
import {
  useAcceptResponse,
  useMatchRequestDetail,
  useRejectResponse,
  useRequestResponses,
  useTeamProfile,
} from '@/hooks/useMatchmaking';
import type { MatchRequest, MatchRequestResponse, TeamStats } from '@/lib/matchmaking';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { StatCard } from '@/components/ui/StatCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

const LEVEL_META: Record<
  MatchRequest['level'],
  { label: string; color: string; backgroundColor: string }
> = {
  amateur: { label: 'Amateur', color: '#4b5563', backgroundColor: '#f3f4f6' },
  intermedio: { label: 'Intermedio', color: theme.colors.blue, backgroundColor: theme.colors.blueBg },
  competitivo: { label: 'Competitivo', color: theme.colors.gold, backgroundColor: '#fffbeb' },
};

const RESPONSE_META: Record<
  MatchRequestResponse['status'],
  { label: string; color: string; backgroundColor: string }
> = {
  pending: { label: 'Esperando', color: theme.colors.draw, backgroundColor: '#fef3c7' },
  accepted: { label: 'Aceptado', color: theme.colors.win, backgroundColor: '#dcfce7' },
  rejected: { label: 'Rechazado', color: theme.colors.loss, backgroundColor: '#fee2e2' },
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'E';
}

function formatDate(value: string) {
  return format(new Date(value), 'dd/MM/yyyy', { locale: es });
}

function formatPreferredDate(value: string) {
  return format(new Date(`${value}T00:00:00`), "d 'de' MMMM", { locale: es });
}

function getWinRate(stats: TeamStats | undefined) {
  if (!stats || stats.matches_played === 0) {
    return 0;
  }

  return Math.round((stats.wins / stats.matches_played) * 100);
}

function isExpiringSoon(expiresAt: string) {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  return remainingMs > 0 && remainingMs < 48 * 60 * 60 * 1000;
}

export default function RivalRequestDetailScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const normalizedRequestId = typeof requestId === 'string' ? requestId : null;
  const { request, isLoading, isError, refetch } =
    useMatchRequestDetail(normalizedRequestId);
  const { profile } = useTeamProfile(request?.team_id ?? null);
  const { responses } = useRequestResponses(normalizedRequestId);
  const { accept, isAccepting } = useAcceptResponse();
  const { reject, isRejecting } = useRejectResponse();
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [showProposeModal, setShowProposeModal] = useState(false);

  useEffect(() => {
    const fetchActiveTeam = async () => {
      const { data: user, error: userError } = await supabase.auth.getUser();

      if (userError) {
        Alert.alert('Error', userError.message);
        return;
      }

      if (!user.user) return;

      const { data, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.user.id)
        .limit(1)
        .single<{ team_id: string }>();

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (data) setActiveTeamId(data.team_id);
    };

    fetchActiveTeam();
  }, []);

  const isOwnRequest = request?.team_id === activeTeamId;
  const myResponse = useMemo(
    () => responses.find((response) => response.team_id === activeTeamId) ?? null,
    [activeTeamId, responses]
  );

  async function handleAccept(responseId: string) {
    if (!normalizedRequestId) return;

    try {
      await accept({ responseId, requestId: normalizedRequestId });
      Alert.alert('Respuesta aceptada', 'El anuncio quedo marcado como partido acordado.');
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo aceptar.');
    }
  }

  async function handleReject(responseId: string) {
    if (!normalizedRequestId) return;

    try {
      await reject({ responseId, requestId: normalizedRequestId });
      Alert.alert('Respuesta rechazada', 'La propuesta fue rechazada.');
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo rechazar.');
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !request) {
    return (
      <View style={styles.centeredScreen}>
        <Ionicons name="alert-circle-outline" size={52} color={theme.colors.gray100} />
        <Text style={styles.emptyTitle}>No se pudo cargar el anuncio</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => refetch()}>
          <Text style={styles.primaryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const teamName = request.teams?.name ?? profile?.name ?? 'Equipo rival';
  const stats = request.team_stats ?? profile?.stats ?? undefined;
  const winRate = getWinRate(stats);
  const levelMeta = LEVEL_META[request.level];
  const publicProfile = profile?.profile ?? null;
  const instagramHandle = publicProfile?.social_instagram?.replace('@', '').trim();
  const canPropose = !isOwnRequest && request.status === 'open';

  return (
    <View style={styles.screen}>
       <Stack.Screen options={{
        title: 'DETALLE RIVAL',
        headerStyle: { backgroundColor: theme.colors.primaryDark },
        headerTitleStyle: { fontFamily: theme.fonts.bebas, color: theme.colors.white },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        ),
        headerShown: true
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>{getInitial(teamName)}</Text>
            </View>
            <Text style={styles.teamName}>{teamName.toUpperCase()}</Text>
            <View style={[styles.levelBadge, { backgroundColor: levelMeta.backgroundColor }]}>
              <Text style={[styles.levelText, { color: levelMeta.color }]}>
                {levelMeta.label.toUpperCase()}
              </Text>
            </View>
            {publicProfile?.home_zone ? (
              <Text style={styles.heroMuted}>ZONA: {publicProfile.home_zone.toUpperCase()}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <StatCard label="G" value={stats?.wins ?? 0} color={theme.colors.win} />
            <StatCard label="P" value={stats?.losses ?? 0} color={theme.colors.loss} />
            <StatCard label="E" value={stats?.draws ?? 0} color={theme.colors.draw} />
            <StatCard label="ELO" value={stats?.elo ?? 0} color={theme.colors.gold} />
          </View>

          <View style={styles.winRateSection}>
            <View style={styles.winRateLabelRow}>
                <Text style={styles.winRateLabel}>WIN RATE</Text>
                <Text style={styles.winRateValue}>{winRate}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${winRate}%` }]} />
            </View>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
               <Ionicons name="football-outline" size={14} color={theme.colors.gray} />
               <Text style={styles.infoText}>
                 {[request.size, request.surface].filter(Boolean).join(' · ') || 'A coordinar'}
               </Text>
            </View>
            <View style={styles.infoRow}>
               <Ionicons name="stats-chart-outline" size={14} color={theme.colors.gray} />
               <Text style={styles.infoText}>
                 {(stats?.matches_played ?? 0).toLocaleString('es-CL')} partidos jugados
               </Text>
            </View>
            {(stats?.win_streak ?? 0) > 0 ? (
               <View style={styles.infoRow}>
                  <Ionicons name="flame-outline" size={14} color={theme.colors.gold} />
                  <Text style={[styles.infoText, {color: theme.colors.gold}]}>Racha de {stats?.win_streak} victorias</Text>
               </View>
            ) : null}
          </View>
        </View>

        <View style={{paddingHorizontal: 16}}>
          {publicProfile?.bio || instagramHandle ? (
            <SectionCard>
              {publicProfile?.bio ? (
                <>
                  <SectionHeader title="Sobre el equipo" />
                  <Text style={styles.bodyText}>{publicProfile.bio}</Text>
                </>
              ) : null}
              {instagramHandle ? (
                <TouchableOpacity
                  style={styles.instagramLink}
                  onPress={() => Linking.openURL(`https://instagram.com/${instagramHandle}`)}
                >
                  <Ionicons name="logo-instagram" size={18} color={theme.colors.blue} />
                  <Text style={styles.instagramText}>@{instagramHandle}</Text>
                </TouchableOpacity>
              ) : null}
            </SectionCard>
          ) : null}

          <SectionCard>
            <SectionHeader title="Detalles del Anuncio" />
            <Text style={styles.requestTitle}>{request.title.toUpperCase()}</Text>
            {request.description ? (
              <Text style={styles.bodyText}>{request.description}</Text>
            ) : null}
            <View style={styles.separator} />
            {request.preferred_date ? (
              <DetailRow label="Fecha preferida" value={formatPreferredDate(request.preferred_date)} />
            ) : null}
            {request.preferred_time ? (
              <DetailRow label="Hora" value={request.preferred_time} />
            ) : null}
            {request.location_text ? (
              <DetailRow label="Zona" value={request.location_text} />
            ) : null}
            <DetailRow
              label="Formato"
              value={[request.size, request.surface].filter(Boolean).join(' · ') || 'A coordinar'}
            />
            <View style={styles.expirationContainer}>
                <Ionicons name="time-outline" size={14} color={isExpiringSoon(request.expires_at) ? theme.colors.loss : theme.colors.gray} />
                <Text
                  style={[
                    styles.expirationText,
                    isExpiringSoon(request.expires_at) && styles.expirationSoon,
                  ]}
                >
                  {isExpiringSoon(request.expires_at) ? 'Expira pronto. ' : ''}
                  Valido hasta {formatDate(request.expires_at)}
                </Text>
            </View>
          </SectionCard>

          {isOwnRequest ? (
            <View style={{marginTop: 8}}>
              <View style={styles.responsesHeader}>
                <SectionHeader title="Equipos Interesados" />
                {responses.length > 0 ? (
                  <View style={styles.responsesCount}>
                    <Text style={styles.responsesCountText}>{responses.length}</Text>
                  </View>
                ) : null}
              </View>
              {responses.length === 0 ? (
                <View style={styles.emptyResponses}>
                    <Text style={styles.emptyHint}>Aun no hay equipos interesados</Text>
                </View>
              ) : (
                responses.map((response) => (
                  <ResponseCard
                    key={response.id}
                    response={response}
                    disabled={isAccepting || isRejecting}
                    onAccept={() => handleAccept(response.id)}
                    onReject={() => handleReject(response.id)}
                  />
                ))
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {canPropose ? (
        <View style={styles.bottomBar}>
          {myResponse ? (
            <View style={styles.myResponseContainer}>
              <View style={styles.alreadyBadge}>
                 <Ionicons name="checkmark-circle" size={16} color={theme.colors.win} />
                 <Text style={styles.alreadyText}>
                   Propuesta enviada: {RESPONSE_META[myResponse.status].label}
                 </Text>
              </View>
              <TouchableOpacity style={[styles.submitButton, styles.submitButtonDisabled]} disabled>
                <Text style={styles.submitText}>PROPUESTA ENVIADA</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={() => setShowProposeModal(true)}>
              <Text style={styles.submitText}>PROPONER PARTIDO</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {activeTeamId ? (
        <ProposeMatchModal
          visible={showProposeModal}
          onClose={() => setShowProposeModal(false)}
          requestId={request.id}
          rivalTeamName={teamName}
          myTeamId={activeTeamId}
        />
      ) : null}
    </View>
  );
}

function StatColumn({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statColumn}>
      <Text style={[styles.statValue, { color }]}>{value.toLocaleString('es-CL')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function ResponseCard({
  response,
  disabled,
  onAccept,
  onReject,
}: {
  response: MatchRequestResponse;
  disabled: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const meta = RESPONSE_META[response.status];
  const teamName = response.teams?.name ?? 'Equipo';

  return (
    <View style={styles.responseCard}>
      <View style={styles.responseHeader}>
        <View style={styles.responseAvatar}>
          <Text style={styles.responseAvatarText}>{getInitial(teamName)}</Text>
        </View>
        <View style={styles.responseBody}>
          <Text style={styles.responseTeam}>{teamName}</Text>
          <Text style={styles.responseDate}>
            hace {formatDistanceToNow(new Date(response.created_at), { locale: es })}
          </Text>
        </View>
        <View style={[styles.responseStatus, { backgroundColor: meta.backgroundColor }]}>
          <Text style={[styles.responseStatusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      {response.message ? <Text style={styles.responseMessage}>{response.message}</Text> : null}
      {response.proposed_date || response.proposed_time ? (
        <View style={styles.proposalInfo}>
           <Ionicons name="calendar-outline" size={14} color={theme.colors.gray} />
           <Text style={styles.responseProposal}>
             { [response.proposed_date, response.proposed_time].filter(Boolean).join(' · ') }
           </Text>
        </View>
      ) : null}
      {response.status === 'pending' ? (
        <View style={styles.responseActions}>
          <TouchableOpacity
            style={[styles.acceptButton, disabled && styles.actionDisabled]}
            onPress={onAccept}
            disabled={disabled}
          >
            <Text style={styles.acceptButtonText}>ACEPTAR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rejectButton, disabled && styles.actionDisabled]}
            onPress={onReject}
            disabled={disabled}
          >
            <Text style={styles.rejectButtonText}>RECHAZAR</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.white, flex: 1 },
  scrollContent: { paddingBottom: 112 },
  centeredScreen: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    backgroundColor: theme.colors.primaryDark,
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: { alignItems: 'center', paddingHorizontal: 24 },
  logo: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.gold,
    borderRadius: 36,
    borderWidth: 3,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  logoText: { color: theme.colors.white, fontSize: 28, fontFamily: theme.fonts.bebas },
  teamName: {
    color: theme.colors.white,
    fontSize: 28,
    fontFamily: theme.fonts.bebas,
    marginTop: 12,
    textAlign: 'center',
  },
  heroMuted: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8, fontFamily: theme.fonts.dmSansBold },
  levelBadge: { borderRadius: 20, marginTop: 8, paddingHorizontal: 12, paddingVertical: 4 },
  levelText: { fontSize: 11, fontFamily: theme.fonts.dmSansBold },
  statsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: -30,
    padding: 20,
    ...theme.shadow.sm,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statColumn: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#6b7280', fontSize: 11, fontWeight: '800' },
  winRateSection: {
    marginTop: 20,
  },
  winRateLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  winRateLabel: { color: theme.colors.gray, fontSize: 11, fontFamily: theme.fonts.dmSansBold },
  progressTrack: {
    backgroundColor: theme.colors.gray100,
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: theme.colors.primary, height: 8 },
  winRateValue: { color: theme.colors.primary, fontSize: 12, fontFamily: theme.fonts.dmSansBold },
  infoList: { gap: 8, marginTop: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: theme.colors.dark, fontSize: 13, fontFamily: theme.fonts.dmSansBold },
  sectionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    marginTop: 16,
    padding: 20,
    ...theme.shadow.sm,
  },
  bodyText: { color: theme.colors.gray, fontSize: 14, lineHeight: 22, fontFamily: theme.fonts.dmSans },
  instagramLink: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 16 },
  instagramText: { color: theme.colors.blue, fontSize: 14, fontFamily: theme.fonts.dmSansBold },
  requestTitle: { color: theme.colors.dark, fontSize: 18, fontFamily: theme.fonts.bebas, marginBottom: 8 },
  separator: { backgroundColor: theme.colors.gray100, height: 1, marginVertical: 16 },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: { color: theme.colors.gray, fontSize: 13, fontFamily: theme.fonts.dmSansBold },
  detailValue: { color: theme.colors.dark, flex: 1, fontSize: 13, fontFamily: theme.fonts.dmSansBold, textAlign: 'right' },
  expirationContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  expirationText: { color: theme.colors.gray, fontSize: 12, fontFamily: theme.fonts.dmSans },
  expirationSoon: { color: theme.colors.loss, fontFamily: theme.fonts.dmSansBold },
  responsesHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  responsesCount: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  responsesCountText: { color: theme.colors.white, fontSize: 12, fontFamily: theme.fonts.dmSansBold },
  emptyTitle: { color: theme.colors.dark, fontSize: 18, fontFamily: theme.fonts.dmSansBold, marginTop: 12 },
  emptyResponses: { paddingVertical: 24, alignItems: 'center' },
  emptyHint: { color: theme.colors.gray, fontSize: 14, fontFamily: theme.fonts.dmSans },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: theme.colors.white, fontSize: 14, fontFamily: theme.fonts.dmSansBold },
  responseCard: { backgroundColor: theme.colors.gray100, borderRadius: 16, marginBottom: 12, padding: 16 },
  responseHeader: { alignItems: 'center', flexDirection: 'row' },
  responseAvatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 10,
    width: 40,
  },
  responseAvatarText: { color: theme.colors.white, fontSize: 16, fontFamily: theme.fonts.bebas },
  responseBody: { flex: 1 },
  responseTeam: { color: theme.colors.dark, fontSize: 14, fontFamily: theme.fonts.dmSansBold },
  responseDate: { color: theme.colors.gray, fontSize: 12, marginTop: 2, fontFamily: theme.fonts.dmSans },
  responseStatus: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  responseStatusText: { fontSize: 10, fontFamily: theme.fonts.dmSansBold },
  responseMessage: {
    color: theme.colors.gray,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
    marginTop: 10,
    fontFamily: theme.fonts.dmSans,
  },
  proposalInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  responseProposal: { color: theme.colors.dark, fontSize: 13, fontFamily: theme.fonts.dmSansBold },
  responseActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  acceptButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    flex: 1,
    paddingVertical: 12,
  },
  acceptButtonText: { color: theme.colors.white, fontSize: 12, fontFamily: theme.fonts.dmSansBold },
  rejectButton: {
    alignItems: 'center',
    borderColor: theme.colors.loss,
    borderRadius: 10,
    borderWidth: 1.5,
    flex: 1,
    paddingVertical: 11,
  },
  rejectButtonText: { color: theme.colors.loss, fontSize: 12, fontFamily: theme.fonts.dmSansBold },
  actionDisabled: { opacity: 0.6 },
  bottomBar: {
    backgroundColor: theme.colors.white,
    borderTopColor: theme.colors.gray100,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: 16,
    position: 'absolute',
    right: 0,
    ...theme.shadow.sm,
  },
  myResponseContainer: { gap: 8 },
  alreadyBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  alreadyText: { color: theme.colors.win, fontSize: 13, fontFamily: theme.fonts.dmSansBold },
  submitButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { color: theme.colors.white, fontSize: 16, fontFamily: theme.fonts.dmSansBold },
});
