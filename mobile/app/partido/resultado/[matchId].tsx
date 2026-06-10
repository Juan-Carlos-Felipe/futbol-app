import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSubmitResult } from '@/hooks/useMatchmaking';
import { supabase } from '@/lib/supabase';
import { updatePlayerGoals } from '@/lib/matchmaking';

type TeamInfo = {
  id: string;
  name: string;
  created_by: string | null;
};

type AcceptedPlayer = {
  userId: string;
  name: string;
};

type Scorer = {
  userId: string;
  goals: number;
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'E';
}

function clampGoal(value: number) {
  return Math.max(0, Math.min(99, value));
}

function parseGoal(value: string) {
  if (!value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : clampGoal(parsed);
}

export default function RegisterResultScreen() {
  const router = useRouter();
  const { matchId, teamHomeId, teamAwayId } = useLocalSearchParams<{
    matchId: string;
    teamHomeId?: string;
    teamAwayId?: string;
  }>();
  const normalizedMatchId = typeof matchId === 'string' ? matchId : '';
  const [homeTeamId, setHomeTeamId] = useState(
    typeof teamHomeId === 'string' ? teamHomeId : ''
  );
  const [awayTeamId, setAwayTeamId] = useState(
    typeof teamAwayId === 'string' ? teamAwayId : ''
  );
  const [homeTeam, setHomeTeam] = useState<TeamInfo | null>(null);
  const [awayTeam, setAwayTeam] = useState<TeamInfo | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [goalsHome, setGoalsHome] = useState('');
  const [goalsAway, setGoalsAway] = useState('');
  const [addScorers, setAddScorers] = useState(false);
  const [players, setPlayers] = useState<AcceptedPlayer[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const { submitResult, isSubmitting } = useSubmitResult();

  const homeGoals = parseGoal(goalsHome);
  const awayGoals = parseGoal(goalsAway);
  const canSubmit = homeGoals !== null && awayGoals !== null && !isSubmitting;

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId || !normalizedMatchId) {
        if (mounted) setIsLoading(false);
        return;
      }

      const { data: resultRows } = await supabase
        .from('match_results')
        .select('id')
        .eq('match_id', normalizedMatchId)
        .limit(1)
        .returns<Array<{ id: string }>>();

      if (resultRows?.[0]) {
        router.replace(`/partido/resultado-confirmado/${normalizedMatchId}` as Href);
        return;
      }

      let currentHomeId = homeTeamId;
      let currentAwayId = awayTeamId;

      if (!currentHomeId || !currentAwayId) {
        const { data: matchRows } = await supabase
          .from('matches')
          .select('home_team_id, away_team_id')
          .eq('id', normalizedMatchId)
          .limit(1)
          .returns<Array<{ home_team_id: string; away_team_id: string | null }>>();

        currentHomeId = currentHomeId || matchRows?.[0]?.home_team_id || '';
        currentAwayId = currentAwayId || matchRows?.[0]?.away_team_id || '';
      }

      if (!currentHomeId || !currentAwayId) {
        if (mounted) {
          setIsLoading(false);
          setIsAllowed(false);
        }
        return;
      }

      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, created_by')
        .in('id', [currentHomeId, currentAwayId])
        .returns<TeamInfo[]>();

      const home = teams?.find((team) => team.id === currentHomeId) ?? null;
      const away = teams?.find((team) => team.id === currentAwayId) ?? null;

      let allowed = home?.created_by === userId;
      const { data: roleRows, error: roleError } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', userId)
        .eq('team_id', currentHomeId)
        .limit(1)
        .returns<Array<{ role: string | null }>>();

      if (!roleError && roleRows?.[0]?.role === 'captain') {
        allowed = true;
      }

      const { data: callRows } = await supabase
        .from('match_calls')
        .select(
          `
            user_id,
            users (
              display_name
            )
          `
        )
        .eq('match_id', normalizedMatchId)
        .eq('response', 'accepted')
        .returns<Array<{ user_id: string; users: { display_name: string } | null }>>();

      if (!mounted) return;

      setHomeTeamId(currentHomeId);
      setAwayTeamId(currentAwayId);
      setHomeTeam(home);
      setAwayTeam(away);
      setIsAllowed(allowed);
      setPlayers(
        (callRows ?? []).map((row) => ({
          userId: row.user_id,
          name: row.users?.display_name ?? 'Jugador',
        }))
      );
      setIsLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [awayTeamId, homeTeamId, normalizedMatchId, router]);

  const preview = useMemo(() => {
    if (homeGoals === null || awayGoals === null) {
      return {
        title: 'MARCADOR PENDIENTE',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        borderColor: '#e5e7eb',
      };
    }

    if (homeGoals > awayGoals) {
      return {
        title: 'VICTORIA 🏆',
        color: '#16a34a',
        backgroundColor: '#f0fdf4',
        borderColor: '#16a34a',
      };
    }

    if (homeGoals < awayGoals) {
      return {
        title: 'DERROTA 😤',
        color: '#dc2626',
        backgroundColor: '#fef2f2',
        borderColor: '#dc2626',
      };
    }

    return {
      title: 'EMPATE 🤝',
      color: '#d97706',
      backgroundColor: '#fffbeb',
      borderColor: '#d97706',
    };
  }, [awayGoals, homeGoals]);

  function setGoal(side: 'home' | 'away', value: number) {
    const next = clampGoal(value).toString();
    if (side === 'home') setGoalsHome(next);
    else setGoalsAway(next);
  }

  function setScorerGoals(userId: string, goals: number) {
    const nextGoals = Math.max(0, Math.min(9, goals));
    setScorers((current) => {
      const withoutPlayer = current.filter((scorer) => scorer.userId !== userId);
      if (nextGoals === 0) return withoutPlayer;
      return [...withoutPlayer, { userId, goals: nextGoals }];
    });
  }

  function getScorerGoals(userId: string) {
    return scorers.find((scorer) => scorer.userId === userId)?.goals ?? 0;
  }

  async function confirmResult() {
    if (!canSubmit) return;

    Alert.alert(
      'Confirmar resultado',
      `Seguro que el resultado fue ${homeGoals} - ${awayGoals}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await submitResult({
                matchId: normalizedMatchId,
                teamHomeId: homeTeamId,
                teamAwayId: awayTeamId,
                goalsHome: homeGoals,
                goalsAway: awayGoals,
              });

              if (scorers.length > 0) {
                await updatePlayerGoals(scorers);
              }

              router.replace(`/partido/resultado-confirmado/${normalizedMatchId}` as Href);
            } catch (error: unknown) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'No se pudo registrar el resultado.'
              );
            }
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator color="#16a34a" size="large" />
      </View>
    );
  }

  if (!isAllowed) {
    return (
      <View style={styles.centeredScreen}>
        <Ionicons name="lock-closed-outline" size={52} color="#9ca3af" />
        <Text style={styles.emptyTitle}>Solo el capitan puede registrar el resultado</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>REGISTRAR RESULTADO</Text>
          <Text style={styles.headerSubtitle}>
            {homeTeam?.name ?? 'Local'} vs {awayTeam?.name ?? 'Rival'}
          </Text>
        </View>

        <View style={styles.scoreCard}>
          <TeamColumn team={homeTeam} badge="LOCAL" variant="home" />

          <View style={styles.scoreColumn}>
            <View style={styles.scoreInputRow}>
              <TextInput
                style={[styles.goalInput, styles.homeGoalInput]}
                keyboardType="numeric"
                maxLength={2}
                value={goalsHome}
                onChangeText={(value) => setGoalsHome(value.replace(/\D/g, ''))}
              />
              <Text style={styles.scoreDash}>-</Text>
              <TextInput
                style={[styles.goalInput, styles.awayGoalInput]}
                keyboardType="numeric"
                maxLength={2}
                value={goalsAway}
                onChangeText={(value) => setGoalsAway(value.replace(/\D/g, ''))}
              />
            </View>

            <Stepper
              value={homeGoals ?? 0}
              onMinus={() => setGoal('home', (homeGoals ?? 0) - 1)}
              onPlus={() => setGoal('home', (homeGoals ?? 0) + 1)}
            />
            <Stepper
              value={awayGoals ?? 0}
              onMinus={() => setGoal('away', (awayGoals ?? 0) - 1)}
              onPlus={() => setGoal('away', (awayGoals ?? 0) + 1)}
            />
          </View>

          <TeamColumn team={awayTeam} badge="VISITANTE" variant="away" />
        </View>

        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: preview.backgroundColor,
              borderColor: preview.borderColor,
            },
          ]}
        >
          <Text style={[styles.previewTitle, { color: preview.color }]}>{preview.title}</Text>
          <Text style={styles.previewText}>
            El resultado actualiza automaticamente las estadisticas de ambos equipos y el
            ranking ELO.
          </Text>
        </View>

        <View style={styles.scorersCard}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.sectionTitle}>Agregar goleadores?</Text>
              <Text style={styles.helperText}>Opcional, solo jugadores confirmados.</Text>
            </View>
            <Switch
              value={addScorers}
              onValueChange={setAddScorers}
              trackColor={{ false: '#d1d5db', true: '#bbf7d0' }}
              thumbColor={addScorers ? '#16a34a' : '#f9fafb'}
            />
          </View>

          {addScorers ? (
            players.length === 0 ? (
              <Text style={styles.helperText}>No hay jugadores confirmados para este partido.</Text>
            ) : (
              players.map((player) => (
                <View key={player.userId} style={styles.playerRow}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Stepper
                    value={getScorerGoals(player.userId)}
                    max={9}
                    onMinus={() =>
                      setScorerGoals(player.userId, getScorerGoals(player.userId) - 1)
                    }
                    onPlus={() =>
                      setScorerGoals(player.userId, getScorerGoals(player.userId) + 1)
                    }
                  />
                </View>
              ))
            )
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmButton, !canSubmit && styles.confirmButtonDisabled]}
          onPress={confirmResult}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar resultado</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TeamColumn({
  team,
  badge,
  variant,
}: {
  team: TeamInfo | null;
  badge: string;
  variant: 'home' | 'away';
}) {
  return (
    <View style={styles.teamColumn}>
      <View style={[styles.teamAvatar, variant === 'away' && styles.awayAvatar]}>
        <Text style={styles.teamAvatarText}>{getInitial(team?.name ?? 'Equipo')}</Text>
      </View>
      <Text style={styles.teamName} numberOfLines={2}>
        {team?.name ?? 'Equipo'}
      </Text>
      <View style={styles.teamBadge}>
        <Text style={styles.teamBadgeText}>{badge}</Text>
      </View>
    </View>
  );
}

function Stepper({
  value,
  max = 99,
  onMinus,
  onPlus,
}: {
  value: number;
  max?: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity style={[styles.stepButton, styles.minusButton]} onPress={onMinus}>
        <Text style={styles.stepButtonText}>-</Text>
      </TouchableOpacity>
      <Text style={styles.stepValue}>{Math.min(value, max).toLocaleString('es-CL')}</Text>
      <TouchableOpacity style={[styles.stepButton, styles.plusButton]} onPress={onPlus}>
        <Text style={styles.stepButtonText}>+</Text>
      </TouchableOpacity>
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
  header: { backgroundColor: '#0a3d1f', height: 160, paddingHorizontal: 16, paddingTop: 50 },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    left: 10,
    position: 'absolute',
    top: 48,
    width: 40,
  },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '900', marginLeft: 36 },
  headerSubtitle: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginLeft: 36, marginTop: 6 },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    elevation: 4,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  teamColumn: { alignItems: 'center', flex: 1 },
  teamAvatar: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  awayAvatar: { backgroundColor: '#6b7280' },
  teamAvatarText: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  teamName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 8,
    minHeight: 36,
    textAlign: 'center',
  },
  teamBadge: { backgroundColor: '#f3f4f6', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  teamBadgeText: { color: '#6b7280', fontSize: 10, fontWeight: '900' },
  scoreColumn: { alignItems: 'center', flex: 1.15, gap: 8 },
  scoreInputRow: { alignItems: 'center', flexDirection: 'row' },
  goalInput: {
    borderBottomColor: '#9ca3af',
    borderBottomWidth: 2,
    fontSize: 52,
    fontWeight: '900',
    padding: 0,
    textAlign: 'center',
    width: 70,
  },
  homeGoalInput: { color: '#16a34a' },
  awayGoalInput: { color: '#dc2626' },
  scoreDash: { color: '#9ca3af', fontSize: 36, fontWeight: '900', marginHorizontal: 4 },
  stepper: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  stepButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  minusButton: { backgroundColor: '#dc2626' },
  plusButton: { backgroundColor: '#16a34a' },
  stepButtonText: { color: '#ffffff', fontSize: 22, fontWeight: '900', lineHeight: 24 },
  stepValue: { color: '#111827', fontSize: 16, fontWeight: '900', minWidth: 18, textAlign: 'center' },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
  },
  previewTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  previewText: { color: '#6b7280', fontSize: 12, lineHeight: 18, marginTop: 8, textAlign: 'center' },
  scorersCard: { backgroundColor: '#ffffff', borderRadius: 16, marginHorizontal: 16, marginTop: 14, padding: 16 },
  switchRow: { alignItems: 'center', flexDirection: 'row' },
  switchText: { flex: 1 },
  sectionTitle: { color: '#111827', fontSize: 16, fontWeight: '900' },
  helperText: { color: '#6b7280', fontSize: 12, lineHeight: 18, marginTop: 4 },
  playerRow: { alignItems: 'center', borderTopColor: '#f3f4f6', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  playerName: { color: '#111827', flex: 1, fontSize: 14, fontWeight: '800' },
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
  confirmButton: { alignItems: 'center', backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16 },
  confirmButtonDisabled: { opacity: 0.55 },
  confirmButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  emptyTitle: { color: '#111827', fontSize: 18, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  primaryButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});
