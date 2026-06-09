import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

interface StatCardProps {
  value: number | string;
  label: string;
  type: 'win' | 'loss' | 'draw' | 'neutral' | 'gold';
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, type }) => {
  const getStyles = () => {
    switch (type) {
      case 'win':
        return {
          bg: theme.colors.winBg,
          border: theme.colors.winBorder,
          text: theme.colors.win,
        };
      case 'loss':
        return {
          bg: theme.colors.lossBg,
          border: theme.colors.lossBorder,
          text: theme.colors.loss,
        };
      case 'draw':
        return {
          bg: theme.colors.drawBg,
          border: theme.colors.drawBorder,
          text: theme.colors.draw,
        };
      case 'gold':
        return {
          bg: theme.colors.goldLight,
          border: theme.colors.goldDark,
          text: theme.colors.goldDark,
        };
      default:
        return {
          bg: theme.colors.gray100,
          border: theme.colors.gray200,
          text: theme.colors.gray600,
        };
    }
  };

  const colors = getStyles();

  return (
    <View style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.text }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 20,
    textAlign: 'center',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  value: {
    fontFamily: theme.fonts.display,
    fontSize: 48,
  },
  label: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 4,
  },
});
