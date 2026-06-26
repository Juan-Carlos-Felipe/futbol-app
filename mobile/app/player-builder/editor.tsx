import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { colors, font, spacing, shadows } from '@/lib/theme';
import { AvatarConfig, PlayerProfile } from '@/modules/player-builder/types';
import { AvatarConfigGenerator } from '@/modules/player-builder/services/AvatarConfigGenerator';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const CATEGORIES = [
  { id: 'rostro', label: 'Rostro', fields: ['headShape', 'jawWidth', 'chinHeight'] },
  { id: 'ojos', label: 'Ojos', fields: ['eyesSize', 'eyesDistance'] },
  { id: 'nariz', label: 'Nariz', fields: ['noseWidth', 'noseHeight'] },
  { id: 'boca', label: 'Boca', fields: ['mouthWidth', 'lipThickness'] },
  { id: 'cabello', label: 'Cabello', fields: ['hairStyle', 'hairColor'] },
  { id: 'barba', label: 'Barba', fields: ['beard'] },
  { id: 'cuerpo', label: 'Cuerpo', fields: ['height', 'weight', 'muscle'] },
  { id: 'atrib', label: 'Atributos', fields: ['position'] },
];

export default function AvatarEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [config, setConfig] = useState<AvatarConfig>(() => {
    if (params.initialConfig) {
      try {
        return JSON.parse(params.initialConfig as string);
      } catch (e) {
        return AvatarConfigGenerator.generateRandom();
      }
    }
    return AvatarConfigGenerator.generateRandom();
  });

  const [name, setName] = useState('Nuevo Jugador');
  const [position, setPosition] = useState<'GK' | 'DF' | 'MF' | 'FW'>('MF');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('rostro');
  const [showJson, setShowJson] = useState(false);

  const updateConfig = (key: keyof AvatarConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const player: PlayerProfile = {
      id: Math.random().toString(36).substring(7),
      name,
      position,
      overall: 75, // Valor base
      pace: config.muscle > 60 ? 80 : 70,
      shooting: 70,
      passing: 75,
      dribbling: 80,
      defending: config.muscle > 70 ? 75 : 60,
      physical: Math.round((config.muscle + config.weight / 2) / 1.5),
      avatarConfig: config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    router.push({
      pathname: '/player-builder/summary',
      params: { player: JSON.stringify(player) }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'EDITOR DE JUGADOR',
          headerTitleStyle: { fontFamily: font.extraBold, fontSize: 18, color: colors.white },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.white,
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowJson(!showJson)}>
              <Ionicons name="code-slash" size={24} color={showJson ? colors.accent : colors.white} />
            </TouchableOpacity>
          )
        }}
      />

      <View style={styles.mainLayout}>
        <View style={styles.editorContent}>
          <View style={styles.nameSection}>
             <Text style={styles.label}>Nombre del Jugador</Text>
             <TextInput
               style={styles.nameInput}
               value={name}
               onChangeText={setName}
               placeholder="Ej. Cristiano"
               placeholderTextColor={colors.textMuted}
             />
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {CATEGORIES.map(category => (
              <View key={category.id} style={styles.categoryContainer}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                >
                  <Text style={styles.categoryTitle}>{category.label}</Text>
                  <Ionicons
                    name={expandedCategory === category.id ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textSubtle}
                  />
                </TouchableOpacity>

                {expandedCategory === category.id && (
                  <View style={styles.categoryFields}>
                    {category.fields.map(field => {
                      if (field === 'position') {
                        return (
                          <View key={field} style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Posición</Text>
                            <View style={styles.positionButtons}>
                              {['GK', 'DF', 'MF', 'FW'].map(p => (
                                <TouchableOpacity
                                  key={p}
                                  style={[styles.posButton, position === p && styles.posButtonActive]}
                                  onPress={() => setPosition(p as any)}
                                >
                                  <Text style={[styles.posButtonText, position === p && styles.posButtonTextActive]}>{p}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        );
                      }

                      const val = (config as any)[field];
                      const isSlider = typeof val === 'number';

                      if (isSlider) {
                        return (
                          <View key={field} style={styles.fieldRow}>
                            <View style={styles.fieldLabelRow}>
                              <Text style={styles.fieldLabel}>{field}</Text>
                              <Text style={styles.fieldValue}>{Math.round(val)}</Text>
                            </View>
                            <Slider
                              style={styles.slider}
                              minimumValue={0}
                              maximumValue={100}
                              value={val}
                              onValueChange={(v: number) => updateConfig(field as keyof AvatarConfig, v)}
                              minimumTrackTintColor={colors.accent}
                              maximumTrackTintColor={colors.border}
                              thumbTintColor={colors.accent}
                            />
                          </View>
                        );
                      }

                      return (
                        <View key={field} style={styles.fieldRow}>
                          <Text style={styles.fieldLabel}>{field}</Text>
                          <Text style={styles.textValue}>{String(val)}</Text>
                          <Text style={styles.placeholderNote}>(Selector próximamente)</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Ver Resumen</Text>
          </TouchableOpacity>
        </View>

        {showJson && (
          <View style={styles.jsonPreview}>
            <Text style={styles.jsonTitle}>CONFIGURACIÓN JSON</Text>
            <ScrollView>
              <Text style={styles.jsonCode}>
                {JSON.stringify({ ...config, name, position }, null, 2)}
              </Text>
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  editorContent: {
    flex: 1,
    padding: spacing.lg,
  },
  nameSection: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textSubtle,
    fontFamily: font.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.white,
    fontFamily: font.bold,
    fontSize: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  categoryContainer: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  categoryTitle: {
    color: colors.white,
    fontFamily: font.extraBold,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  categoryFields: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
  },
  fieldRow: {
    marginBottom: spacing.sm,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fieldLabel: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 13,
  },
  fieldValue: {
    color: colors.accent,
    fontFamily: font.bold,
    fontSize: 13,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  textValue: {
    color: colors.white,
    fontFamily: font.bold,
    fontSize: 15,
    marginTop: 4,
  },
  placeholderNote: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  positionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  posButton: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  posButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  posButtonText: {
    color: colors.textSubtle,
    fontFamily: font.bold,
  },
  posButtonTextActive: {
    color: colors.background,
  },
  saveButton: {
    backgroundColor: colors.accent,
    height: 56,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    ...shadows.glow,
  },
  saveButtonText: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  jsonPreview: {
    width: '40%',
    backgroundColor: '#050912',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    padding: spacing.md,
  },
  jsonTitle: {
    color: colors.accent,
    fontFamily: font.extraBold,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  jsonCode: {
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: 10,
  },
});
