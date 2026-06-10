import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

type ResultBadgeProps = {
  result: 'win' | 'draw' | 'loss';
};

export function ResultBadge({ result }: ResultBadgeProps) {
  const config = {
    win: { label: 'G', color: theme.colors.win, bg: '#dcfce7' },
    draw: { label: 'E', color: theme.colors.draw, bg: '#fef3c7' },
    loss: { label: 'P', color: theme.colors.loss, bg: '#fee2e2' },
  }[result];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: theme.fonts.bebas,
    fontSize: 14,
  },
});
