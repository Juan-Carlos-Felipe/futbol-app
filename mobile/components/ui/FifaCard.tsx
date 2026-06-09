import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/lib/theme';

interface FifaCardProps {
  name: string;
  rating: number;
  position: string;
  stats: {
    pas: number;
    vel: number;
    tir: number;
    reg: number;
    def: number;
    fis: number;
  };
  rarity?: 'gold' | 'silver' | 'bronze';
}

export const FifaCard: React.FC<FifaCardProps> = ({
  name,
  rating,
  position,
  stats,
  rarity = 'gold',
}) => {
  const getConfig = () => {
    switch (rarity) {
      case 'gold':
        return {
          colors: ['#f59e0b', '#d97706'] as [string, string],
          shadowColor: '#f59e0b',
        };
      case 'silver':
        return {
          colors: ['#9ca3af', '#6b7280'] as [string, string],
          shadowColor: '#9ca3af',
        };
      case 'bronze':
        return {
          colors: ['#b45309', '#92400e'] as [string, string],
          shadowColor: '#92400e',
        };
    }
  };

  const config = getConfig();

  const StatItem = ({ label, value }: { label: string; value: number }) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          shadowColor: config.shadowColor,
          shadowOpacity: 0.5,
          shadowRadius: 15,
          elevation: 10,
        },
      ]}
    >
      <LinearGradient colors={config.colors} style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.rating}>{rating}</Text>
          <Text style={styles.position}>{position}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.name}>{name.toUpperCase()}</Text>

        <View style={styles.divider} />

        <View style={styles.statsGrid}>
          <View style={styles.statsCol}>
            <StatItem label="VEL" value={stats.vel} />
            <StatItem label="TIR" value={stats.tir} />
            <StatItem label="PAS" value={stats.pas} />
          </View>
          <View style={styles.statsCol}>
            <StatItem label="REG" value={stats.reg} />
            <StatItem label="DEF" value={stats.def} />
            <StatItem label="FIS" value={stats.fis} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 180,
    borderRadius: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontFamily: theme.fonts.display,
    fontSize: 52,
    color: theme.colors.white,
    lineHeight: 52,
  },
  position: {
    fontFamily: theme.fonts.display,
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.85,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.white,
    opacity: 0.3,
    marginVertical: 8,
  },
  name: {
    fontFamily: theme.fonts.display,
    fontSize: 20,
    color: theme.colors.white,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  statsCol: {
    gap: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontFamily: theme.fonts.display,
    fontSize: 16,
    color: theme.colors.white,
    minWidth: 20,
  },
  statLabel: {
    fontFamily: theme.fonts.display,
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.7,
  },
});
