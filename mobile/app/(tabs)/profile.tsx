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
        <ActivityIndicator color="#22c55e" />
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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
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
              <ActivityIndicator color="#fff" />
            </View>
          )}
          <Text style={styles.changePhoto}>Cambiar foto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        {editing ? (
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nombre de jugador"
              placeholderTextColor="#666"
              autoFocus
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveBtnText}>✓</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => { setDisplayName(profile?.display_name ?? ''); setEditing(true); }}
          >
            <Text style={styles.name}>{profile?.display_name}</Text>
            <Text style={styles.editHint}>Toca para editar ✏️</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsEyebrow}>MIS STATS</Text>
        <View style={styles.statsGrid}>
          <StatTile label="Partidos" value={playerStats?.matches_played ?? 0} color="#d1d5db" />
          <StatTile label="Victorias" value={playerStats?.wins ?? 0} color="#22c55e" />
          <StatTile label="Derrotas" value={playerStats?.losses ?? 0} color="#ef4444" />
          <StatTile label="Empates" value={playerStats?.draws ?? 0} color="#f59e0b" />
          <StatTile label="Goles" value={playerStats?.goals ?? 0} color="#fbbf24" />
          <StatTile label="Asistencias" value={playerStats?.assists ?? 0} color="#60a5fa" />
        </View>

        <ProgressRow label="% victorias como jugador" value={playerWinRate} />

        <Text style={styles.playerElo}>
          ⚡ ELO: {(playerStats?.elo ?? 0).toLocaleString('es-CL')}
        </Text>
        <Text style={styles.eloHint}>Ranking personal basado en tus resultados</Text>
        {(playerStats?.win_streak ?? 0) > 0 ? (
          <Text style={styles.streakText}>
            🔥 Racha de {playerStats?.win_streak.toLocaleString('es-CL')} victorias
          </Text>
        ) : null}
      </View>

      <View style={styles.teamStatsCard}>
        <View style={styles.teamStatsHeader}>
          <Text style={styles.sectionTitle}>Mi equipo</Text>
          {teamRankingPosition > 0 ? (
            <Text style={styles.rankBadge}>#{teamRankingPosition.toLocaleString('es-CL')}</Text>
          ) : null}
        </View>
        <View style={styles.teamStatsRow}>
          <StatTile label="Ganados" value={teamStats?.wins ?? 0} color="#22c55e" />
          <StatTile label="Perdidos" value={teamStats?.losses ?? 0} color="#ef4444" />
          <StatTile label="Empates" value={teamStats?.draws ?? 0} color="#f59e0b" />
        </View>
        <ProgressRow label="Win rate del equipo" value={teamWinRate} />
      </View>

      <View style={styles.teamStatsCard}>
        <Text style={styles.sectionTitle}>Forma reciente</Text>
        <View style={styles.formDots}>
          {form.length > 0 ? (
            form.map((result, index) => <FormDot key={`${result}-${index}`} result={result} />)
          ) : (
            <Text style={styles.eloHint}>Sin partidos registrados aun</Text>
          )}
        </View>
        <Text style={styles.formHint}>Ultimos 5 partidos</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Habilidades</Text>
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
          * Las habilidades suben con la actividad en partidos
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statTileValue, { color }]}>{value.toLocaleString('es-CL')}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  const width = `${Math.max(0, Math.min(100, value))}%` as DimensionValue;

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value.toLocaleString('es-CL')}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width }]} />
      </View>
    </View>
  );
}

function FormDot({ result }: { result: 'win' | 'draw' | 'loss' }) {
  const meta = {
    win: { label: 'G', backgroundColor: '#dcfce7', color: '#16a34a' },
    draw: { label: 'E', backgroundColor: '#fef3c7', color: '#d97706' },
    loss: { label: 'P', backgroundColor: '#fee2e2', color: '#dc2626' },
  }[result];

  return (
    <View style={[styles.formDot, { backgroundColor: meta.backgroundColor }]}>
      <Text style={[styles.formDotText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#22c55e' },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#1a1d27', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#2a2d3a'
  },
  avatarOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 50,
    alignItems: 'center', justifyContent: 'center'
  },
  changePhoto: { color: '#22c55e', marginTop: 8, fontSize: 13 },
  section: { marginBottom: 28 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 24, fontWeight: '800', color: '#fff' },
  editHint: { color: '#666', fontSize: 12, marginTop: 2 },
  email: { color: '#888', fontSize: 14, marginTop: 4 },
  input: {
    backgroundColor: '#1a1d27', color: '#fff', borderRadius: 10,
    padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#2a2d3a'
  },
  saveBtn: {
    backgroundColor: '#22c55e', borderRadius: 10, padding: 12, alignItems: 'center', minWidth: 44
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 16 },
  statsCard: {
    backgroundColor: '#0a3d1f',
    borderRadius: 16,
    marginBottom: 28,
    padding: 18,
  },
  statsEyebrow: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statTile: { alignItems: 'center', paddingVertical: 10, width: '33.333%' },
  statTileValue: { fontSize: 28, fontWeight: '900' },
  statTileLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '800', marginTop: 3 },
  progressWrap: { marginTop: 14 },
  progressLabelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#d1d5db', fontSize: 12, fontWeight: '700' },
  progressValue: { color: '#22c55e', fontSize: 12, fontWeight: '900' },
  progressTrack: {
    backgroundColor: '#1a1d27',
    borderRadius: 999,
    height: 8,
    marginTop: 7,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: '#22c55e', height: 8 },
  playerElo: { color: '#f59e0b', fontSize: 28, fontWeight: '900', marginTop: 16 },
  eloHint: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  streakText: { color: '#f59e0b', fontSize: 20, fontWeight: '900', marginTop: 12 },
  teamStatsCard: {
    backgroundColor: '#1a1d27',
    borderColor: '#2a2d3a',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 28,
    padding: 16,
  },
  teamStatsHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  teamStatsRow: { flexDirection: 'row' },
  rankBadge: {
    backgroundColor: '#f59e0b22',
    borderRadius: 999,
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  formDots: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  formDot: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  formDotText: { fontSize: 13, fontWeight: '900' },
  formHint: { color: '#888', fontSize: 12, marginTop: 10 },
  skillRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  skillLabel: { color: '#fff', fontSize: 14, width: 110 },
  skillBarBg: { flex: 1, height: 6, backgroundColor: '#1a1d27', borderRadius: 3, overflow: 'hidden' },
  skillBarFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 3 },
  skillValue: { color: '#888', fontSize: 12, width: 30, textAlign: 'right' },
  skillNote: { color: '#444', fontSize: 11, marginTop: 8, fontStyle: 'italic' },
  logoutBtn: { borderWidth: 1, borderColor: '#ef4444', borderRadius: 12, padding: 14, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontWeight: '600' },
});
