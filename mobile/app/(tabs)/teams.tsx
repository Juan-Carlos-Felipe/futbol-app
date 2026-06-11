import { useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, Alert, ActivityIndicator
} from 'react-native';
import { useMyTeams, useCreateTeam, useJoinTeam } from '@/hooks/useTeams';
import { useAuth } from '@/hooks/useAuth';
import { colors, font, radii, shadows, spacing } from '@/lib/theme';

export default function TeamsScreen() {
  const router = useRouter();
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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Club House</Text>
        <Text style={styles.title}>Mis Equipos</Text>
        <Text style={styles.heroSubtitle}>Administra planteles, codigos y ranking de tus clubes.</Text>
      </View>

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

            <TouchableOpacity
              style={styles.rankingBtn}
              onPress={() => router.push('/ranking' as Href)}
            >
              <Text style={styles.rankingBtnText}>Ver ranking -&gt;</Text>
            </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 24,
    padding: spacing.xl,
    ...shadows.card,
  },
  eyebrow: { color: colors.accent, fontFamily: font.bold, fontSize: 12, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '800', color: colors.white, fontFamily: font.extraBold, marginTop: 6 },
  heroSubtitle: { color: colors.textSubtle, fontFamily: font.regular, fontSize: 13, lineHeight: 20, marginTop: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.white, fontFamily: font.bold, fontSize: 18, fontWeight: '600' },
  emptyHint: { color: colors.textSubtle, fontFamily: font.regular, marginTop: 4 },
  teamCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: colors.border,
    ...shadows.card,
  },
  teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  teamName: { fontSize: 18, fontWeight: '700', color: colors.white, fontFamily: font.bold },
  badge: {
    backgroundColor: '#D2B5FF22', color: colors.accent,
    fontFamily: font.bold, fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20
  },
  teamStats: { flexDirection: 'row', marginBottom: 16, gap: 24 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.white, fontFamily: font.extraBold },
  statLabel: { fontSize: 11, color: colors.textSubtle, fontFamily: font.medium, marginTop: 2 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.backgroundDeep, borderRadius: 10, padding: 12 },
  codeLabel: { color: colors.textSubtle, fontFamily: font.regular, fontSize: 12 },
  codeValue: { color: colors.accent, fontFamily: font.extraBold, fontWeight: '800', fontSize: 16, letterSpacing: 2 },
  rankingBtn: {
    alignSelf: 'flex-start',
    borderColor: colors.accent,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  rankingBtnText: { color: colors.accent, fontFamily: font.bold, fontSize: 12, fontWeight: '800' },
  actions: { gap: 12, marginTop: 8 },
  createBtn: { backgroundColor: colors.accent, borderRadius: 12, padding: 16, alignItems: 'center' },
  createBtnText: { color: colors.background, fontFamily: font.bold, fontWeight: '700', fontSize: 15 },
  joinBtn: { borderWidth: 1, borderColor: colors.accent, borderRadius: 12, padding: 16, alignItems: 'center' },
  joinBtnText: { color: colors.accent, fontFamily: font.bold, fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.white, fontFamily: font.bold, marginBottom: 20 },
  input: {
    backgroundColor: colors.backgroundDeep, color: colors.white, borderRadius: 12,
    padding: 14, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: colors.border
  },
  cancel: { color: colors.textSubtle, fontFamily: font.medium, textAlign: 'center', fontSize: 14 },
});
