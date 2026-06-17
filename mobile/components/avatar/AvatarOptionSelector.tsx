import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, font, spacing, radii } from '@/lib/theme';

interface Option {
  id: number;
  label: string;
  color?: string;
}

interface AvatarOptionSelectorProps {
  label: string;
  options: Option[];
  selectedId: number;
  onSelect: (id: number) => void;
}

export default function AvatarOptionSelector({
  label,
  options,
  selectedId,
  onSelect
}: AvatarOptionSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.option,
              selectedId === option.id && styles.optionSelected,
              option.color ? { borderLeftWidth: 10, borderLeftColor: option.color } : null
            ]}
            onPress={() => onSelect(option.id)}
          >
            <Text style={[
              styles.optionText,
              selectedId === option.id && styles.optionTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontFamily: font.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  option: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(210,181,255,0.1)',
  },
  optionText: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 13,
  },
  optionTextSelected: {
    color: colors.accent,
    fontFamily: font.bold,
  }
});
