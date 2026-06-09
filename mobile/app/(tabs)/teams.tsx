import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, Alert, ActivityIndicator
} from 'react-native';
import { useMyTeams, useCreateTeam, useJoinTeam } from '@/hooks/useTeams';
import { useAuth } from '@/hooks/useAuth';

export default function TeamsScreen() {
  const { userId } = useAuth();
  const { data: teams, isLoading } = useMyTeams();
  const createTeam = useCreateTeam();
  const joinTeam = useJoinTeam();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  async function handleCreate() {
    if (!teamName.trim()) return Alert.alert('Ingresa un nombre de equipo');
    try {
      await createTeam.mutateAsync(teamName.trim());
      setTeamName('');
      setShowCreate(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return Alert.alert('Ingresa el código');
    try {
      const team = await joinTeam.mutateAsync(inviteCode.trim());
      Alert.alert('¡Unido!', `Ahora eres parte de ${(team as any).name}`);
      setInviteCode('');
      setShowJoin(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.title}>Mis Equipos</Text>

      {isLoading && <ActivityIndicator color="#22c55e" style={{ marginTop: 40 }} />}

      {teams?.length === 0 && !isLoading && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⚽</Text>
          <Text style={styles.emptyText}>Aún no tienes equipos</Text>
          <Text style={styles.emptyHint}>Crea uno o únete con un código</Text>
        </View>
      )}

      {teams?.map((member) => {
        const team = member.teams as any;
        const isCreator = team.created_by === userId;

        return (
          <View key={member.team_id} style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <Text style={styles.teamName}>{team.name}</Text>
              {isCreator && <Text style={styles.badge}>Capitán</Text>}
            </View>

            <View style={styles.teamStats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{member.games_played}</Text>
                <Text style={styles.statLabel}>Partidos</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: '#f59e0b' }]}> 
                  {member.streak} 🔥
                </Text>
                <Text style={styles.statLabel}>Racha</Text>
              </View>
            </View>

            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Código de invitación:</Text>
              <Text style={styles.codeValue}>{team.invite_code}</Text>
            </View>
          </View>
        );
      })}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.createBtnText}>+ Crear equipo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.joinBtn} onPress={() => setShowJoin(true)}>
          <Text style={styles.joinBtnText}>Unirse con código</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Crear equipo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del equipo"
              placeholderTextColor="#666"
              value={teamName}
              onChangeText={setTeamName}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.createBtn, { marginBottom: 10 }]}
              onPress={handleCreate}
              disabled={createTeam.isPending}
            >
              <Text style={styles.createBtnText}>
                {createTeam.isPending ? 'Creando...' : 'Crear'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showJoin} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Unirse a un equipo</Text>
            <TextInput
              style={styles.input}
              placeholder="Código de invitación"
              placeholderTextColor="#666"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.createBtn, { marginBottom: 10 }]}
              onPress={handleJoin}
              disabled={joinTeam.isPending}
            >
              <Text style={styles.createBtnText}>
                {joinTeam.isPending ? 'Uniéndose...' : 'Unirse'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowJoin(false)}>
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 24 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptyHint: { color: '#888', marginTop: 4 },
  teamCard: {
    backgroundColor: '#1a1d27', borderRadius: 16, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#2a2d3a'
  },
  teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  teamName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  badge: {
    backgroundColor: '#22c55e22', color: '#22c55e',
    fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20
  },
  teamStats: { flexDirection: 'row', marginBottom: 16, gap: 24 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0f1117', borderRadius: 10, padding: 12 },
  codeLabel: { color: '#888', fontSize: 12 },
  codeValue: { color: '#22c55e', fontWeight: '800', fontSize: 16, letterSpacing: 2 },
  actions: { gap: 12, marginTop: 8 },
  createBtn: { backgroundColor: '#22c55e', borderRadius: 12, padding: 16, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  joinBtn: { borderWidth: 1, borderColor: '#22c55e', borderRadius: 12, padding: 16, alignItems: 'center' },
  joinBtnText: { color: '#22c55e', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1a1d27', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 20 },
  input: {
    backgroundColor: '#0f1117', color: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#2a2d3a'
  },
  cancel: { color: '#888', textAlign: 'center', fontSize: 14 },
});
