import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

interface PlayerCardProps {
  name: string;
  position?: string;
  avatarUrl?: string;
  streak?: number;
  elo?: number;
  result?: 'win' | 'loss' | 'draw';
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  position,
  avatarUrl,
  streak,
  elo,
  result,
}) => {
  const getResultColor = () => {
    switch (result) {
      case 'win': return theme.colors.win;
      case 'loss': return theme.colors.loss;
      case 'draw': return theme.colors.draw;
      default: return 'transparent';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder]}>
            <Text style={styles.initials}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          {(position || elo) && (
            <Text style={styles.subtitle}>
              {position}{position && elo ? ' • ' : ''}{elo ? `ELO ${elo}` : ''}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.right}>
        {streak !== undefined && streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak}</Text>
          </View>
        )}
        {result && <View style={[styles.resultDot, { backgroundColor: getResultColor() }]} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    padding: 12,
    borderRadius: theme.radius.md,
    ...theme.shadow.sm,
    marginBottom: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  placeholder: {
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: theme.colors.primaryMid,
    fontWeight: '700',
    fontSize: 18,
  },
  info: {
    marginLeft: 12,
  },
  name: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: theme.colors.gray900,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.gray400,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    backgroundColor: theme.colors.goldLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.goldDark,
  },
  resultDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
