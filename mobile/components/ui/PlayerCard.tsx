import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '@/lib/theme';

type PlayerCardProps = {
  name: string;
  avatarUrl?: string;
  subtitle?: string;
};

export function PlayerCard({ name, avatarUrl, subtitle }: PlayerCardProps) {
  return (
    <View style={styles.container}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>👤</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    ...theme.shadow.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  placeholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 20,
  },
  info: {
    marginLeft: 12,
  },
  name: {
    fontFamily: theme.fonts.dmSansBold,
    fontSize: 16,
    color: theme.colors.dark,
  },
  subtitle: {
    fontFamily: theme.fonts.dmSans,
    fontSize: 12,
    color: theme.colors.gray,
    marginTop: 2,
  },
});
