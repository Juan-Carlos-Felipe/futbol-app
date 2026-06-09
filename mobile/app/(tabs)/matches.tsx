import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useMyMatches, useCreateMatch, Match } from '@/hooks/useMatch';
import { useMyTeams } from '@/hooks/useTeams';
import { theme } from '@/lib/theme';
import { ResultBadge } from '@/components/ui/ResultBadge';
import { MatchResultModal } from '@/components/ui/MatchResultModal';

export default function MatchesScreen() {
  const router = useRouter();
  const { data: matches, isLoading } = useMyMatches();
  const { data: teams } = useMyTeams();
  const createMatch = useCreateMatch();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedResult, setSelectedResult] = useState<{ visible: boolean; result: 'win' | 'loss' | 'draw'; score: string }>({
    visible: false,
    result: 'win',
    score: '0 - 0'
  });

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
      router.push(`/match/${match.id}`);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear');
    }
  }

  const filteredMatches = matches?.filter(m => {
    const isPast = new Date(m.scheduled_at) < new Date() || m.status === 'played';
    if (filter === 'upcoming') return !isPast;
    if (filter === 'past') return isPast;
    return true;
  });

  function renderItem({ item }: { item: Match }) {
    const isPast = new Date(item.scheduled_at) < new Date() || item.status === 'played';
    const result = (item.result as any)?.outcome as 'win' | 'loss' | 'draw' | undefined;

    let borderColor = theme.colors.gray200;
    if (item.status === 'played') {
      if (result === 'win') borderColor = theme.colors.win;
      else if (result === 'loss') borderColor = theme.colors.loss;
      else if (result === 'draw') borderColor = theme.colors.draw;
    } else if (item.status === 'confirmed') {
      borderColor = theme.colors.gray400;
    }

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: borderColor, borderLeftWidth: 4 }]}
        onPress={() => {
          if (item.status === 'played' && result) {
            setSelectedResult({
              visible: true,
              result: result,
              score: (item.result as any)?.score || '0 - 0'
            });
          } else {
            router.push(`/match/${item.id}`);
          }
        }}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardMain}>
            <Text style={styles.matchTeams}>Mi Equipo vs Rival</Text>
            <Text style={styles.matchDate}>
              {new Date(item.scheduled_at).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.cardRight}>
            {item.status === 'played' ? (
              <View style={styles.scoreContainer}>
                <Text style={[styles.scoreText, result && { color: theme.colors[result] }]}>
                  {(item.result as any)?.score || '0 - 0'}
                </Text>
                {result && <ResultBadge result={result} size="sm" />}
              </View>
            ) : (
              <Text style={styles.pendingStatus}>PENDIENTE</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MIS PARTIDOS</Text>

        <View style={styles.filterRow}>
          {(['upcoming', 'past', 'all'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'upcoming' ? 'Próximos' : f === 'past' ? 'Pasados' : 'Todos'}
              </Text>
            </TouchableOpacity>
          ))}
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
            <Text style={styles.addBtnText}>+ NUEVO</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredMatches}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🗓️</Text>
              <Text style={styles.emptyText}>No hay partidos</Text>
            </View>
          }
        />
      )}

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>NUEVO PARTIDO</Text>
            <Text style={styles.modalLabel}>EQUIPO LOCAL</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                    <Text style={[styles.teamChipText, selectedTeamId === tid && styles.teamChipTextActive]}>
                      {team?.name ?? 'Equipo'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Lugar (opcional)"
              placeholderTextColor={theme.colors.gray400}
              value={location}
              onChangeText={setLocation}
            />
            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleCreate}
              disabled={createMatch.isPending}
            >
              <Text style={styles.createBtnText}>
                {createMatch.isPending ? 'CREANDO...' : 'CREAR PARTIDO'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <MatchResultModal
        visible={selectedResult.visible}
        onClose={() => setSelectedResult(prev => ({ ...prev, visible: false }))}
        result={selectedResult.result}
        score={selectedResult.score}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.gray50 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.colors.white,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 32,
    color: theme.colors.gray900
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.gray100,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: theme.colors.gray600,
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  addBtn: {
    marginLeft: 'auto',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.display,
    fontSize: 14
  },
  list: { padding: 24, paddingTop: 12, flexGrow: 1 },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...theme.shadow.sm,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMain: {
    flex: 1,
  },
  matchTeams: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: theme.colors.gray900
  },
  matchDate: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.gray400,
    marginTop: 4
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreText: {
    fontFamily: theme.fonts.display,
    fontSize: 24,
    color: theme.colors.gray900,
  },
  pendingStatus: {
    fontFamily: theme.fonts.display,
    fontSize: 12,
    color: theme.colors.gray400,
    letterSpacing: 1,
  },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.gray400
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 24,
    color: theme.colors.gray900,
    marginBottom: 20
  },
  modalLabel: {
    fontFamily: theme.fonts.display,
    fontSize: 12,
    color: theme.colors.gray400,
    letterSpacing: 1,
    marginBottom: 8
  },
  teamChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.gray100,
    marginRight: 8,
    marginBottom: 16,
  },
  teamChipActive: { backgroundColor: theme.colors.primary },
  teamChipText: {
    fontFamily: 'DMSans-Bold',
    color: theme.colors.gray600
  },
  teamChipTextActive: { color: theme.colors.white },
  input: {
    backgroundColor: theme.colors.gray100,
    color: theme.colors.gray900,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    fontFamily: theme.fonts.body,
  },
  createBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  createBtnText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.display,
    fontSize: 18
  },
  cancel: {
    color: theme.colors.gray400,
    textAlign: 'center',
    fontFamily: theme.fonts.body
  },
});
