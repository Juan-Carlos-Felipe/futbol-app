import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  light?: boolean;
};

export function SectionHeader({ title, subtitle, light = false }: SectionHeaderProps) {
  const textColor = light ? theme.colors.white : theme.colors.dark;
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: textColor, opacity: 0.7 }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontFamily: theme.fonts.bebas,
    fontSize: 24,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: theme.fonts.dmSans,
    fontSize: 14,
    marginTop: 2,
  },
});
