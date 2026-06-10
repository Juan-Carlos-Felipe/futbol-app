import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useTeamMatchHistory,
  useTeamMembers,
  useTeamProfile,
  useTeamRecentForm,
} from '@/hooks/useMatchmaking';
import type { TeamMatchHistoryItem, TeamStats } from '@/lib/matchmaking';
import { supabase } from '@/lib/supabase';

const RESULT_META = {
  win: { label: 'G', color: '#16a34a', backgroundColor: '#dcfce7' },
  draw: { label: 'E', color: '#ca8a04', backgroundColor: '#fef3c7' },
  loss: { label: 'P', color: '#dc2626', backgroundColor: '#fee2e2' },
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'E';
}

function emptyStats(teamId: string): TeamStats {
  return {
    id: 'empty',
    team_id: teamId,
    matches_played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    win_streak: 0,
    best_streak: 0,
    elo: 0,
    updated_at: new Date(0).toISOString(),
  };
}

function normalizeInstagram(value: string) {
  const handle = value.replace('https://instagram.com/', '').replace('@', '').trim();
  return {
    handle,
    url: value.startsWith('http') ? value : `https://instagram.com/${handle}`,
  };
}

function getMatchResult(match: TeamMatchHistoryItem, teamId: string) {
  const isHome = match.team_home_id === teamId;
  const myGoals = isHome ? match.goals_home : match.goals_away;
  const theirGoals = isHome ? match.goals_away : match.goals_home;
  if (myGoals > theirGoals) return 'win';
  if (myGoals < theirGoals) return 'loss';
  return 'draw';
}

export default function TeamPublicProfileScreen() {
  const router = useRouter();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const normalizedTeamId = typeof teamId === 'string' ? teamId : null;
  const { profile, isLoading } = useTeamProfile(normalizedTeamId);
  const { form } = useTeamRecentForm(normalizedTeamId);
  const { members } = useTeamMembers(normalizedTeamId);
  const { matches } = useTeamMatchHistory(normalizedTeamId);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [captainId, setCaptainId] = useState<string | null>(null);

  useEffect(() => {
    const fetchViewerTeam = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.user.id)
        .limit(1)
        .maybeSingle<{ team_id: string }>();

      setActiveTeamId(data?.team_id ?? null);
    };

    fetchViewerTeam();
  }, []);

  useEffect(() => {
    if (!normalizedTeamId) return;

    const fetchCaptain = async () => {
      const { data } = await supabase
        .from('teams')
        .select('created_by')
        .eq('id', normalizedTeamId)
        .limit(1)
        .maybeSingle<{ created_by: string | null }>();

      setCaptainId(data?.created_by ?? null);
    };

    fetchCaptain();
  }, [normalizedTeamId]);

  const stats = useMemo(
    () => profile?.stats ?? emptyStats(normalizedTeamId ?? ''),
    [normalizedTeamId, profile?.stats]
  );
  const isOwnTeam = activeTeamId !== null && activeTeamId === normalizedTeamId;

  if (isLoading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator color="#16a34a" size="large" />
      </View>
    );
  }

  if (!profile || !normalizedTeamId) {
    return (
      <View style={styles.centeredScreen}>
        <Ionicons name="lock-closed-outline" size={52} color="#9ca3af" />
        <Text style={styles.emptyTitle}>Perfil no disponible</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const publicProfile = profile.profile;
  const instagram = publicProfile?.social_instagram
    ? normalizeInstagram(publicProfile.social_instagram)
    : null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          {publicProfile?.banner_url ? (
            <ImageBackground source={{ uri: publicProfile.banner_url }} style={styles.heroImage}>
              <View style={styles.heroOverlay} />
            </ImageBackground>
          ) : null}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>{getInitial(profile.name)}</Text>
            </View>
            <Text style={styles.teamName}>{profile.name}</Text>
            {publicProfile?.home_zone ? (
              <Text style={styles.heroMuted}>{publicProfile.home_zone}</Text>
            ) : null}
            {publicProfile?.founded_year ? (
              <Text style={styles.heroSubtle}>
                Fundado en {publicProfile.founded_year.toLocaleString('es-CL')}
              </Text>
            ) : null}
            <View style={styles.eloBadge}>
              <Text style={styles.eloBadgeText}>⚡ {stats.elo.toLocaleString('es-CL')} ELO</Text>
            </View>
            {instagram ? (
              <TouchableOpacity
                style={styles.instagramHero}
                onPress={() => Linking.openURL(instagram.url)}
              >
                <Ionicons name="logo-instagram" size={16} color="#ffffff" />
                <Text style={styles.instagramHeroText}>@{instagram.handle}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <StatCell label="Partidos jugados" value={stats.matches_played} color="#111827" />
            <StatCell label="Victorias" value={stats.wins} color="#16a34a" bordered />
            <StatCell label="Derrotas" value={stats.losses} color="#dc2626" bordered />
            <StatCell label="Empates" value={stats.draws} color="#ca8a04" />
            <StatCell label="Goles a favor" value={stats.goals_for} color="#16a34a" bordered />
            <StatCell
              label="Goles en contra"
              value={stats.goals_against}
              color="#dc2626"
              bordered
            />
          </View>

          {form.length > 0 ? (
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Forma reciente:</Text>
              {form.map((result, index) => {
                const meta = RESULT_META[result];
                return (
                  <View
                    key={`${result}-${index}`}
                    style={[styles.formDot, { backgroundColor: meta.backgroundColor }]}
                  >
                    <Text style={[styles.formDotText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>

        {publicProfile?.bio ? (
          <Section>
            <Text style={styles.sectionTitle}>Sobre nosotros</Text>
            <Text style={styles.bio}>{publicProfile.bio}</Text>
          </Section>
        ) : null}

        <View style={styles.chipsWrap}>
          {[publicProfile?.preferred_size, publicProfile?.preferred_surface, publicProfile?.home_zone]
            .filter((value): value is string => Boolean(value))
            .map((value) => (
              <View key={value} style={styles.preferenceChip}>
                <Text style={styles.preferenceChipText}>{value}</Text>
              </View>
            ))}
        </View>

        <Section>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Jugadores</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {members.length.toLocaleString('es-CL')} jugadores
              </Text>
            </View>
          </View>
          {members.map((member) => {
            const isCaptain = member.role === 'captain' || member.user_id === captainId;
            return (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{getInitial(member.display_name)}</Text>
                </View>
                <View style={styles.memberBody}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.display_name}</Text>
                    {isCaptain ? <Text style={styles.captainBadge}>⭐ Capitan</Text> : null}
                  </View>
                  <Text style={styles.memberStats}>
                    {member.matches_played.toLocaleString('es-CL')}pj ·{' '}
                    {member.wins.toLocaleString('es-CL')}g · ELO{' '}
                    {member.elo.toLocaleString('es-CL')}
                  </Text>
                </View>
              </View>
            );
          })}
        </Section>

        <Section>
          <Text style={styles.sectionTitle}>Ultimos partidos</Text>
          {matches.length === 0 ? (
            <Text style={styles.emptyHint}>Sin partidos registrados aun</Text>
          ) : (
            matches.map((match) => (
              <MatchRow key={match.id} match={match} teamId={normalizedTeamId} />
            ))
          )}
        </Section>

        <View style={styles.ctaWrap}>
          {isOwnTeam ? (
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => router.push('/equipo/editar' as Href)}
            >
              <Text style={styles.outlineButtonText}>✏️ Editar perfil publico</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() =>
                router.push({ pathname: '/matchmaking', params: { teamId: normalizedTeamId } })
              }
            >
              <Text style={styles.ctaButtonText}>⚽ Proponer partido</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

function StatCell({
  label,
  value,
  color,
  bordered = false,
}: {
  label: string;
  value: number;
  color: string;
  bordered?: boolean;
}) {
  return (
    <View style={[styles.statCell, bordered && styles.statCellBorder]}>
      <Text style={[styles.statNumber, { color }]}>{value.toLocaleString('es-CL')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MatchRow({ match, teamId }: { match: TeamMatchHistoryItem; teamId: string }) {
  const result = getMatchResult(match, teamId);
  const meta = RESULT_META[result];
  const isHome = match.team_home_id === teamId;
  const rival = isHome ? match.away_name : match.home_name;

  return (
    <View style={styles.matchRow}>
      <View style={styles.matchBody}>
        <Text style={styles.matchRival}>vs {rival}</Text>
        <Text style={styles.matchDate}>
          hace {formatDistanceToNow(new Date(match.confirmed_at), { locale: es })}
        </Text>
      </View>
      <Text style={styles.matchScore}>
        {match.goals_home.toLocaleString('es-CL')} - {match.goals_away.toLocaleString('es-CL')}
      </Text>
      <View style={[styles.resultBadge, { backgroundColor: meta.backgroundColor }]}>
        <Text style={[styles.resultBadgeText, { color: meta.color }]}>{meta.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#f3f4f6', flex: 1 },
  scrollContent: { paddingBottom: 32 },
  centeredScreen: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  hero: { backgroundColor: '#0a3d1f', height: 240, overflow: 'hidden', paddingTop: 50 },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    left: 12,
    position: 'absolute',
    top: 48,
    width: 40,
    zIndex: 2,
  },
  heroContent: { alignItems: 'center', paddingHorizontal: 24, zIndex: 1 },
  logo: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderColor: '#f59e0b',
    borderRadius: 40,
    borderWidth: 3,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  logoText: { color: '#ffffff', fontSize: 30, fontWeight: '900' },
  teamName: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  heroMuted: { color: '#d1d5db', fontSize: 13, marginTop: 2 },
  heroSubtle: { color: '#d1d5db', fontSize: 12, marginTop: 2 },
  eloBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  eloBadgeText: { color: '#78350f', fontSize: 13, fontWeight: '900' },
  instagramHero: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 8 },
  instagramHeroText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 4,
    marginHorizontal: 16,
    marginTop: -40,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCell: { alignItems: 'center', paddingVertical: 10, width: '33.333%' },
  statCellBorder: { borderLeftColor: '#e5e7eb', borderLeftWidth: 1 },
  statNumber: { fontSize: 28, fontWeight: '900' },
  statLabel: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  formRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 12 },
  formLabel: { color: '#6b7280', fontSize: 13, fontWeight: '800' },
  formDot: {
    alignItems: 'center',
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  formDotText: { fontSize: 11, fontWeight: '900' },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: { color: '#111827', fontSize: 16, fontWeight: '900', marginBottom: 8 },
  bio: { color: '#4b5563', fontSize: 14, lineHeight: 22 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  preferenceChip: { backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  preferenceChipText: { color: '#374151', fontSize: 13, fontWeight: '800' },
  countBadge: { backgroundColor: '#dcfce7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  countBadgeText: { color: '#166534', fontSize: 12, fontWeight: '900' },
  memberRow: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingVertical: 8 },
  memberAvatar: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  memberAvatarText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  memberBody: { flex: 1 },
  memberNameRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  memberName: { color: '#111827', flexShrink: 1, fontSize: 14, fontWeight: '900' },
  captainBadge: { color: '#92400e', fontSize: 11, fontWeight: '900' },
  memberStats: { color: '#6b7280', fontSize: 12, fontWeight: '700', marginTop: 3 },
  emptyTitle: { color: '#111827', fontSize: 18, fontWeight: '900', marginTop: 12 },
  emptyHint: { color: '#6b7280', fontSize: 14 },
  primaryButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  matchRow: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 10 },
  matchBody: { flex: 1 },
  matchRival: { color: '#111827', fontSize: 14, fontWeight: '900' },
  matchDate: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  matchScore: { color: '#111827', fontSize: 20, fontWeight: '900' },
  resultBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  resultBadgeText: { fontSize: 12, fontWeight: '900' },
  ctaWrap: { paddingHorizontal: 16, paddingTop: 16 },
  ctaButton: { alignItems: 'center', backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16 },
  ctaButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  outlineButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#16a34a',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 16,
  },
  outlineButtonText: { color: '#16a34a', fontSize: 16, fontWeight: '900' },
});
