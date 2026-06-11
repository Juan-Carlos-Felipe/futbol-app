import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  ACCESSORIES,
  AVATAR_POSES,
  EXPRESSIONS,
  HAIR_COLORS,
  HAIR_STYLES,
  OUTFITS,
  POSE_LABELS,
  SKIN_TONES,
  TEAM_COLORS,
  type AvatarConfig as AvatarConfigModel,
  type AvatarCustomization,
  type AvatarHairStyle,
  type AvatarPose,
} from '@/lib/avatar';
import { colors, font, radii } from '@/lib/theme';

type AvatarConfigProps = {
  config: AvatarConfigModel;
  onChange: (config: AvatarConfigModel) => void;
};

export default function AvatarConfig({ config, onChange }: AvatarConfigProps) {
  function updateConfig(patch: Partial<AvatarConfigModel>) {
    onChange({ ...config, ...patch, updatedAt: new Date().toISOString() });
  }

  function updateCustomization(patch: Partial<AvatarCustomization>) {
    updateConfig({ customization: { ...config.customization, ...patch } });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Nombre del avatar</Text>
        <TextInput
          style={styles.input}
          value={config.avatarName}
          onChangeText={(avatarName) => updateConfig({ avatarName })}
          placeholder="Nombre del avatar"
          placeholderTextColor={colors.textSubtle}
        />
      </View>

      <ConfigSection title="Piel">
        <View style={styles.swatchRow}>
          {Object.entries(SKIN_TONES).map(([key, skin]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.skinSwatch,
                { backgroundColor: skin.color },
                config.customization.skinTone === key && styles.swatchActive,
              ]}
              onPress={() => updateCustomization({ skinTone: key as AvatarCustomization['skinTone'] })}
            >
              <Text style={styles.swatchLabel}>{skin.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ConfigSection>

      <ConfigSection title="Cabello">
        <View style={styles.optionGrid}>
          {Object.entries(HAIR_STYLES).map(([key, label]) => (
            <OptionChip
              key={key}
              label={label}
              active={config.customization.hairStyle === key}
              onPress={() => updateCustomization({ hairStyle: key as AvatarHairStyle })}
            />
          ))}
        </View>
        <View style={styles.colorRow}>
          {HAIR_COLORS.map((hairColor) => (
            <TouchableOpacity
              key={hairColor}
              style={[
                styles.colorSwatch,
                { backgroundColor: hairColor },
                config.customization.hairColor === hairColor && styles.swatchActive,
              ]}
              onPress={() => updateCustomization({ hairColor })}
            />
          ))}
        </View>
      </ConfigSection>

      <ConfigSection title="Ropa">
        <View style={styles.optionGrid}>
          {Object.entries(OUTFITS).map(([key, label]) => (
            <OptionChip
              key={key}
              label={label}
              active={config.customization.outfit === key}
              onPress={() => updateCustomization({ outfit: key as AvatarCustomization['outfit'] })}
            />
          ))}
        </View>
        <View style={styles.colorRow}>
          {TEAM_COLORS.map((teamColor) => (
            <TouchableOpacity
              key={teamColor}
              style={[
                styles.colorSwatch,
                { backgroundColor: teamColor },
                config.teamColor === teamColor && styles.swatchActive,
              ]}
              onPress={() => updateConfig({ teamColor })}
            />
          ))}
        </View>
      </ConfigSection>

      <ConfigSection title="Accesorios">
        <View style={styles.optionGrid}>
          {Object.entries(ACCESSORIES).map(([key, label]) => (
            <OptionChip
              key={key}
              label={label}
              active={config.customization.accessory === key}
              onPress={() => updateCustomization({ accessory: key as AvatarCustomization['accessory'] })}
            />
          ))}
        </View>
      </ConfigSection>

      <ConfigSection title="Expresion">
        <View style={styles.optionGrid}>
          {Object.entries(EXPRESSIONS).map(([key, label]) => (
            <OptionChip
              key={key}
              label={label}
              active={config.customization.expression === key}
              onPress={() => updateCustomization({ expression: key as AvatarCustomization['expression'] })}
            />
          ))}
        </View>
      </ConfigSection>

      <ConfigSection title="Pose">
        <View style={styles.optionGrid}>
          {AVATAR_POSES.map((pose) => (
            <OptionChip
              key={pose}
              label={POSE_LABELS[pose]}
              active={config.selectedPose === pose}
              onPress={() => updateConfig({ selectedPose: pose as AvatarPose })}
            />
          ))}
        </View>
      </ConfigSection>
    </View>
  );
}

function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function OptionChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  fieldBlock: { gap: 8 },
  label: { color: colors.textMuted, fontFamily: font.semiBold, fontSize: 12 },
  input: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: font.medium,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  section: { gap: 10 },
  sectionTitle: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 15,
    fontWeight: '900',
  },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skinSwatch: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    minWidth: 76,
    paddingHorizontal: 8,
  },
  swatchLabel: {
    color: colors.background,
    fontFamily: font.bold,
    fontSize: 10,
    fontWeight: '900',
  },
  swatchActive: {
    borderColor: colors.white,
    borderWidth: 3,
  },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textMuted,
    fontFamily: font.semiBold,
    fontSize: 12,
    fontWeight: '800',
  },
  chipTextActive: {
    color: colors.background,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    width: 34,
  },
});
