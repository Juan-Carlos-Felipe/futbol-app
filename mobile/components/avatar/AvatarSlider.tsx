import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, font, spacing } from '@/lib/theme';

interface AvatarSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
}

export default function AvatarSlider({
  label,
  value,
  min,
  max,
  onValueChange
}: AvatarSliderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  label: {
    color: colors.textMuted,
    fontFamily: font.bold,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.accent,
    fontFamily: font.extraBold,
    fontSize: 14,
  },
  slider: {
    width: '100%',
    height: 40,
  }
});
