import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

type StatCardProps = {
  label: string;
  value: string | number;
  color?: string;
};

export function StatCard({ label, value, color = theme.colors.white }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: 10,
    width: '33.333%',
  },
  value: {
    fontFamily: theme.fonts.bebas,
    fontSize: 28,
  },
  label: {
    color: '#9ca3af',
    fontFamily: theme.fonts.dmSansBold,
    fontSize: 11,
    textTransform: 'uppercase',
    marginTop: 3,
  },
});
