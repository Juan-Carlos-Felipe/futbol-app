// ✅ REDISEÑADO con theme.ts
import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { type Href, useRouter, Stack } from 'expo-router';
import { useMyMatches, useCreateMatch, Match, MatchStatus } from '@/hooks/useMatch';
import { useMyTeams } from '@/hooks/useTeams';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { SectionHeader } from '@/components/ui/SectionHeader';

const STATUS_LABELS: Record<MatchStatus, string> = {
  seeking_opponent: 'Buscando rival',
  confirmed: 'Confirmado',
  played: 'Jugado',
  cancelled: 'Cancelado',
};

export default function MatchesScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: matches, isLoading } = useMyMatches();
  const { data: teams } = useMyTeams();
  const createMatch = useCreateMatch();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [resultMatchIds, setResultMatchIds] = useState<Set<string>>(new Set());

  const captainTeamIds = useMemo(() => {
    const ids = new Set<string>();
    if (!userId) return ids;

    teams?.forEach((row) => {
      const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;
      if (team?.created_by === userId) {
        ids.add(row.team_id);
      }
    });

    return ids;
  }, [teams, userId]);

  useEffect(() => {
    if (!matches?.length) {
      setResultMatchIds(new Set());
      return;
    }

    const loadResults = async () => {
      const { data } = await supabase
        .from('match_results')
        .select('match_id')
        .in(
          'match_id',
          matches.map((match) => match.id)
        )
        .returns<Array<{ match_id: string }>>();

      setResultMatchIds(new Set((data ?? []).map((row) => row.match_id)));
    };

    loadResults();
  }, [matches]);

  async function handleCreate() {
    if (!selectedTeamId) return Alert.alert('Selecciona un equipo');
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    try {
      const match = await createMatch.mutateAsync({
        teamId: selectedTeamId,
        scheduledAt,
        location,
      });
      setShowCreate(false);
      setLocation('');
      router.push(`/match/${match.id}` as Href);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear');
    }
  }

  function renderItem({ item }: { item: Match }) {
    const alreadyHasResult = resultMatchIds.has(item.id);
    const hasAwayTeam = item.away_team_id !== null;
    const alreadyOccurred = new Date(item.scheduled_at).getTime() < Date.now();
    const canRegisterResult =
      alreadyOccurred &&
      hasAwayTeam &&
      captainTeamIds.has(item.home_team_id) &&
      !alreadyHasResult;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/match/${item.id}` as Href)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.date}>
            {new Date(item.scheduled_at).toLocaleDateString('es-CL', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <Text style={styles.status}>{STATUS_LABELS[item.status]}</Text>
        </View>
        {item.location ? (
          <Text style={styles.location}>{item.location}</Text>
        ) : null}
        {canRegisterResult ? (
          <TouchableOpacity
            style={styles.resultBtn}
            onPress={() =>
              router.push({
                pathname: '/partido/resultado/[matchId]',
                params: {
                  matchId: item.id,
                  teamHomeId: item.home_team_id,
                  teamAwayId: item.away_team_id ?? '',
                },
              })
            }
          >
            <Text style={styles.resultBtnText}>Registrar resultado</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'PARTIDOS',
        headerStyle: { backgroundColor: theme.colors.primaryDark },
        headerTitleStyle: { fontFamily: theme.fonts.bebas, color: theme.colors.white },
        headerShown: true
      }} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <SectionHeader title="Mis Partidos" />
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (!teams?.length) {
                return Alert.alert('Sin equipos', 'Crea o únete a un equipo primero.');
              }
              setSelectedTeamId((teams[0] as { team_id: string }).team_id);
              setShowCreate(true);
            }}
          >
            <Text style={styles.addBtnText}>+ Crear</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🗓️</Text>
                <Text style={styles.emptyText}>No hay partidos aún</Text>
                <Text style={styles.emptyHint}>
                  Pulsa + Crear para programar un partido y convocar a tu equipo
                </Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nuevo partido</Text>
            <Text style={styles.modalLabel}>Equipo local</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
              {teams?.map((row) => {
                const team = (Array.isArray(row.teams) ? row.teams[0] : row.teams) as { id: string; name: string };
                const tid = row.team_id;
                return (
                  <TouchableOpacity
                    key={tid}
                    style={[
                      styles.teamChip,
                      selectedTeamId === tid && styles.teamChipActive,
                    ]}
                    onPress={() => setSelectedTeamId(tid)}
                  >
                    <Text style={[styles.teamChipText, selectedTeamId === tid && {color: theme.colors.white}]}>{team?.name ?? 'Equipo'}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Lugar (opcional)"
              placeholderTextColor={theme.colors.gray}
              value={location}
              onChangeText={setLocation}
            />
            <Text style={styles.modalHint}>Fecha: mañana a la misma hora</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleCreate}
              disabled={createMatch.isPending}
            >
              <Text style={styles.createBtnText}>
                {createMatch.isPending ? 'Creando...' : 'Crear partido'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  content: { flex: 1, paddingHorizontal: 24 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: theme.colors.white, fontFamily: theme.fonts.dmSansBold },
  list: { paddingBottom: 24, flexGrow: 1 },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 12,
    ...theme.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { color: theme.colors.dark, fontSize: 16, fontFamily: theme.fonts.dmSansBold },
  status: { color: theme.colors.primary, fontSize: 12, fontFamily: theme.fonts.dmSansBold },
  location: { color: theme.colors.gray, marginTop: 8, fontSize: 14, fontFamily: theme.fonts.dmSans },
  resultBtn: {
    alignSelf: 'flex-start',
    borderColor: theme.colors.primary,
    borderRadius: 999,
    borderWidth: 1.5,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  resultBtnText: { color: theme.colors.primary, fontSize: 12, fontFamily: theme.fonts.dmSansBold },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: theme.colors.dark, fontSize: 18, fontFamily: theme.fonts.dmSansBold },
  emptyHint: { color: theme.colors.gray, marginTop: 4, textAlign: 'center', paddingHorizontal: 24, fontFamily: theme.fonts.dmSans },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { color: theme.colors.dark, fontSize: 18, fontFamily: theme.fonts.dmSansBold, marginBottom: 16 },
  modalLabel: { color: theme.colors.gray, fontSize: 12, marginBottom: 8, fontFamily: theme.fonts.dmSansBold },
  teamChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.gray100,
    marginRight: 8,
  },
  teamChipActive: { backgroundColor: theme.colors.primary },
  teamChipText: { color: theme.colors.gray, fontFamily: theme.fonts.dmSansBold },
  input: {
    backgroundColor: theme.colors.gray100,
    color: theme.colors.dark,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    fontFamily: theme.fonts.dmSans,
  },
  modalHint: { color: theme.colors.gray, fontSize: 12, marginBottom: 16, fontFamily: theme.fonts.dmSans },
  createBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  createBtnText: { color: theme.colors.white, fontFamily: theme.fonts.dmSansBold },
  cancel: { color: theme.colors.gray, textAlign: 'center', fontFamily: theme.fonts.dmSansBold },
});
