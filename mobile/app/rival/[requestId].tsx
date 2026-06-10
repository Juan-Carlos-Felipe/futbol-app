import { useEffect, useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

const LEVEL_META: Record<
  MatchRequest['level'],
  { label: string; color: string; backgroundColor: string }
> = {
  amateur: { label: 'Amateur', color: '#4b5563', backgroundColor: '#f3f4f6' },
  intermedio: { label: 'Intermedio', color: '#2563eb', backgroundColor: '#dbeafe' },
  competitivo: { label: 'Competitivo', color: '#92400e', backgroundColor: '#fef3c7' },
};

const RESPONSE_META: Record<
  MatchRequestResponse['status'],
  { label: string; color: string; backgroundColor: string }
> = {
  pending: { label: 'Esperando', color: '#92400e', backgroundColor: '#fef3c7' },
  accepted: { label: 'Aceptado', color: '#166534', backgroundColor: '#dcfce7' },
  rejected: { label: 'Rechazado', color: '#991b1b', backgroundColor: '#fee2e2' },
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
        <ActivityIndicator color="#16a34a" size="large" />
      </View>
    );
  }

  if (isError || !request) {
    return (
      <View style={styles.centeredScreen}>
        <Ionicons name="alert-circle-outline" size={52} color="#9ca3af" />
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>{getInitial(teamName)}</Text>
            </View>
            <Text style={styles.teamName}>{teamName}</Text>
            {publicProfile?.home_zone ? (
              <Text style={styles.heroMuted}>Pin: {publicProfile.home_zone}</Text>
            ) : null}
            {publicProfile?.founded_year ? (
              <Text style={styles.heroSubtle}>Desde {publicProfile.founded_year}</Text>
            ) : null}
            <View style={[styles.levelBadge, { backgroundColor: levelMeta.backgroundColor }]}>
              <Text style={[styles.levelText, { color: levelMeta.color }]}>
                {levelMeta.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <StatColumn label="G" value={stats?.wins ?? 0} color="#16a34a" />
            <StatColumn label="P" value={stats?.losses ?? 0} color="#dc2626" />
            <StatColumn label="E" value={stats?.draws ?? 0} color="#ca8a04" />
            <StatColumn label="ELO" value={stats?.elo ?? 0} color="#d97706" />
          </View>

          <View style={styles.winRateRow}>
            <Text style={styles.winRateLabel}>% victorias</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${winRate}%` }]} />
            </View>
            <Text style={styles.winRateValue}>{winRate}%</Text>
          </View>

          <View style={styles.infoList}>
            <Text style={styles.infoText}>
              Ball: {[request.size, request.surface].filter(Boolean).join(' · ') || 'A coordinar'}
            </Text>
            <Text style={styles.infoText}>
              Run: {(stats?.matches_played ?? 0).toLocaleString('es-CL')} partidos jugados
            </Text>
            {(stats?.win_streak ?? 0) > 0 ? (
              <Text style={styles.infoText}>Racha de {stats?.win_streak} victorias</Text>
            ) : null}
          </View>
        </View>

        {publicProfile?.bio || instagramHandle ? (
          <SectionCard>
            {publicProfile?.bio ? (
              <>
                <Text style={styles.sectionTitle}>Sobre el equipo</Text>
                <Text style={styles.bodyText}>{publicProfile.bio}</Text>
              </>
            ) : null}
            {instagramHandle ? (
              <TouchableOpacity
                style={styles.instagramLink}
                onPress={() => Linking.openURL(`https://instagram.com/${instagramHandle}`)}
              >
                <Ionicons name="logo-instagram" size={18} color="#2563eb" />
                <Text style={styles.instagramText}>@{instagramHandle}</Text>
              </TouchableOpacity>
            ) : null}
          </SectionCard>
        ) : null}

        <SectionCard>
          <Text style={styles.requestTitle}>{request.title}</Text>
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
          <Text
            style={[
              styles.expirationText,
              isExpiringSoon(request.expires_at) && styles.expirationSoon,
            ]}
          >
            {isExpiringSoon(request.expires_at) ? 'Expira pronto. ' : ''}
            Anuncio valido hasta {formatDate(request.expires_at)}
          </Text>
        </SectionCard>

        {isOwnRequest ? (
          <SectionCard>
            <View style={styles.responsesHeader}>
              <Text style={styles.sectionTitle}>Equipos interesados</Text>
              {responses.length > 0 ? (
                <View style={styles.responsesCount}>
                  <Text style={styles.responsesCountText}>{responses.length}</Text>
                </View>
              ) : null}
            </View>
            {responses.length === 0 ? (
              <Text style={styles.emptyHint}>Aun no hay equipos interesados</Text>
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
          </SectionCard>
        ) : null}
      </ScrollView>

      {canPropose ? (
        <View style={styles.bottomBar}>
          {myResponse ? (
            <>
              <View style={styles.alreadyBadge}>
                <Text style={styles.alreadyText}>
                  Ya propusiste un partido: {RESPONSE_META[myResponse.status].label}
                </Text>
              </View>
              <TouchableOpacity style={[styles.submitButton, styles.submitButtonDisabled]} disabled>
                <Text style={styles.submitText}>Propuesta enviada</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={() => setShowProposeModal(true)}>
              <Text style={styles.submitText}>Proponer partido -&gt;</Text>
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
        <Text style={styles.responseProposal}>
          Fecha propuesta:{' '}
          {[response.proposed_date, response.proposed_time].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
      {response.status === 'pending' ? (
        <View style={styles.responseActions}>
          <TouchableOpacity
            style={[styles.acceptButton, disabled && styles.actionDisabled]}
            onPress={onAccept}
            disabled={disabled}
          >
            <Text style={styles.acceptButtonText}>Aceptar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rejectButton, disabled && styles.actionDisabled]}
            onPress={onReject}
            disabled={disabled}
          >
            <Text style={styles.rejectButtonText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#f3f4f6', flex: 1 },
  scrollContent: { paddingBottom: 112 },
  centeredScreen: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    backgroundColor: '#0a3d1f',
    height: 220,
    paddingTop: 50,
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    left: 14,
    position: 'absolute',
    top: 48,
    width: 40,
  },
  heroContent: { alignItems: 'center', paddingHorizontal: 24 },
  logo: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderColor: '#f59e0b',
    borderRadius: 36,
    borderWidth: 3,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  logoText: { color: '#ffffff', fontSize: 28, fontWeight: '900' },
  teamName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  heroMuted: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  heroSubtle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  levelBadge: { borderRadius: 999, marginTop: 8, paddingHorizontal: 12, paddingVertical: 6 },
  levelText: { fontSize: 12, fontWeight: '800' },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 4,
    marginHorizontal: 16,
    marginTop: -30,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  statsRow: { flexDirection: 'row' },
  statColumn: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#6b7280', fontSize: 11, fontWeight: '800' },
  winRateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  winRateLabel: { color: '#6b7280', fontSize: 12, fontWeight: '700' },
  progressTrack: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: '#16a34a', height: 8 },
  winRateValue: { color: '#16a34a', fontSize: 13, fontWeight: '900' },
  infoList: { gap: 6, marginTop: 16 },
  infoText: { color: '#4b5563', fontSize: 13, fontWeight: '600' },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
  },
  sectionTitle: { color: '#111827', fontSize: 16, fontWeight: '900', marginBottom: 8 },
  bodyText: { color: '#4b5563', fontSize: 14, lineHeight: 22 },
  instagramLink: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 12 },
  instagramText: { color: '#2563eb', fontSize: 14, fontWeight: '800' },
  requestTitle: { color: '#111827', fontSize: 18, fontWeight: '900', marginBottom: 8 },
  separator: { backgroundColor: '#e5e7eb', height: 1, marginVertical: 14 },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: { color: '#6b7280', fontSize: 13, fontWeight: '700' },
  detailValue: { color: '#111827', flex: 1, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  expirationText: { color: '#6b7280', fontSize: 13, fontWeight: '700', marginTop: 12 },
  expirationSoon: { color: '#dc2626' },
  responsesHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  responsesCount: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  responsesCountText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  emptyTitle: { color: '#111827', fontSize: 18, fontWeight: '900', marginTop: 12 },
  emptyHint: { color: '#6b7280', fontSize: 14, paddingVertical: 18, textAlign: 'center' },
  primaryButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  responseCard: { backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 8, padding: 14 },
  responseHeader: { alignItems: 'center', flexDirection: 'row' },
  responseAvatar: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 10,
    width: 40,
  },
  responseAvatarText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  responseBody: { flex: 1 },
  responseTeam: { color: '#111827', fontSize: 14, fontWeight: '900' },
  responseDate: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  responseStatus: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  responseStatusText: { fontSize: 11, fontWeight: '900' },
  responseMessage: {
    color: '#6b7280',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
    marginTop: 10,
  },
  responseProposal: { color: '#4b5563', fontSize: 13, fontWeight: '700', marginTop: 8 },
  responseActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  acceptButton: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 10,
    flex: 1,
    paddingVertical: 10,
  },
  acceptButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  rejectButton: {
    alignItems: 'center',
    borderColor: '#dc2626',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  rejectButtonText: { color: '#dc2626', fontSize: 13, fontWeight: '900' },
  actionDisabled: { opacity: 0.6 },
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopColor: '#e5e7eb',
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: 16,
    position: 'absolute',
    right: 0,
  },
  alreadyBadge: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
  },
  alreadyText: { color: '#4b5563', fontSize: 13, fontWeight: '800' },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
});
