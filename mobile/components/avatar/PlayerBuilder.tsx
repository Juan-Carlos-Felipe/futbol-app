import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlayerAvatarConfig, AvatarCategory } from '@/types/avatar';
import { colors, font, spacing, radii, shadows } from '@/lib/theme';
import AvatarPreview from './AvatarPreview';
import AvatarOptionSelector from './AvatarOptionSelector';
import AvatarSlider from './AvatarSlider';
import * as Options from '@/constants/avatarOptions';

interface PlayerBuilderProps {
  initialConfig: PlayerAvatarConfig;
  onSave: (config: PlayerAvatarConfig) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES: AvatarCategory[] = ['Rostro', 'Cabello', 'Barba', 'Camiseta', 'Número'];

export default function PlayerBuilder({ initialConfig, onSave, onCancel }: PlayerBuilderProps) {
  const [config, setConfig] = useState<PlayerAvatarConfig>(initialConfig);
  const [activeCategory, setActiveCategory] = useState<AvatarCategory>('Rostro');
  const [saving, setSaving] = useState(false);

  const updateConfig = (key: keyof PlayerAvatarConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Preview Area */}
      <View style={styles.previewContainer}>
        <AvatarPreview config={config} width={280} height={350} autoRotate />

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Jugador</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Categories Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, activeCategory === cat && styles.activeTab]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.tabText, activeCategory === cat && styles.activeTabText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Configuration Panel */}
      <ScrollView style={styles.configPanel} contentContainerStyle={styles.configContent}>
        {activeCategory === 'Rostro' && (
          <>
            <AvatarOptionSelector
              label="Tono de Piel"
              options={Options.SKIN_TONES}
              selectedId={config.skin}
              onSelect={(id) => updateConfig('skin', id)}
            />
            <AvatarSlider label="Forma de Rostro" value={config.faceShape} min={1} max={6} onValueChange={(v) => updateConfig('faceShape', v)} />
            <AvatarSlider label="Ojos" value={config.eyes} min={1} max={6} onValueChange={(v) => updateConfig('eyes', v)} />
            <AvatarSlider label="Cejas" value={config.eyebrows} min={1} max={6} onValueChange={(v) => updateConfig('eyebrows', v)} />
            <AvatarSlider label="Nariz" value={config.nose} min={1} max={6} onValueChange={(v) => updateConfig('nose', v)} />
            <AvatarSlider label="Boca" value={config.mouth} min={1} max={6} onValueChange={(v) => updateConfig('mouth', v)} />
            <AvatarSlider label="Mandíbula" value={config.jaw} min={1} max={6} onValueChange={(v) => updateConfig('jaw', v)} />
          </>
        )}

        {activeCategory === 'Cabello' && (
          <>
            <AvatarOptionSelector
              label="Estilo de Cabello"
              options={Options.HAIR_STYLES}
              selectedId={config.hair}
              onSelect={(id) => updateConfig('hair', id)}
            />
            <AvatarOptionSelector
              label="Color de Cabello"
              options={Options.HAIR_COLORS}
              selectedId={config.hairColor}
              onSelect={(id) => updateConfig('hairColor', id)}
            />
          </>
        )}

        {activeCategory === 'Barba' && (
          <>
            <AvatarOptionSelector
              label="Estilo de Barba"
              options={Options.BEARD_STYLES}
              selectedId={config.beard}
              onSelect={(id) => updateConfig('beard', id)}
            />
            <AvatarOptionSelector
              label="Color de Barba"
              options={Options.HAIR_COLORS}
              selectedId={config.beardColor}
              onSelect={(id) => updateConfig('beardColor', id)}
            />
          </>
        )}

        {activeCategory === 'Camiseta' && (
          <>
            <AvatarOptionSelector
              label="Diseño de Camiseta"
              options={Options.SHIRT_DESIGNS}
              selectedId={config.shirt}
              onSelect={(id) => updateConfig('shirt', id)}
            />
            <AvatarOptionSelector
              label="Color Principal"
              options={Options.SHIRT_COLORS}
              selectedId={config.shirtColor}
              onSelect={(id) => updateConfig('shirtColor', id)}
            />
          </>
        )}

        {activeCategory === 'Número' && (
          <AvatarSlider label="Número de Jugador" value={config.number} min={1} max={99} onValueChange={(v) => updateConfig('number', v)} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  previewContainer: {
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: 'hidden',
  },
  cancelButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 999,
    padding: 8,
  },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.lg,
    ...shadows.card,
  },
  saveButtonText: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  tabsContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSoft,
  },
  activeTab: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.textMuted,
    fontFamily: font.bold,
    fontSize: 13,
  },
  activeTabText: {
    color: colors.background,
  },
  configPanel: {
    flex: 1,
  },
  configContent: {
    padding: 20,
    paddingBottom: 100,
  }
});
