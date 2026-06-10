// ✅ REDISEÑADO con theme.ts
import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter, Stack } from 'expo-router';
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
import { theme } from '@/lib/theme';
import { StatCard } from '@/components/ui/StatCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ResultBadge } from '@/components/ui/ResultBadge';
import { PlayerCard } from '@/components/ui/PlayerCard';

const RESULT_META = {
  win: { label: 'G', color: theme.colors.win, backgroundColor: '#dcfce7' },
  draw: { label: 'E', color: theme.colors.draw, backgroundColor: '#fef3c7' },
  loss: { label: 'P', color: theme.colors.loss, backgroundColor: '#fee2e2' },
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
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!profile || !normalizedTeamId) {
    return (
      <View style={styles.centeredScreen}>
        <Ionicons name="lock-closed-outline" size={52} color={theme.colors.gray100} />
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
       <Stack.Screen options={{
        title: 'PERFIL DE EQUIPO',
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
          {publicProfile?.banner_url ? (
            <ImageBackground source={{ uri: publicProfile.banner_url }} style={styles.heroImage}>
              <View style={styles.heroOverlay} />
            </ImageBackground>
          ) : null}

          <View style={styles.heroContent}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>{getInitial(profile.name)}</Text>
            </View>
            <Text style={styles.teamName}>{profile.name.toUpperCase()}</Text>

            <View style={styles.eloBadge}>
              <Text style={styles.eloBadgeText}>ELO: {stats.elo}</Text>
            </View>

            {publicProfile?.home_zone || publicProfile?.founded_year || instagram ? (
              <View style={styles.heroMetaRow}>
                {publicProfile?.home_zone && (
                   <Text style={styles.heroMuted}>{publicProfile.home_zone.toUpperCase()}</Text>
                )}
                {publicProfile?.founded_year && (
                   <Text style={styles.heroMuted}> • DESDE {publicProfile.founded_year}</Text>
                )}
              </View>
            ) : null}

            {instagram ? (
              <TouchableOpacity
                style={styles.instagramHero}
                onPress={() => Linking.openURL(instagram.url)}
              >
                <Ionicons name="logo-instagram" size={16} color={theme.colors.white} />
                <Text style={styles.instagramHeroText}>@{instagram.handle}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <StatCard label="Jugados" value={stats.matches_played} color={theme.colors.dark} />
            <StatCard label="Victorias" value={stats.wins} color={theme.colors.win} />
            <StatCard label="Derrotas" value={stats.losses} color={theme.colors.loss} />
          </View>

          <View style={styles.formSection}>
             <Text style={styles.formLabel}>FORMA RECIENTE</Text>
             <View style={styles.formRow}>
              {form.length > 0 ? (
                form.map((result, index) => <ResultBadge key={`${result}-${index}`} result={result} />)
              ) : (
                <Text style={styles.emptyHint}>Sin partidos</Text>
              )}
             </View>
          </View>
        </View>

        <View style={{paddingHorizontal: 16}}>
          {publicProfile?.bio ? (
            <View style={styles.section}>
              <SectionHeader title="Sobre Nosotros" />
              <Text style={styles.bio}>{publicProfile.bio}</Text>
            </View>
          ) : null}

          <View style={styles.chipsWrap}>
            {[publicProfile?.preferred_size, publicProfile?.preferred_surface]
              .filter((value): value is string => Boolean(value))
              .map((value) => (
                <View key={value} style={styles.preferenceChip}>
                  <Text style={styles.preferenceChipText}>{value.toUpperCase()}</Text>
                </View>
              ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SectionHeader title="Plantilla" />
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{members.length} JUGADORES</Text>
              </View>
            </View>
            <View style={styles.membersList}>
              {members.map((member) => {
                const isCaptain = member.role === 'captain' || member.user_id === captainId;
                return (
                  <View key={member.id} style={styles.memberItem}>
                    <PlayerCard
                      name={member.display_name}
                      subtitle={`${member.matches_played} pj • ELO ${member.elo}${isCaptain ? ' • CAPITÁN' : ''}`}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Historial de Partidos" />
            {matches.length === 0 ? (
              <Text style={styles.emptyHint}>Aún no hay partidos registrados</Text>
            ) : (
              <View style={styles.matchesList}>
                {matches.map((match) => (
                  <MatchRow key={match.id} match={match} teamId={normalizedTeamId} />
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.ctaWrap}>
          {isOwnTeam ? (
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => router.push('/equipo/editar' as Href)}
            >
              <Text style={styles.outlineButtonText}>EDITAR PERFIL PÚBLICO</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() =>
                router.push({ pathname: '/matchmaking', params: { teamId: normalizedTeamId } })
              }
            >
              <Text style={styles.ctaButtonText}>PROPONER PARTIDO</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function MatchRow({ match, teamId }: { match: TeamMatchHistoryItem; teamId: string }) {
  const result = getMatchResult(match, teamId);
  const isHome = match.team_home_id === teamId;
  const rival = isHome ? match.away_name : match.home_name;

  return (
    <View style={styles.matchRow}>
      <View style={styles.matchBody}>
        <Text style={styles.matchRival}>vs {rival}</Text>
        <Text style={styles.matchDate}>
          {formatDistanceToNow(new Date(match.confirmed_at), { addSuffix: true, locale: es })}
        </Text>
      </View>
      <View style={styles.matchScoreRow}>
        <Text style={styles.matchScore}>
          {match.goals_home} - {match.goals_away}
        </Text>
        <ResultBadge result={result} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.white, flex: 1 },
  scrollContent: { paddingBottom: 40 },
  centeredScreen: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  hero: { backgroundColor: theme.colors.primaryDark, paddingTop: 20, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  heroContent: { alignItems: 'center', paddingHorizontal: 24, zIndex: 1 },
  logo: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.gold,
    borderRadius: 40,
    borderWidth: 3,
    height: 80,
    justifyContent: 'center',
    width: 80,
    marginBottom: 12,
  },
  logoText: { color: theme.colors.white, fontSize: 30, fontFamily: theme.fonts.bebas },
  teamName: {
    color: theme.colors.white,
    fontSize: 32,
    fontFamily: theme.fonts.bebas,
    textAlign: 'center',
  },
  heroMetaRow: { flexDirection: 'row', marginTop: 8 },
  heroMuted: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: theme.fonts.dmSansBold },
  eloBadge: {
    backgroundColor: theme.colors.gold,
    borderRadius: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  eloBadgeText: { color: theme.colors.white, fontSize: 13, fontFamily: theme.fonts.dmSansBold },
  instagramHero: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 12 },
  instagramHeroText: { color: theme.colors.white, fontSize: 13, fontFamily: theme.fonts.dmSansBold },
  statsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: -30,
    padding: 20,
    ...theme.shadow.sm,
  },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  formSection: { marginTop: 20, alignItems: 'center' },
  formLabel: { color: theme.colors.gray, fontSize: 11, fontFamily: theme.fonts.dmSansBold, marginBottom: 8 },
  formRow: { flexDirection: 'row', gap: 8 },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bio: { color: theme.colors.gray, fontSize: 14, lineHeight: 22, fontFamily: theme.fonts.dmSans },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  preferenceChip: { backgroundColor: theme.colors.gray100, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  preferenceChipText: { color: theme.colors.dark, fontSize: 12, fontFamily: theme.fonts.dmSansBold },
  countBadge: { backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  countBadgeText: { color: theme.colors.primary, fontSize: 10, fontFamily: theme.fonts.dmSansBold },
  membersList: { gap: 10 },
  memberItem: { marginBottom: 2 },
  emptyTitle: { color: theme.colors.dark, fontSize: 18, fontFamily: theme.fonts.dmSansBold, marginTop: 12 },
  emptyHint: { color: theme.colors.gray, fontSize: 14, fontFamily: theme.fonts.dmSans },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: theme.colors.white, fontSize: 14, fontFamily: theme.fonts.dmSansBold },
  matchesList: { gap: 12 },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    padding: 16,
    borderRadius: 16,
  },
  matchBody: { flex: 1 },
  matchRival: { color: theme.colors.dark, fontSize: 15, fontFamily: theme.fonts.dmSansBold },
  matchDate: { color: theme.colors.gray, fontSize: 12, marginTop: 2, fontFamily: theme.fonts.dmSans },
  matchScoreRow: { alignItems: 'flex-end', gap: 6 },
  matchScore: { color: theme.colors.dark, fontSize: 18, fontFamily: theme.fonts.bebas },
  ctaWrap: { paddingHorizontal: 24, marginTop: 32 },
  ctaButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 16 },
  ctaButtonText: { color: theme.colors.white, fontSize: 16, fontFamily: theme.fonts.dmSansBold },
  outlineButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 16,
  },
  outlineButtonText: { color: theme.colors.primary, fontSize: 16, fontFamily: theme.fonts.dmSansBold },
});
