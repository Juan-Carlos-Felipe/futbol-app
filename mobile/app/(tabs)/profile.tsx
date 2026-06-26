import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import BalonesWidget from '@/components/store/BalonesWidget';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import EloDisplay from '@/components/ui/EloDisplay';
import EloHistoryList from '@/components/ui/EloHistoryList';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuth } from '@/hooks/useAuth';
import { usePlayerStats, useRanking, useTeamRecentForm } from '@/hooks/useMatchmaking';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useUserInventory } from '@/hooks/useStore';
import { useTeamStats } from '@/hooks/useTeamStats';
import { useMyTeams } from '@/hooks/useTeams';
import { signOut } from '@/lib/auth';
import { getFifaRating } from '@/lib/elo';
import { colors, font, radii, shadows, spacing } from '@/lib/theme';
import { SectionTitle, SportCard, StatPill } from '@/components/ui/SportPrimitives';

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

type PlayerSkill = {
  key: string;
  label: string;
  short: string;
  value: number;
  color: string;
};

function buildPlayerSkills(skills: SkillsMap): PlayerSkill[] {
  return [
    { key: 'pace', label: 'Ritmo', short: 'PAC', value: skills.speed, color: '#6f8cff' },
    { key: 'shooting', label: 'Tiro', short: 'SHO', value: skills.attack, color: '#f4b740' },
    {
      key: 'passing',
      label: 'Pase',
      short: 'PAS',
      value: Math.round((skills.attack + skills.stamina) / 2),
      color: '#D2B5FF',
    },
    {
      key: 'dribbling',
      label: 'Regate',
      short: 'DRI',
      value: Math.round((skills.speed + skills.attack) / 2),
      color: '#33d69f',
    },
    { key: 'defending', label: 'Defensa', short: 'DEF', value: skills.defense, color: '#60a5fa' },
    { key: 'physical', label: 'Físico', short: 'PHY', value: skills.stamina, color: '#ff6b7a' },
  ];
}

export default function ProfileScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: teams } = useMyTeams();
  const { inventory } = useUserInventory(userId);
  const updateProfile = useUpdateProfile();
  const activeTeamId = useMemo(() => teams?.[0]?.team_id ?? null, [teams]);
  const { stats: playerStats } = usePlayerStats(userId);
  const { stats: teamStats, winRate: teamWinRate } = useTeamStats(activeTeamId);
  const { ranking } = useRanking(50);
  const { form } = useTeamRecentForm(activeTeamId);
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
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
  const equippedColor =
    inventory.find((item) => item.equipped && item.store_items?.type === 'jersey_color')
      ?.store_items?.data?.color ?? '#16a34a';
  const equippedPose =
    inventory.find((item) => item.equipped && item.store_items?.type === 'pose')?.store_items?.data
      ?.pose ?? 'jogging';

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  const skills = (profile?.skills as SkillsMap | undefined) ?? DEFAULT_SKILLS;
  const playerSkills = buildPlayerSkills(skills);

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
      <PlayerStickerCard
        avatarUrl={null}
        displayName={profile?.display_name ?? 'Jugador'}
        email={profile?.email}
        editing={editing}
        displayNameDraft={displayName}
        onChangeDisplayName={setDisplayName}
        onStartEditing={() => {
          setDisplayName(profile?.display_name ?? '');
          setEditing(true);
        }}
        onSaveProfile={saveProfile}
        fifaRating={fifaRating}
        playerElo={playerElo}
        pose={equippedPose}
        teamColor={equippedColor}
        skills={playerSkills}
        playerStats={{
          matches: playerStats?.matches_played ?? 0,
          wins: playerStats?.wins ?? 0,
          goals: playerStats?.goals ?? 0,
          assists: playerStats?.assists ?? 0,
          winRate: playerWinRate,
        }}
        inventorySlot={
          userId ? (
            <View style={styles.stickerActions}>
              <BalonesWidget userId={userId} />
              <TouchableOpacity
                style={styles.inventoryButton}
                onPress={() => router.push('/tienda/inventario')}
              >
                <Text style={styles.inventoryButtonText}>Inventario</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        avatarButton={
          userId ? (
            <TouchableOpacity style={styles.editAvatarButton} onPress={() => router.push('/player-builder')}>
              <Text style={styles.editAvatarText}>
                Player Builder
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

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
        <ProgressRow label="Win rate del equipo" value={teamWinRate} />
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

    </ScrollView>
  );
}

function PlayerStickerCard({
  avatarUrl,
  avatarName,
  displayName,
  email,
  editing,
  displayNameDraft,
  onChangeDisplayName,
  onStartEditing,
  onSaveProfile,
  fifaRating,
  playerElo,
  pose,
  teamColor,
  skills,
  playerStats,
  inventorySlot,
  avatarButton,
}: {
  avatarUrl: string | null;
  avatarName?: string;
  displayName: string;
  email?: string;
  editing: boolean;
  displayNameDraft: string;
  onChangeDisplayName: (value: string) => void;
  onStartEditing: () => void;
  onSaveProfile: () => void;
  fifaRating: number;
  playerElo: number;
  pose: string;
  teamColor: string;
  skills: PlayerSkill[];
  playerStats: { matches: number; wins: number; goals: number; assists: number; winRate: number };
  inventorySlot: ReactNode;
  avatarButton: ReactNode;
}) {
  return (
    <LinearGradient
      colors={['#10111d', '#222132', '#31263a']}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.stickerCard}
    >
      <View style={styles.stickerPattern} />
      <View style={[styles.stickerAccentBlock, { backgroundColor: teamColor }]} />
      <Text style={styles.stickerYear}>26</Text>

      {inventorySlot}

      <View style={styles.stickerHeader}>
        <View style={styles.ratingBadge}>
          <AnimatedNumber value={fifaRating} style={styles.ratingBadgeValue} />
          <Text style={styles.ratingBadgeLabel}>RAT</Text>
        </View>
        <View style={styles.eloPill}>
          <EloDisplay elo={playerElo} showLevel size="sm" />
        </View>
      </View>

      <View style={styles.stickerAvatarWrap}>
        <View style={{ width: 250, height: 330, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
           <Text style={{ color: '#fff', fontSize: 80 }}>👤</Text>
        </View>
      </View>

      <View style={styles.identityPanel}>
        {editing ? (
          <View style={styles.nameEditRow}>
            <TextInput
              style={styles.nameInput}
              value={displayNameDraft}
              onChangeText={onChangeDisplayName}
              placeholder="Nombre"
              placeholderTextColor="#8b8799"
              autoFocus
            />
            <TouchableOpacity style={styles.nameSaveButton} onPress={onSaveProfile}>
              <Text style={styles.nameSaveText}>OK</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={onStartEditing} activeOpacity={0.75}>
            <Text style={styles.stickerName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.stickerMeta} numberOfLines={1}>
              {email ?? 'Jugador'} · {playerStats.winRate}% WR
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.quickStatsRow}>
        <MiniStat label="PJ" value={playerStats.matches} />
        <MiniStat label="G" value={playerStats.wins} tone="success" />
        <MiniStat label="GL" value={playerStats.goals} tone="warning" />
        <MiniStat label="AST" value={playerStats.assists} tone="blue" />
      </View>

      <View style={styles.skillsPanel}>
        <View style={styles.skillsHeaderRow}>
          <Text style={styles.skillsTitle}>Habilidades</Text>
          <Text style={styles.skillsHint}>Perfil jugador</Text>
        </View>
        <View style={styles.skillsGrid}>
          {skills.map((skill) => (
            <SkillMeter key={skill.key} skill={skill} />
          ))}
        </View>
      </View>

      {avatarButton}
    </LinearGradient>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'warning' | 'blue' }) {
  const color = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : tone === 'blue' ? '#60a5fa' : colors.text;

  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniStatValue, { color }]}>{value.toLocaleString('es-CL')}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

function SkillMeter({ skill }: { skill: PlayerSkill }) {
  return (
    <View style={styles.skillMeter}>
      <View style={styles.skillMeterTop}>
        <Text style={styles.skillShort}>{skill.short}</Text>
        <Text style={styles.skillScore}>{skill.value}</Text>
      </View>
      <View style={styles.skillTrack}>
        <View style={[styles.skillFill, { width: `${skill.value}%`, backgroundColor: skill.color }]} />
      </View>
      <Text style={styles.skillMeterLabel} numberOfLines={1}>
        {skill.label}
      </Text>
    </View>
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
  container: { backgroundColor: colors.background, flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 120 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  stickerCard: {
    borderColor: 'rgba(210,181,255,0.16)',
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 28,
    overflow: 'hidden',
    padding: 14,
    ...shadows.card,
  },
  stickerPattern: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomLeftRadius: 110,
    height: 250,
    position: 'absolute',
    right: -44,
    top: 30,
    width: 190,
  },
  stickerAccentBlock: {
    borderBottomRightRadius: 80,
    borderTopLeftRadius: 80,
    height: 210,
    left: -70,
    opacity: 0.34,
    position: 'absolute',
    top: 70,
    width: 210,
  },
  stickerYear: {
    color: 'rgba(255,255,255,0.08)',
    fontFamily: font.extraBold,
    fontSize: 120,
    fontWeight: '900',
    position: 'absolute',
    right: 12,
    top: 34,
  },
  stickerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    width: '100%',
    zIndex: 3,
  },
  stickerHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    zIndex: 3,
  },
  ratingBadge: {
    alignItems: 'center',
    backgroundColor: colors.warning,
    borderRadius: 16,
    minWidth: 76,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  ratingBadgeValue: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 34,
    fontWeight: '900',
  },
  ratingBadgeLabel: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 10,
    fontWeight: '900',
    marginTop: -4,
  },
  eloPill: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(16,17,29,0.54)',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 178,
    padding: 10,
  },
  stickerAvatarWrap: {
    alignItems: 'center',
    marginTop: -34,
    zIndex: 2,
  },
  identityPanel: {
    backgroundColor: 'rgba(16,17,29,0.74)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: -12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 4,
  },
  stickerName: {
    color: colors.text,
    fontFamily: font.extraBold,
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  stickerMeta: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  nameEditRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  nameInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontFamily: font.bold,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  nameSaveButton: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  nameSaveText: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 12,
    fontWeight: '900',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    zIndex: 4,
  },
  miniStat: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  miniStatValue: {
    fontFamily: font.extraBold,
    fontSize: 18,
    fontWeight: '900',
  },
  miniStatLabel: {
    color: colors.textSubtle,
    fontFamily: font.bold,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
  },
  skillsPanel: {
    backgroundColor: 'rgba(16,17,29,0.58)',
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
    zIndex: 4,
  },
  skillsHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skillsTitle: {
    color: colors.text,
    fontFamily: font.extraBold,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  skillsHint: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 11,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  skillMeter: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 10,
    width: '48%',
  },
  skillMeterTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skillShort: {
    color: colors.textMuted,
    fontFamily: font.extraBold,
    fontSize: 11,
    fontWeight: '900',
  },
  skillScore: {
    color: colors.text,
    fontFamily: font.extraBold,
    fontSize: 18,
    fontWeight: '900',
  },
  skillTrack: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 999,
    height: 6,
    marginTop: 8,
    overflow: 'hidden',
  },
  skillFill: {
    borderRadius: 999,
    height: '100%',
  },
  skillMeterLabel: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 11,
    marginTop: 6,
  },
  avatarHero: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
    paddingTop: 12,
    ...shadows.card,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    width: '100%',
  },
  inventoryButton: {
    backgroundColor: '#D2B5FF22',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inventoryButtonText: {
    color: colors.accent,
    fontFamily: font.bold,
    fontSize: 12,
    fontWeight: '900',
  },
  avatarStage: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
    width: '100%',
  },
  ratingOverlay: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    bottom: 18,
    left: 24,
    minWidth: 68,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute',
  },
  ratingOverlayValue: { color: colors.background, fontFamily: font.extraBold, fontSize: 28, fontWeight: '900' },
  ratingOverlayLabel: { color: colors.background, fontFamily: font.extraBold, fontSize: 10, fontWeight: '900' },
  editAvatarButton: {
    backgroundColor: '#D2B5FF22',
    borderRadius: 999,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  editAvatarText: { color: colors.accent, fontFamily: font.bold, fontSize: 13, fontWeight: '900' },
  section: { marginBottom: 28 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  name: { color: colors.white, fontFamily: font.extraBold, fontSize: 26, fontWeight: '800' },
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
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 14, marginBottom: 14 },
  fifaRatingCard: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fifaRating: { color: colors.background, fontFamily: font.extraBold, fontSize: 34, fontWeight: '900' },
  fifaRatingLabel: { color: colors.background, fontFamily: font.extraBold, fontSize: 11, fontWeight: '900', marginTop: -2 },
  eloDisplayWrap: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statTile: { alignItems: 'center', paddingVertical: 10, width: '33.333%' },
  statTileValue: { fontSize: 28, fontWeight: '900' },
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
  skillRow: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 12 },
  skillLabel: { color: colors.white, fontFamily: font.medium, fontSize: 14, width: 118 },
  skillBarBg: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 3,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  skillBarFill: { backgroundColor: colors.accent, borderRadius: 3, height: '100%' },
  skillValue: { color: colors.textSubtle, fontFamily: font.medium, fontSize: 12, textAlign: 'right', width: 30 },
  skillNote: { color: colors.textSubtle, fontFamily: font.regular, fontSize: 11, fontStyle: 'italic', marginTop: 8 },
  logoutBtn: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  logoutText: { color: colors.danger, fontFamily: font.semiBold, fontWeight: '600' },
});
