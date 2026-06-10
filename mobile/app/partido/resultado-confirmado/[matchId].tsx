import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useTeamStats } from '@/hooks/useTeamStats';
import { getEloChange } from '@/lib/elo';
import { supabase } from '@/lib/supabase';

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

type EloChangeRow = {
  elo_before: number;
  elo_after: number;
  change: number;
};

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
  const [eloChange, setEloChange] = useState<EloChangeRow | null>(null);
  const { stats } = useTeamStats(activeTeamId);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      let currentTeamId: string | null = null;

      if (userId) {
        const { data: membership } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle<{ team_id: string }>();

        currentTeamId = membership?.team_id ?? null;
        if (mounted) setActiveTeamId(currentTeamId);
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

      if (currentTeamId) {
        const { data: historyRows } = await supabase
          .from('elo_history')
          .select('elo_before, elo_after, change')
          .eq('match_id', normalizedMatchId)
          .eq('team_id', currentTeamId)
          .limit(1)
          .returns<EloChangeRow[]>();

        if (mounted) setEloChange(historyRows?.[0] ?? null);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [normalizedMatchId]);

  if (!result) {
    return (
      <View style={[styles.screen, styles.winScreen]}>
        <Text style={styles.loadingText}>Cargando resultado...</Text>
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

      <Text style={styles.icon}>{meta.icon}</Text>
      <Text style={[styles.title, { color: meta.color }]}>{meta.title}</Text>
      <Text style={styles.score}>
        {result.goals_home.toLocaleString('es-CL')} -{' '}
        {result.goals_away.toLocaleString('es-CL')}
      </Text>
      <Text style={styles.teams}>
        {myTeamName ?? 'Mi equipo'} vs {rivalTeamName ?? 'Rival'}
      </Text>

      {outcome === 'win' ? (
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>Tu equipo ahora tiene:</Text>
          <View style={styles.statsRow}>
            <Stat label="ELO" value={stats?.elo ?? 0} color="#f59e0b" />
            <Stat label="Racha" value={stats?.win_streak ?? 0} color="#16a34a" />
            <Stat label="Victorias" value={stats?.wins ?? 0} color="#ffffff" />
          </View>
        </View>
      ) : outcome === 'loss' ? (
        <Text style={styles.message}>El proximo sera tuyo 💪</Text>
      ) : null}

      {eloChange ? (
        <View style={styles.eloChangeCard}>
          <Text style={styles.eloChangeTitle}>Tu ELO</Text>
          <Text style={styles.eloChangeText}>
            {eloChange.elo_before.toLocaleString('es-CL')} -&gt;{' '}
            {eloChange.elo_after.toLocaleString('es-CL')}{' '}
            ({getEloChange(eloChange.elo_before, eloChange.elo_after).display})
          </Text>
        </View>
      ) : null}

      <View style={styles.buttonsWrap}>
        <TouchableOpacity
          style={[styles.outlineButton, { borderColor: meta.color }]}
          onPress={() => router.push(meta.primaryHref)}
        >
          <Text style={[styles.outlineButtonText, { color: meta.color }]}>
            {meta.primaryLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/feed' as Href)}>
          <Text style={styles.homeLink}>Ir al inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value.toLocaleString('es-CL')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Confetti() {
  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      {Array.from({ length: 22 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.confettiPiece,
            {
              backgroundColor: index % 3 === 0 ? '#16a34a' : index % 3 === 1 ? '#f59e0b' : '#ffffff',
              left: `${(index * 17) % 100}%`,
              top: `${(index * 31) % 62}%`,
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
    color: '#f59e0b',
    backgroundColor: '#0a3d1f',
    primaryLabel: 'Ver mi perfil ->',
    primaryHref: '/profile' as Href,
  },
  loss: {
    icon: '😤',
    title: 'DERROTA',
    color: '#dc2626',
    backgroundColor: '#1f1f1f',
    primaryLabel: 'Ver ranking',
    primaryHref: '/ranking' as Href,
  },
  draw: {
    icon: '🤝',
    title: 'EMPATE',
    color: '#d97706',
    backgroundColor: '#1a1a0a',
    primaryLabel: 'Ver estadisticas',
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
  winScreen: { backgroundColor: '#0a3d1f' },
  loadingText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  confettiLayer: { ...StyleSheet.absoluteFillObject },
  confettiPiece: {
    borderRadius: 2,
    height: 14,
    position: 'absolute',
    width: 7,
  },
  icon: { fontSize: 80, marginBottom: 10 },
  title: { fontSize: 60, fontWeight: '900', textAlign: 'center' },
  score: { color: '#ffffff', fontSize: 48, fontWeight: '900', marginTop: 8 },
  teams: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#052e16',
    borderRadius: 16,
    marginTop: 28,
    padding: 16,
    width: '100%',
  },
  statsCardTitle: { color: '#ffffff', fontSize: 14, fontWeight: '800', marginBottom: 12 },
  statsRow: { flexDirection: 'row' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '800', marginTop: 3 },
  message: { color: '#9ca3af', fontSize: 16, fontWeight: '800', marginTop: 22 },
  eloChangeCard: {
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 16,
    marginTop: 18,
    padding: 16,
    width: '100%',
  },
  eloChangeTitle: { color: '#78350f', fontSize: 12, fontWeight: '900' },
  eloChangeText: { color: '#78350f', fontSize: 22, fontWeight: '900', marginTop: 4 },
  buttonsWrap: { width: '100%' },
  outlineButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 28,
    paddingHorizontal: 22,
    paddingVertical: 14,
    width: '100%',
  },
  outlineButtonText: { fontSize: 16, fontWeight: '900' },
  homeLink: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 18,
  },
});
