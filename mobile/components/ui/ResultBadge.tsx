import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

interface ResultBadgeProps {
  result: 'win' | 'loss' | 'draw';
  size?: 'sm' | 'md' | 'lg';
}

export const ResultBadge: React.FC<ResultBadgeProps> = ({ result, size = 'md' }) => {
  const getBadgeConfig = () => {
    switch (result) {
      case 'win':
        return { label: 'G', color: theme.colors.win, bg: theme.colors.winBg };
      case 'loss':
        return { label: 'P', color: theme.colors.loss, bg: theme.colors.lossBg };
      case 'draw':
        return { label: 'E', color: theme.colors.draw, bg: theme.colors.drawBg };
    }
  };

  const config = getBadgeConfig();
  const sizes = {
    sm: { box: 20, font: 12 },
    md: { box: 28, font: 16 },
    lg: { box: 36, font: 22 },
  };

  const currentSize = sizes[size];

  return (
    <View
      style={[
        styles.badge,
        {
          width: currentSize.box,
          height: currentSize.box,
          borderRadius: currentSize.box / 2,
          backgroundColor: config.bg,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.color,
            fontSize: currentSize.font,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: theme.fonts.display,
  },
});
