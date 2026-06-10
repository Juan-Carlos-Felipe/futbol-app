// ✅ REDISEÑADO con theme.ts
import { useState } from 'react';
import { type Href, useRouter, Stack } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, Alert, ActivityIndicator
} from 'react-native';
import { useMyTeams, useCreateTeam, useJoinTeam } from '@/hooks/useTeams';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/lib/theme';
import { SectionHeader } from '@/components/ui/SectionHeader';

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
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'EQUIPOS',
        headerStyle: { backgroundColor: theme.colors.primaryDark },
        headerTitleStyle: { fontFamily: theme.fonts.bebas, color: theme.colors.white },
        headerShown: true
      }} />

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <SectionHeader title="Mis Equipos" />

        {isLoading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />}

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
                  <Text style={[styles.statValue, { color: theme.colors.gold }]}>
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
                <Text style={styles.rankingBtnText}>Ver ranking</Text>
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
      </ScrollView>

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Crear equipo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del equipo"
              placeholderTextColor={theme.colors.gray}
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
              placeholderTextColor={theme.colors.gray}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: theme.colors.dark, fontSize: 18, fontFamily: theme.fonts.dmSansBold },
  emptyHint: { color: theme.colors.gray, marginTop: 4, fontFamily: theme.fonts.dmSans },
  teamCard: {
    backgroundColor: theme.colors.white, borderRadius: theme.radius.lg, padding: 20,
    marginBottom: 16, ...theme.shadow.sm
  },
  teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  teamName: { fontSize: 18, fontFamily: theme.fonts.dmSansBold, color: theme.colors.dark },
  badge: {
    backgroundColor: '#dcfce7', color: theme.colors.primary,
    fontSize: 11, fontFamily: theme.fonts.dmSansBold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20
  },
  teamStats: { flexDirection: 'row', marginBottom: 16, gap: 24 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontFamily: theme.fonts.bebas, color: theme.colors.dark },
  statLabel: { fontSize: 11, color: theme.colors.gray, marginTop: 2, fontFamily: theme.fonts.dmSansBold, textTransform: 'uppercase' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.gray100, borderRadius: 10, padding: 12 },
  codeLabel: { color: theme.colors.gray, fontSize: 12, fontFamily: theme.fonts.dmSans },
  codeValue: { color: theme.colors.primary, fontFamily: theme.fonts.dmSansBold, fontSize: 16, letterSpacing: 2 },
  rankingBtn: {
    alignSelf: 'flex-start',
    borderColor: theme.colors.primary,
    borderRadius: 999,
    borderWidth: 1.5,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  rankingBtnText: { color: theme.colors.primary, fontSize: 12, fontFamily: theme.fonts.dmSansBold },
  actions: { gap: 12, marginTop: 8 },
  createBtn: { backgroundColor: theme.colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  createBtnText: { color: theme.colors.white, fontFamily: theme.fonts.dmSansBold, fontSize: 15 },
  joinBtn: { borderWidth: 1.5, borderColor: theme.colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  joinBtnText: { color: theme.colors.primary, fontFamily: theme.fonts.dmSansBold, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: theme.colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontFamily: theme.fonts.dmSansBold, color: theme.colors.dark, marginBottom: 20 },
  input: {
    backgroundColor: theme.colors.gray100, color: theme.colors.dark, borderRadius: 12,
    padding: 14, marginBottom: 16, fontSize: 16, fontFamily: theme.fonts.dmSans
  },
  cancel: { color: theme.colors.gray, textAlign: 'center', fontSize: 14, fontFamily: theme.fonts.dmSansBold },
});
