// ✅ REDISEÑADO con theme.ts
import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter, Stack } from 'expo-router';
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
import { theme } from '@/lib/theme';
import { SectionHeader } from '@/components/ui/SectionHeader';

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
        color: theme.colors.gray,
        backgroundColor: theme.colors.gray100,
        borderColor: 'transparent',
      };
    }

    if (homeGoals > awayGoals) {
      return {
        title: 'VICTORIA 🏆',
        color: theme.colors.win,
        backgroundColor: '#dcfce7',
        borderColor: theme.colors.win,
      };
    }

    if (homeGoals < awayGoals) {
      return {
        title: 'DERROTA 😤',
        color: theme.colors.loss,
        backgroundColor: '#fee2e2',
        borderColor: theme.colors.loss,
      };
    }

    return {
      title: 'EMPATE 🤝',
      color: theme.colors.draw,
      backgroundColor: '#fef3c7',
      borderColor: theme.colors.draw,
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
      `¿Seguro que el resultado fue ${homeGoals} - ${awayGoals}?`,
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
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!isAllowed) {
    return (
      <View style={styles.centeredScreen}>
        <Ionicons name="lock-closed-outline" size={52} color={theme.colors.gray100} />
        <Text style={styles.emptyTitle}>Solo el capitán puede registrar el resultado</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'RESULTADO',
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>REGISTRAR RESULTADO</Text>
          <Text style={styles.headerSubtitle}>
            {homeTeam?.name.toUpperCase() ?? 'LOCAL'} VS {awayTeam?.name.toUpperCase() ?? 'RIVAL'}
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

            <View style={styles.steppersContainer}>
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
            El resultado actualizará automáticamente las estadísticas de ambos equipos y el
            ranking ELO.
          </Text>
        </View>

        <View style={styles.scorersCard}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <SectionHeader title="¿Agregar Goleadores?" />
              <Text style={styles.helperText}>Opcional, solo jugadores confirmados.</Text>
            </View>
            <Switch
              value={addScorers}
              onValueChange={setAddScorers}
              trackColor={{ false: theme.colors.gray100, true: '#bbf7d0' }}
              thumbColor={addScorers ? theme.colors.primary : theme.colors.white}
            />
          </View>

          {addScorers ? (
            players.length === 0 ? (
              <Text style={styles.noPlayersText}>No hay jugadores confirmados para este partido.</Text>
            ) : (
              <View style={styles.playersList}>
                {players.map((player) => (
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
                ))}
              </View>
            )
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, !canSubmit && styles.confirmButtonDisabled]}
          onPress={confirmResult}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.confirmButtonText}>CONFIRMAR RESULTADO</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
        {team?.name.toUpperCase() ?? 'EQUIPO'}
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
        <Ionicons name="remove" size={20} color={theme.colors.white} />
      </TouchableOpacity>
      <View style={styles.stepValueContainer}>
         <Text style={styles.stepValue}>{Math.min(value, max)}</Text>
      </View>
      <TouchableOpacity style={[styles.stepButton, styles.plusButton]} onPress={onPlus}>
        <Ionicons name="add" size={20} color={theme.colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  scrollContent: { paddingBottom: 40 },
  centeredScreen: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { color: theme.colors.white, fontSize: 32, fontFamily: theme.fonts.bebas },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: theme.fonts.dmSansBold, marginTop: 4 },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -30,
    padding: 20,
    ...theme.shadow.sm,
  },
  teamColumn: { alignItems: 'center', flex: 1 },
  teamAvatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  awayAvatar: { backgroundColor: theme.colors.gray },
  teamAvatarText: { color: theme.colors.white, fontSize: 20, fontFamily: theme.fonts.bebas },
  teamName: {
    color: theme.colors.dark,
    fontSize: 14,
    fontFamily: theme.fonts.bebas,
    marginTop: 8,
    minHeight: 20,
    textAlign: 'center',
  },
  teamBadge: { backgroundColor: theme.colors.gray100, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginTop: 4 },
  teamBadgeText: { color: theme.colors.gray, fontSize: 10, fontFamily: theme.fonts.dmSansBold },
  scoreColumn: { alignItems: 'center', flex: 1.2 },
  scoreInputRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 12 },
  goalInput: {
    fontSize: 48,
    fontFamily: theme.fonts.bebas,
    padding: 0,
    textAlign: 'center',
    width: 60,
  },
  homeGoalInput: { color: theme.colors.win },
  awayGoalInput: { color: theme.colors.loss },
  scoreDash: { color: theme.colors.gray100, fontSize: 32, fontFamily: theme.fonts.bebas, marginHorizontal: 4 },
  steppersContainer: { gap: 8 },
  stepper: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  stepButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  minusButton: { backgroundColor: theme.colors.loss },
  plusButton: { backgroundColor: theme.colors.win },
  stepValueContainer: { minWidth: 20, alignItems: 'center' },
  stepValue: { color: theme.colors.dark, fontSize: 16, fontFamily: theme.fonts.dmSansBold },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginHorizontal: 24,
    marginTop: 24,
    padding: 20,
    alignItems: 'center',
  },
  previewTitle: { fontSize: 24, fontFamily: theme.fonts.bebas, textAlign: 'center' },
  previewText: { color: theme.colors.gray, fontSize: 12, lineHeight: 18, marginTop: 8, textAlign: 'center', fontFamily: theme.fonts.dmSans },
  scorersCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 24,
    padding: 20,
    ...theme.shadow.sm,
  },
  switchRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  switchText: { flex: 1 },
  helperText: { color: theme.colors.gray, fontSize: 12, fontFamily: theme.fonts.dmSans, marginTop: -8, marginBottom: 12 },
  playersList: { marginTop: 12 },
  playerRow: { alignItems: 'center', borderTopColor: theme.colors.gray100, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  playerName: { color: theme.colors.dark, flex: 1, fontSize: 14, fontFamily: theme.fonts.dmSansBold },
  noPlayersText: { color: theme.colors.gray, fontSize: 12, fontFamily: theme.fonts.dmSans, textAlign: 'center', marginTop: 12 },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    marginHorizontal: 24,
    marginTop: 32,
  },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { color: theme.colors.white, fontSize: 16, fontFamily: theme.fonts.dmSansBold },
  emptyTitle: { color: theme.colors.dark, fontSize: 18, fontFamily: theme.fonts.dmSansBold, marginTop: 12, textAlign: 'center' },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  primaryButtonText: { color: theme.colors.white, fontSize: 14, fontFamily: theme.fonts.dmSansBold },
});
