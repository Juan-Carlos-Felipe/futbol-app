// ✅ REDISEÑADO con theme.ts
import { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, ActivityIndicator
} from 'react-native';
import type { DimensionValue } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useMyTeams } from '@/hooks/useTeams';
import { usePlayerStats, useRanking, useTeamRecentForm } from '@/hooks/useMatchmaking';
import { useTeamStats } from '@/hooks/useTeamStats';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { theme } from '@/lib/theme';
import { StatCard } from '@/components/ui/StatCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ResultBadge } from '@/components/ui/ResultBadge';
import { Stack } from 'expo-router';

const SKILLS = [
  { key: 'attack', label: 'Ataque', emoji: '⚡' },
  { key: 'defense', label: 'Defensa', emoji: '🛡️' },
  { key: 'speed', label: 'Velocidad', emoji: '💨' },
  { key: 'stamina', label: 'Resistencia', emoji: '❤️' },
] as const;

export default function ProfileScreen() {
  const { userId } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: teams } = useMyTeams();
  const updateProfile = useUpdateProfile();
  const activeTeamId = useMemo(() => teams?.[0]?.team_id ?? null, [teams]);
  const { stats: playerStats } = usePlayerStats(userId);
  const { stats: teamStats, winRate: teamWinRate } = useTeamStats(activeTeamId);
  const { ranking } = useRanking(50);
  const { form } = useTeamRecentForm(activeTeamId);

  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const playerWinRate =
    playerStats && playerStats.matches_played > 0
      ? Math.round((playerStats.wins / playerStats.matches_played) * 100)
      : 0;
  const teamRankingPosition = activeTeamId
    ? ranking.findIndex((team) => team.team_id === activeTeamId) + 1
    : 0;

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const skills = profile?.skills ?? { attack: 50, defense: 50, speed: 50, stamina: 50 };

  async function pickAndUploadAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    setUploadingAvatar(true);
    try {
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const fileExt = 'jpg';
      const fileName = `${userId}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const response = await fetch(compressed.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
    } catch (e: any) {
      Alert.alert('Error al subir imagen', e.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveProfile() {
    if (!displayName.trim()) return;
    try {
      await updateProfile.mutateAsync({ display_name: displayName.trim() });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'PERFIL',
        headerStyle: { backgroundColor: theme.colors.primaryDark },
        headerTitleStyle: { fontFamily: theme.fonts.bebas, color: theme.colors.white },
        headerShown: true
      }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* FIFA HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickAndUploadAvatar} disabled={uploadingAvatar}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={{ fontSize: 40 }}>👤</Text>
                </View>
              )}
              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={theme.colors.white} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.nameSection}>
              {editing ? (
                <View style={styles.row}>
                  <TextInput
                    style={styles.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Nombre"
                    placeholderTextColor={theme.colors.gray}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                    <Text style={styles.saveBtnText}>✓</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => { setDisplayName(profile?.display_name ?? ''); setEditing(true); }}
                  style={{alignItems: 'center'}}
                >
                  <Text style={styles.name}>{profile?.display_name}</Text>
                  <Text style={styles.editHint}>Editar perfil ✏️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.statsGrid}>
              <StatCard label="Partidos" value={playerStats?.matches_played ?? 0} />
              <StatCard label="Goles" value={playerStats?.goals ?? 0} color={theme.colors.gold} />
              <StatCard label="Asistencias" value={playerStats?.assists ?? 0} color={theme.colors.blue} />
            </View>

            <View style={styles.eloContainer}>
               <Text style={styles.playerElo}>
                ELO: {(playerStats?.elo ?? 0).toLocaleString('es-CL')}
              </Text>
              {(playerStats?.win_streak ?? 0) > 0 ? (
                <Text style={styles.streakText}>
                  🔥 {playerStats?.win_streak} SEGUIDOS
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={{ padding: 24 }}>
          <SectionHeader title="Estadísticas de Equipo" />
          <View style={styles.teamStatsCard}>
            <View style={styles.teamStatsHeader}>
              <Text style={styles.teamNameLabel}>MI EQUIPO ACTUAL</Text>
              {teamRankingPosition > 0 ? (
                <Text style={styles.rankBadge}>#{teamRankingPosition}</Text>
              ) : null}
            </View>
            <View style={styles.teamStatsRow}>
              <StatCard label="Ganados" value={teamStats?.wins ?? 0} color={theme.colors.win} />
              <StatCard label="Perdidos" value={teamStats?.losses ?? 0} color={theme.colors.loss} />
              <StatCard label="Empates" value={teamStats?.draws ?? 0} color={theme.colors.draw} />
            </View>
            <ProgressRow label="Win rate del equipo" value={teamWinRate} />

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>FORMA RECIENTE</Text>
              <View style={styles.formDots}>
                {form.length > 0 ? (
                  form.map((result, index) => <ResultBadge key={`${result}-${index}`} result={result} />)
                ) : (
                  <Text style={styles.emptyHint}>Sin partidos</Text>
                )}
              </View>
            </View>
          </View>

          <SectionHeader title="Habilidades" />
          <View style={styles.skillsCard}>
            {SKILLS.map(({ key, label, emoji }) => (
              <View key={key} style={styles.skillRow}>
                <Text style={styles.skillLabel}>{emoji} {label}</Text>
                <View style={styles.skillBarBg}>
                  <View style={[styles.skillBarFill, { width: `${skills[key]}%` }]} />
                </View>
                <Text style={styles.skillValue}>{skills[key]}</Text>
              </View>
            ))}
            <Text style={styles.skillNote}>
              * Las habilidades suben con tu desempeño en partidos
            </Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  const width = `${Math.max(0, Math.min(100, value))}%` as DimensionValue;

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  heroSection: {
    backgroundColor: theme.colors.primaryDark,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: theme.colors.primary },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)'
  },
  avatarOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 50,
    alignItems: 'center', justifyContent: 'center'
  },
  nameSection: { marginTop: 12, alignItems: 'center', width: '100%' },
  name: { fontSize: 28, fontFamily: theme.fonts.bebas, color: theme.colors.white },
  editHint: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2, fontFamily: theme.fonts.dmSansBold },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)', color: theme.colors.white, borderRadius: 10,
    padding: 12, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', width: '60%'
  },
  saveBtn: {
    backgroundColor: theme.colors.primary, borderRadius: 10, padding: 12, alignItems: 'center', minWidth: 44, marginLeft: 8
  },
  saveBtnText: { color: theme.colors.white, fontSize: 18, fontFamily: theme.fonts.dmSansBold },
  heroStats: { paddingHorizontal: 24 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  eloContainer: { alignItems: 'center', marginTop: 16 },
  playerElo: { color: theme.colors.gold, fontSize: 32, fontFamily: theme.fonts.bebas },
  streakText: { color: theme.colors.primary, fontSize: 14, fontFamily: theme.fonts.dmSansBold, marginTop: 4, backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  teamStatsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 20,
    marginBottom: 24,
    ...theme.shadow.sm,
  },
  teamStatsHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  teamNameLabel: { color: theme.colors.gray, fontSize: 11, fontFamily: theme.fonts.dmSansBold },
  teamStatsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  rankBadge: {
    backgroundColor: '#fffbeb',
    borderRadius: 999,
    color: theme.colors.gold,
    fontSize: 12,
    fontFamily: theme.fonts.dmSansBold,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  formSection: { marginTop: 20 },
  formLabel: { color: theme.colors.gray, fontSize: 11, fontFamily: theme.fonts.dmSansBold, marginBottom: 8 },
  formDots: { flexDirection: 'row', gap: 8 },
  emptyHint: { color: theme.colors.gray, fontSize: 12, fontFamily: theme.fonts.dmSans },
  skillsCard: {
     backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 20,
    marginBottom: 24,
    ...theme.shadow.sm,
  },
  skillRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  skillLabel: { color: theme.colors.dark, fontSize: 14, fontFamily: theme.fonts.dmSansBold, width: 100 },
  skillBarBg: { flex: 1, height: 8, backgroundColor: theme.colors.gray100, borderRadius: 4, overflow: 'hidden' },
  skillBarFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
  skillValue: { color: theme.colors.gray, fontSize: 12, fontFamily: theme.fonts.bebas, width: 30, textAlign: 'right' },
  skillNote: { color: theme.colors.gray, fontSize: 11, marginTop: 8, fontStyle: 'italic', fontFamily: theme.fonts.dmSans },
  logoutBtn: { borderWidth: 1.5, borderColor: theme.colors.loss, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  logoutText: { color: theme.colors.loss, fontFamily: theme.fonts.dmSansBold },
  progressWrap: { marginTop: 10 },
  progressLabelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: theme.colors.dark, fontSize: 12, fontFamily: theme.fonts.dmSansBold },
  progressValue: { color: theme.colors.primary, fontSize: 12, fontFamily: theme.fonts.dmSansBold },
  progressTrack: {
    backgroundColor: theme.colors.gray100,
    borderRadius: 999,
    height: 8,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: theme.colors.primary, height: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
