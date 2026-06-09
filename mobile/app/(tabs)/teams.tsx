import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, Alert, ActivityIndicator, Image
} from 'react-native';
import { useMyTeams, useCreateTeam, useJoinTeam } from '@/hooks/useTeams';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/lib/theme';

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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={styles.title}>MIS EQUIPOS</Text>

      {isLoading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />}

      {teams?.length === 0 && !isLoading && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⚽</Text>
          <Text style={styles.emptyText}>Aún no tienes equipos</Text>
        </View>
      )}

      {teams?.map((member) => {
        const team = member.teams as any;
        const isCreator = team.created_by === userId;

        return (
          <View key={member.team_id} style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoInitial}>{team.name.charAt(0)}</Text>
              </View>
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamStatsMini}>12G · 4E · 3P</Text>
              </View>
              <View style={styles.eloBadge}>
                <Text style={styles.eloText}>⚡ 1.247</Text>
              </View>
            </View>

            <View style={styles.teamActions}>
              <TouchableOpacity style={styles.viewTeamBtn}>
                <Text style={styles.viewTeamText}>Ver equipo</Text>
              </TouchableOpacity>
              <View style={styles.inviteInfo}>
                <Text style={styles.codeLabel}>CÓDIGO:</Text>
                <Text style={styles.codeValue}>{team.invite_code}</Text>
              </View>
            </View>
          </View>
        );
      })}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.createBtnText}>+ CREAR EQUIPO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.joinBtn} onPress={() => setShowJoin(true)}>
          <Text style={styles.joinBtnText}>UNIRSE CON CÓDIGO</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>CREAR EQUIPO</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del equipo"
              placeholderTextColor={theme.colors.gray400}
              value={teamName}
              onChangeText={setTeamName}
              autoFocus
            />
            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleCreate}
              disabled={createTeam.isPending}
            >
              <Text style={styles.createBtnText}>
                {createTeam.isPending ? 'CREANDO...' : 'CREAR'}
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
            <Text style={styles.modalTitle}>UNIRSE A UN EQUIPO</Text>
            <TextInput
              style={styles.input}
              placeholder="Código de invitación"
              placeholderTextColor={theme.colors.gray400}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              autoFocus
            />
            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleJoin}
              disabled={joinTeam.isPending}
            >
              <Text style={styles.createBtnText}>
                {joinTeam.isPending ? 'UNIÉNDOSE...' : 'UNIRSE'}
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
  container: { flex: 1, backgroundColor: theme.colors.gray50 },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 32,
    color: theme.colors.gray900,
    marginBottom: 24
  },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.gray400
  },
  teamCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...theme.shadow.sm,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  },
  logoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    color: theme.colors.white,
    fontFamily: theme.fonts.display,
    fontSize: 24,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: theme.colors.gray900
  },
  teamStatsMini: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.gray400,
    marginTop: 2,
  },
  eloBadge: {
    backgroundColor: theme.colors.goldLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eloText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    color: theme.colors.goldDark,
  },
  teamActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray100,
    paddingTop: 12,
  },
  viewTeamBtn: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewTeamText: {
    color: theme.colors.primary,
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
  },
  inviteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  codeLabel: {
    fontFamily: theme.fonts.display,
    fontSize: 11,
    color: theme.colors.gray400,
  },
  codeValue: {
    fontFamily: theme.fonts.display,
    fontSize: 13,
    color: theme.colors.primary,
  },
  actions: { gap: 12, marginTop: 16 },
  createBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  createBtnText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.display,
    fontSize: 16
  },
  joinBtn: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  joinBtnText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.display,
    fontSize: 16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  modal: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24
  },
  modalTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 24,
    color: theme.colors.gray900,
    marginBottom: 20
  },
  input: {
    backgroundColor: theme.colors.gray100,
    color: theme.colors.gray900,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontFamily: theme.fonts.body,
  },
  cancel: {
    color: theme.colors.gray400,
    textAlign: 'center',
    fontFamily: theme.fonts.body
  },
});
