import { StyleSheet, Text, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import { getLevel } from '@/lib/elo';

type EloDisplayProps = {
  elo: number;
  showLevel?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const FONT_SIZE = {
  sm: 16,
  md: 24,
  lg: 32,
};

export default function EloDisplay({
  elo,
  showLevel = false,
  showProgress = false,
  size = 'md',
}: EloDisplayProps) {
  const level = getLevel(elo);
  const progressWidth = `${level.progress}%` as DimensionValue;

  return (
    <View style={styles.container}>
      <View style={styles.eloRow}>
        <Text
          style={[
            styles.eloText,
            {
              color: level.badgeColor,
              fontSize: FONT_SIZE[size],
            },
          ]}
        >
          {level.icon} ELO: {elo.toLocaleString('es-CL')}
        </Text>
      </View>

      {showLevel ? (
        <View style={[styles.levelBadge, { backgroundColor: `${level.badgeColor}20` }]}>
          <Text style={[styles.levelText, { color: level.badgeColor }]}>
            {level.icon} {level.title}
          </Text>
        </View>
      ) : null}

      {showProgress ? (
        <View style={styles.progressWrap}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Nivel {level.level} -&gt; {level.level + 1}
            </Text>
            <Text style={styles.progressLabel}>{level.progress.toLocaleString('es-CL')}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: level.badgeColor,
                  width: progressWidth,
                },
              ]}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  eloRow: { alignItems: 'flex-start' },
  eloText: { fontWeight: '900' },
  levelBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  levelText: { fontSize: 12, fontWeight: '900' },
  progressWrap: { gap: 5 },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: { color: '#6b7280', fontSize: 11, fontWeight: '800' },
  progressTrack: {
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    height: 6,
    overflow: 'hidden',
  },
  progressFill: { borderRadius: 3, height: 6 },
});
