import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AvatarPlaceholder from '@/components/avatar/AvatarPlaceholder';
import AvatarPreview from '@/components/avatar/AvatarPreview';
import AvatarSetup from '@/components/avatar/AvatarSetup';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import EloDisplay from '@/components/ui/EloDisplay';
import EloHistoryList from '@/components/ui/EloHistoryList';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuth } from '@/hooks/useAuth';
import { usePlayerStats, useRanking, useTeamRecentForm } from '@/hooks/useMatchmaking';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useTeamStats } from '@/hooks/useTeamStats';
import { useMyTeams } from '@/hooks/useTeams';
import { signOut } from '@/lib/auth';
import {
  DEFAULT_TEAM_COLOR,
  loadAvatarConfig,
  type AvatarConfig,
} from '@/lib/avatar';
import { getFifaRating } from '@/lib/elo';

const SKILLS = [
  { key: 'attack', label: 'Ataque', icon: 'ATQ' },
  { key: 'defense', label: 'Defensa', icon: 'DEF' },
  { key: 'speed', label: 'Velocidad', icon: 'VEL' },
  { key: 'stamina', label: 'Resistencia', icon: 'RES' },
] as const;

type SkillKey = (typeof SKILLS)[number]['key'];
type SkillsMap = Record<SkillKey, number>;

const DEFAULT_SKILLS: SkillsMap = {
  attack: 50,
  defense: 50,
  speed: 50,
  stamina: 50,
};

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
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
  const [showAvatarSetup, setShowAvatarSetup] = useState(false);

  const playerWinRate =
    playerStats && playerStats.matches_played > 0
      ? Math.round((playerStats.wins / playerStats.matches_played) * 100)
      : 0;
  const teamRankingPosition = activeTeamId
    ? ranking.findIndex((team) => team.team_id === activeTeamId) + 1
    : 0;
  const playerElo = playerStats?.elo ?? 1000;
  const fifaRating = getFifaRating(playerElo);

  useEffect(() => {
    let mounted = true;

    if (!userId) {
      setAvatarConfig(null);
      return;
    }

    loadAvatarConfig(userId).then((config) => {
      if (mounted) setAvatarConfig(config);
    });

    return () => {
      mounted = false;
    };
  }, [userId]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  const skills = (profile?.skills as SkillsMap | undefined) ?? DEFAULT_SKILLS;

  async function saveProfile() {
    if (!displayName.trim()) return;
    try {
      await updateProfile.mutateAsync({ display_name: displayName.trim() });
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarHero}>
        <View style={styles.avatarStage}>
          {avatarConfig?.avatarUrl ? (
            <AvatarPreview
              avatarUrl={avatarConfig.avatarUrl}
              pose={avatarConfig.selectedPose}
              teamColor={avatarConfig.teamColor}
              width={160}
              height={240}
              autoRotate
            />
          ) : (
            <AvatarPlaceholder size="lg" teamColor={avatarConfig?.teamColor ?? DEFAULT_TEAM_COLOR} />
          )}
          <View style={styles.ratingOverlay}>
            <AnimatedNumber value={fifaRating} style={styles.ratingOverlayValue} />
            <Text style={styles.ratingOverlayLabel}>RAT</Text>
          </View>
        </View>
        {userId ? (
          <TouchableOpacity style={styles.editAvatarButton} onPress={() => setShowAvatarSetup(true)}>
            <Text style={styles.editAvatarText}>Editar avatar</Text>
          </TouchableOpacity>
        ) : null}
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
              <Text style={styles.saveBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => {
              setDisplayName(profile?.display_name ?? '');
              setEditing(true);
            }}
          >
            <Text style={styles.name}>{profile?.display_name ?? 'Jugador'}</Text>
            <Text style={styles.editHint}>Toca para editar</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsEyebrow}>MIS STATS</Text>
        <View style={styles.ratingRow}>
          <View style={styles.fifaRatingCard}>
            <AnimatedNumber value={fifaRating} style={styles.fifaRating} />
            <Text style={styles.fifaRatingLabel}>RAT</Text>
          </View>
          <View style={styles.eloDisplayWrap}>
            <EloDisplay elo={playerElo} showLevel size="lg" />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatTile label="Partidos" value={playerStats?.matches_played ?? 0} color="#d1d5db" />
          <StatTile label="Victorias" value={playerStats?.wins ?? 0} color="#22c55e" />
          <StatTile label="Derrotas" value={playerStats?.losses ?? 0} color="#ef4444" />
          <StatTile label="Empates" value={playerStats?.draws ?? 0} color="#f59e0b" />
          <StatTile label="Goles" value={playerStats?.goals ?? 0} color="#fbbf24" />
          <StatTile label="Asist." value={playerStats?.assists ?? 0} color="#60a5fa" />
        </View>

        <ProgressRow label="% victorias como jugador" value={playerWinRate} />
        <Text style={styles.eloHint}>Ranking personal basado en tus resultados</Text>
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

      {activeTeamId ? (
        <View style={styles.teamStatsCard}>
          <Text style={styles.sectionTitle}>Historial ELO</Text>
          <EloHistoryList teamId={activeTeamId} />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Habilidades</Text>
        {SKILLS.map(({ key, label, icon }) => (
          <View key={key} style={styles.skillRow}>
            <Text style={styles.skillLabel}>
              {icon} {label}
            </Text>
            <View style={styles.skillBarBg}>
              <View style={[styles.skillBarFill, { width: `${skills[key]}%` }]} />
            </View>
            <Text style={styles.skillValue}>{skills[key]}</Text>
          </View>
        ))}
        <Text style={styles.skillNote}>Las habilidades suben con la actividad en partidos</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <Text style={styles.logoutText}>Cerrar sesion</Text>
      </TouchableOpacity>

      {userId ? (
        <Modal
          visible={showAvatarSetup}
          animationType="slide"
          onRequestClose={() => setShowAvatarSetup(false)}
        >
          <AvatarSetup
            userId={userId}
            currentConfig={avatarConfig}
            onComplete={(config) => {
              setAvatarConfig(config);
              setShowAvatarSetup(false);
            }}
          />
        </Modal>
      ) : null}
    </ScrollView>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statTile}>
      <AnimatedNumber value={value} style={[styles.statTileValue, { color }]} />
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value.toLocaleString('es-CL')}%</Text>
      </View>
      <ProgressBar progress={value} color="#22c55e" />
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
  container: { backgroundColor: '#0f1117', flex: 1 },
  content: { padding: 24, paddingBottom: 36 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  avatarHero: {
    alignItems: 'center',
    backgroundColor: '#08130d',
    borderColor: '#1f3f2c',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
    paddingTop: 12,
  },
  avatarStage: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
    width: '100%',
  },
  ratingOverlay: {
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    bottom: 18,
    left: 24,
    minWidth: 68,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute',
  },
  ratingOverlayValue: { color: '#78350f', fontSize: 28, fontWeight: '900' },
  ratingOverlayLabel: { color: '#78350f', fontSize: 10, fontWeight: '900' },
  editAvatarButton: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  editAvatarText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  section: { marginBottom: 28 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800' },
  editHint: { color: '#666', fontSize: 12, marginTop: 2 },
  email: { color: '#888', fontSize: 14, marginTop: 4 },
  input: {
    backgroundColor: '#1a1d27',
    borderColor: '#2a2d3a',
    borderRadius: 10,
    borderWidth: 1,
    color: '#fff',
    fontSize: 16,
    padding: 12,
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 10,
    minWidth: 44,
    padding: 12,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
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
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 14, marginBottom: 14 },
  fifaRatingCard: {
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fifaRating: { color: '#78350f', fontSize: 34, fontWeight: '900' },
  fifaRatingLabel: { color: '#78350f', fontSize: 11, fontWeight: '900', marginTop: -2 },
  eloDisplayWrap: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statTile: { alignItems: 'center', paddingVertical: 10, width: '33.333%' },
  statTileValue: { fontSize: 28, fontWeight: '900' },
  statTileLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '800', marginTop: 3 },
  progressWrap: { marginTop: 14 },
  progressLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: { color: '#d1d5db', fontSize: 12, fontWeight: '700' },
  progressValue: { color: '#22c55e', fontSize: 12, fontWeight: '900' },
  eloHint: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  teamStatsCard: {
    backgroundColor: '#1a1d27',
    borderColor: '#2a2d3a',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 28,
    padding: 16,
  },
  teamStatsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
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
  skillRow: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 12 },
  skillLabel: { color: '#fff', fontSize: 14, width: 118 },
  skillBarBg: {
    backgroundColor: '#1a1d27',
    borderRadius: 3,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  skillBarFill: { backgroundColor: '#22c55e', borderRadius: 3, height: '100%' },
  skillValue: { color: '#888', fontSize: 12, textAlign: 'right', width: 30 },
  skillNote: { color: '#444', fontSize: 11, fontStyle: 'italic', marginTop: 8 },
  logoutBtn: {
    alignItems: 'center',
    borderColor: '#ef4444',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  logoutText: { color: '#ef4444', fontWeight: '600' },
});
