// ✅ REDISEÑADO con theme.ts
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useTeamStats } from '@/hooks/useTeamStats';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type ResultWithTeams = {
  id: string;
  match_id: string;
  team_home_id: string;
  team_away_id: string;
  goals_home: number;
  goals_away: number;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
};

type Outcome = 'win' | 'loss' | 'draw';

function getOutcome(result: ResultWithTeams, teamId: string | null): Outcome {
  const isHome = teamId === result.team_home_id;
  const myGoals = isHome ? result.goals_home : result.goals_away;
  const theirGoals = isHome ? result.goals_away : result.goals_home;

  if (myGoals > theirGoals) return 'win';
  if (myGoals < theirGoals) return 'loss';
  return 'draw';
}

export default function ConfirmedResultScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const normalizedMatchId = typeof matchId === 'string' ? matchId : '';
  const [result, setResult] = useState<ResultWithTeams | null>(null);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const scale = useRef(new Animated.Value(0)).current;
  const { stats } = useTeamStats(activeTeamId);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (userId) {
        const { data: membership } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle<{ team_id: string }>();

        if (mounted) setActiveTeamId(membership?.team_id ?? null);
      }

      const { data } = await supabase
        .from('match_results')
        .select(
          `
            id,
            match_id,
            team_home_id,
            team_away_id,
            goals_home,
            goals_away,
            home_team:teams!match_results_team_home_id_fkey (
              name
            ),
            away_team:teams!match_results_team_away_id_fkey (
              name
            )
          `
        )
        .eq('match_id', normalizedMatchId)
        .limit(1)
        .returns<ResultWithTeams[]>();

      if (mounted) setResult(data?.[0] ?? null);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [normalizedMatchId]);

  if (!result) {
    return (
      <View style={[styles.screen, styles.loadingScreen]}>
        <Text style={styles.loadingText}>CARGANDO RESULTADO...</Text>
      </View>
    );
  }

  const outcome = getOutcome(result, activeTeamId);
  const isHome = activeTeamId === result.team_home_id;
  const myTeamName = isHome ? result.home_team?.name : result.away_team?.name;
  const rivalTeamName = isHome ? result.away_team?.name : result.home_team?.name;
  const meta = OUTCOME_META[outcome];

  return (
    <View style={[styles.screen, { backgroundColor: meta.backgroundColor }]}>
      {outcome === 'win' ? <Confetti /> : null}

      <Animated.Text
        style={[
          styles.icon,
          {
            transform: [
              {
                scale: scale.interpolate({
                  inputRange: [0, 0.75, 1],
                  outputRange: [0, 1.2, 1],
                }),
              },
            ],
          },
        ]}
      >
        {meta.icon}
      </Animated.Text>
      <Text style={[styles.title, { color: meta.color }]}>{meta.title}</Text>
      <Text style={styles.score}>
        {result.goals_home} - {result.goals_away}
      </Text>
      <Text style={styles.teams}>
        {myTeamName?.toUpperCase() ?? 'EQUIPO'} VS {rivalTeamName?.toUpperCase() ?? 'RIVAL'}
      </Text>

      {outcome === 'win' ? (
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>ESTADÍSTICAS DEL EQUIPO</Text>
          <View style={styles.statsRow}>
            <Stat label="ELO" value={stats?.elo ?? 0} color={theme.colors.gold} />
            <Stat label="RACHA" value={stats?.win_streak ?? 0} color={theme.colors.win} />
            <Stat label="VICTORIAS" value={stats?.wins ?? 0} color={theme.colors.white} />
          </View>
        </View>
      ) : outcome === 'loss' ? (
        <View style={styles.messageContainer}>
           <Text style={styles.message}>EL PRÓXIMO SERÁ TUYO 💪</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: meta.color }]}
          onPress={() => router.push(meta.primaryHref)}
        >
          <Text style={styles.primaryButtonText}>
            {meta.primaryLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostButton} onPress={() => router.replace('/feed' as Href)}>
          <Text style={styles.ghostButtonText}>IR AL INICIO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Confetti() {
  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      {Array.from({ length: 30 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.confettiPiece,
            {
              backgroundColor: index % 3 === 0 ? theme.colors.primary : index % 3 === 1 ? theme.colors.gold : theme.colors.white,
              left: `${(index * 17) % 100}%`,
              top: `${(index * 31) % 100}%`,
              transform: [{ rotate: `${index * 21}deg` }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const OUTCOME_META: Record<
  Outcome,
  {
    icon: string;
    title: string;
    color: string;
    backgroundColor: string;
    primaryLabel: string;
    primaryHref: Href;
  }
> = {
  win: {
    icon: '🏆',
    title: 'VICTORIA!',
    color: theme.colors.gold,
    backgroundColor: theme.colors.primaryDark,
    primaryLabel: 'VER MI PERFIL',
    primaryHref: '/profile' as Href,
  },
  loss: {
    icon: '😤',
    title: 'DERROTA',
    color: theme.colors.loss,
    backgroundColor: theme.colors.primaryDark,
    primaryLabel: 'VER RANKING',
    primaryHref: '/ranking' as Href,
  },
  draw: {
    icon: '🤝',
    title: 'EMPATE',
    color: theme.colors.draw,
    backgroundColor: theme.colors.primaryDark,
    primaryLabel: 'VER ESTADÍSTICAS',
    primaryHref: '/profile' as Href,
  },
};

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 24,
  },
  loadingScreen: { backgroundColor: theme.colors.primaryDark },
  loadingText: { color: theme.colors.white, fontSize: 16, fontFamily: theme.fonts.bebas },
  confettiLayer: { ...StyleSheet.absoluteFillObject },
  confettiPiece: {
    borderRadius: 2,
    height: 12,
    position: 'absolute',
    width: 6,
    opacity: 0.8,
  },
  icon: { fontSize: 80, marginBottom: 10 },
  title: { fontSize: 60, fontFamily: theme.fonts.bebas, textAlign: 'center' },
  score: { color: theme.colors.white, fontSize: 64, fontFamily: theme.fonts.bebas, marginTop: 8 },
  teams: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontFamily: theme.fonts.bebas,
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 1,
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    marginTop: 40,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsCardTitle: { color: theme.colors.white, fontSize: 12, fontFamily: theme.fonts.dmSansBold, marginBottom: 20, textAlign: 'center', opacity: 0.6 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 32, fontFamily: theme.fonts.bebas },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: theme.fonts.dmSansBold, marginTop: 4 },
  messageContainer: { marginTop: 40, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  message: { color: theme.colors.white, fontSize: 16, fontFamily: theme.fonts.dmSansBold },
  actions: { width: '100%', marginTop: 40, gap: 12 },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 18,
    width: '100%',
  },
  primaryButtonText: { fontSize: 16, fontFamily: theme.fonts.dmSansBold, color: theme.colors.primaryDark },
  ghostButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: theme.fonts.dmSansBold,
  },
});
