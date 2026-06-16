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
import AvatarSetup from '@/components/avatar/AvatarSetup';
import FifaCard from '@/components/ui/FifaCard';
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
  loadAvatarConfig,
  type AvatarConfig,
} from '@/lib/avatar';
import { getFifaRating } from '@/lib/elo';
import { colors, font, radii, shadows, spacing } from '@/lib/theme';
import { SectionTitle, SportCard } from '@/components/ui/SportPrimitives';

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
  const { stats: teamStats } = useTeamStats(activeTeamId);
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
      <View style={styles.headerSection}>
        <Text style={styles.headerKicker}>PRO PLAYER CARD</Text>
        <FifaCard
          name={profile?.display_name ?? 'Jugador'}
          rating={fifaRating}
          elo={playerElo}
          avatarUrl={avatarConfig?.avatarUrl ?? null}
          pose={avatarConfig?.selectedPose}
          teamColor={avatarConfig?.teamColor}
          stats={{
            pac: skills.speed,
            sho: skills.attack,
            pas: Math.round((skills.attack + skills.stamina) / 2),
            dri: Math.round((skills.speed + skills.attack) / 2),
            def: skills.defense,
            phy: skills.stamina,
          }}
        />

        {userId ? (
          <TouchableOpacity style={styles.editAvatarButton} onPress={() => setShowAvatarSetup(true)}>
            <Text style={styles.editAvatarText}>⚙️ PERSONALIZAR CARTA</Text>
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
            <Text style={styles.editHint}>Toca para editar nombre</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsEyebrow}>ESTADÍSTICAS GLOBALES</Text>
        <View style={styles.eloDisplayWrap}>
          <EloDisplay elo={playerElo} showLevel size="lg" />
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
      </View>

      <SportCard style={styles.teamStatsCard}>
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
      </SportCard>

      <SportCard style={styles.teamStatsCard}>
        <SectionTitle title="Forma reciente" />
        <View style={styles.formDots}>
          {form.length > 0 ? (
            form.map((result, index) => <FormDot key={`${result}-${index}`} result={result} />)
          ) : (
            <Text style={styles.eloHint}>Sin partidos registrados aun</Text>
          )}
        </View>
        <Text style={styles.formHint}>Ultimos 5 partidos</Text>
      </SportCard>

      {activeTeamId ? (
        <SportCard style={styles.teamStatsCard}>
          <SectionTitle title="Historial ELO" />
          <EloHistoryList teamId={activeTeamId} />
        </SportCard>
      ) : null}

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
      <Text style={[styles.statTileValue, { color }]}>{value}</Text>
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
  container: { backgroundColor: colors.background, flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 120 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerKicker: {
    color: colors.accent,
    fontFamily: font.extraBold,
    fontSize: 14,
    letterSpacing: 3,
    marginBottom: 10,
  },
  editAvatarButton: {
    backgroundColor: colors.surfaceSoft,
    borderColor: '#f59e0b44',
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: -20,
    zIndex: 20,
    ...shadows.glow,
  },
  editAvatarText: {
    color: '#f59e0b',
    fontFamily: font.extraBold,
    fontSize: 13,
  },
  section: { marginBottom: 28, alignItems: 'center' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  name: { color: colors.white, fontFamily: font.extraBold, fontSize: 32, fontWeight: '800' },
  editHint: { color: colors.accent, fontFamily: font.medium, fontSize: 12, marginTop: 2 },
  email: { color: colors.textSubtle, fontFamily: font.regular, fontSize: 14, marginTop: 4 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: '#fff',
    fontSize: 16,
    padding: 12,
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 44,
    padding: 12,
  },
  saveBtnText: { color: colors.background, fontFamily: font.bold, fontSize: 14, fontWeight: '900' },
  sectionTitle: {
    color: colors.textMuted,
    fontFamily: font.semiBold,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: 28,
    padding: 18,
    ...shadows.card,
  },
  statsEyebrow: {
    color: colors.accent,
    fontFamily: font.extraBold,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  eloDisplayWrap: { marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statTile: { alignItems: 'center', paddingVertical: 10, width: '33.333%' },
  statTileValue: { fontSize: 28, fontWeight: '900', fontFamily: font.extraBold },
  statTileLabel: { color: colors.textSubtle, fontFamily: font.semiBold, fontSize: 11, fontWeight: '800', marginTop: 3 },
  progressWrap: { marginTop: 14 },
  progressLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: { color: colors.textMuted, fontFamily: font.semiBold, fontSize: 12, fontWeight: '700' },
  progressValue: { color: colors.accent, fontFamily: font.extraBold, fontSize: 12, fontWeight: '900' },
  eloHint: { color: colors.textSubtle, fontFamily: font.regular, fontSize: 12, marginTop: 4 },
  teamStatsCard: {
    marginBottom: 28,
  },
  teamStatsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamStatsRow: { flexDirection: 'row' },
  rankBadge: {
    backgroundColor: '#D2B5FF22',
    borderRadius: 999,
    color: colors.accent,
    fontFamily: font.extraBold,
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
  formHint: { color: colors.textSubtle, fontFamily: font.regular, fontSize: 12, marginTop: 10 },
  logoutBtn: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 20,
  },
  logoutText: { color: colors.danger, fontFamily: font.semiBold, fontWeight: '600' },
});
