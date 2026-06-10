import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import type { TeamStats } from '@/lib/matchmaking';
import { getLevel } from '@/lib/elo';

type RankingRowProps = {
  position: number;
  team: TeamStats & { name: string };
  isMyTeam?: boolean;
  onPress: () => void;
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'E';
}

function getPositionBackground(position: number) {
  if (position <= 3) return '#fef3c7';
  if (position <= 10) return '#f9fafb';
  return '#ffffff';
}

function getMedal(position: number) {
  if (position === 1) return '🥇';
  if (position === 2) return '🥈';
  if (position === 3) return '🥉';
  return null;
}

export function RankingRow({ position, team, isMyTeam = false, onPress }: RankingRowProps) {
  const medal = getMedal(position);
  const level = getLevel(team.elo);
  const winRate =
    team.matches_played > 0 ? Math.round((team.wins / team.matches_played) * 100) : 0;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: getPositionBackground(position) },
        isMyTeam && styles.myTeamRow,
      ]}
      activeOpacity={0.82}
      onPress={onPress}
    >
      <View style={styles.positionColumn}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={[styles.position, position <= 10 && styles.positionTopTen]}>
            {position.toLocaleString('es-CL')}
          </Text>
        )}
      </View>

      <View style={styles.teamColumn}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitial(team.name)}</Text>
        </View>
        <View style={styles.teamText}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {team.name}
            </Text>
            {isMyTeam ? <Text style={styles.mineText}>(Tu)</Text> : null}
          </View>
          <View style={styles.miniStats}>
            <Text style={[styles.miniStat, styles.winText]}>
              {team.wins.toLocaleString('es-CL')}g
            </Text>
            <Text style={[styles.miniStat, styles.drawText]}>
              {team.draws.toLocaleString('es-CL')}e
            </Text>
            <Text style={[styles.miniStat, styles.lossText]}>
              {team.losses.toLocaleString('es-CL')}p
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.eloColumn}>
        <Text style={[styles.elo, { color: level.badgeColor }]}>
          ⚡ {team.elo.toLocaleString('es-CL')}
        </Text>
        <Text style={[styles.winRate, { color: level.badgeColor }]} numberOfLines={1}>
          {level.title}
        </Text>
        <Text style={styles.winRate}>{winRate.toLocaleString('es-CL')}%</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  myTeamRow: {
    backgroundColor: '#fefce8',
    borderLeftColor: '#f59e0b',
    borderLeftWidth: 3,
  },
  positionColumn: { alignItems: 'center', width: 44 },
  medal: { fontSize: 24 },
  position: { color: '#6b7280', fontSize: 18, fontWeight: '900' },
  positionTopTen: { color: '#d97706' },
  teamColumn: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10 },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  teamText: { flex: 1 },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  name: { color: '#111827', flexShrink: 1, fontSize: 15, fontWeight: '900' },
  mineText: { color: '#16a34a', fontSize: 12, fontWeight: '900' },
  miniStats: { flexDirection: 'row', gap: 6, marginTop: 4 },
  miniStat: { fontSize: 12, fontWeight: '800' },
  winText: { color: '#16a34a' },
  drawText: { color: '#ca8a04' },
  lossText: { color: '#dc2626' },
  eloColumn: { alignItems: 'flex-end', width: 80 },
  elo: { color: '#d97706', fontSize: 20, fontWeight: '900' },
  winRate: { color: '#6b7280', fontSize: 12, fontWeight: '700', marginTop: 2 },
});
