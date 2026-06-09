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
import { useMyMatches, useCreateMatch, Match, MatchStatus } from '@/hooks/useMatch';
import { useMyTeams } from '@/hooks/useTeams';

const STATUS_LABELS: Record<MatchStatus, string> = {
  seeking_opponent: 'Buscando rival',
  confirmed: 'Confirmado',
  played: 'Jugado',
  cancelled: 'Cancelado',
};

export default function MatchesScreen() {
  const router = useRouter();
  const { data: matches, isLoading } = useMyMatches();
  const { data: teams } = useMyTeams();
  const createMatch = useCreateMatch();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [location, setLocation] = useState('');

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

  function renderItem({ item }: { item: Match }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/match/${item.id}`)}
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
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Partidos</Text>
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
        <ActivityIndicator color="#22c55e" style={{ marginTop: 40 }} />
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

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nuevo partido</Text>
            <Text style={styles.modalLabel}>Equipo local</Text>
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
                    <Text style={styles.teamChipText}>{team?.name ?? 'Equipo'}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Lugar (opcional)"
              placeholderTextColor="#666"
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
  container: { flex: 1, backgroundColor: '#0f1117' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  addBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  list: { padding: 24, paddingTop: 8, flexGrow: 1 },
  card: {
    backgroundColor: '#1a1d27',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2d3a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { color: '#fff', fontSize: 16, fontWeight: '700' },
  status: { color: '#22c55e', fontSize: 12, fontWeight: '600' },
  location: { color: '#888', marginTop: 8, fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptyHint: { color: '#888', marginTop: 4, textAlign: 'center', paddingHorizontal: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#1a1d27',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalLabel: { color: '#888', fontSize: 12, marginBottom: 8 },
  teamChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0f1117',
    marginRight: 8,
    marginBottom: 12,
  },
  teamChipActive: { backgroundColor: '#22c55e' },
  teamChipText: { color: '#fff', fontWeight: '600' },
  input: {
    backgroundColor: '#0f1117',
    color: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2d3a',
  },
  modalHint: { color: '#666', fontSize: 12, marginBottom: 16 },
  createBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  createBtnText: { color: '#fff', fontWeight: '700' },
  cancel: { color: '#888', textAlign: 'center' },
});
