import { StyleSheet, Text, View } from 'react-native';
import { getLevel } from '@/lib/elo';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, font, radii } from '@/lib/theme';

type EloDisplayProps = {
  elo: number;
  showLevel?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  eloChanged?: boolean;
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

  return (
    <View style={styles.container}>
      <View style={styles.eloRow}>
        <Text style={[styles.eloText, { color: level.badgeColor, fontSize: FONT_SIZE[size] }]}>
          {level.icon} ELO: {elo.toLocaleString('es-CL')}
        </Text>
      </View>

      {showLevel ? (
        <View style={[styles.levelBadge, { backgroundColor: `${level.badgeColor}22` }]}>
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
          <ProgressBar progress={level.progress} color={level.badgeColor} height={6} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  eloRow: { alignItems: 'flex-start' },
  eloText: { fontFamily: font.extraBold, fontWeight: '900' },
  levelBadge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  levelText: { fontFamily: font.bold, fontSize: 12, fontWeight: '900' },
  progressWrap: { gap: 5 },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: { color: colors.textSubtle, fontFamily: font.semiBold, fontSize: 11, fontWeight: '800' },
});
