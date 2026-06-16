import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Switch,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import {
  FaceTraits,
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
  generateFaceSVG,
} from '@/lib/faceStylization';
import { colors, font, radii, shadows } from '@/lib/theme';

const { width: screenWidth } = Dimensions.get('window');

interface TraitSelectorProps {
  photoUri: string;
  onComplete: (traits: FaceTraits) => void;
  onBack: () => void;
}

const DEFAULT_TRAITS: FaceTraits = {
  skinTone: SKIN_TONES[3].value,
  hairColor: HAIR_COLORS[0].value,
  hairStyle: 'corto',
  eyeColor: EYE_COLORS[0].value,
  faceShape: 'oval',
  hasBeard: false,
  beardStyle: 'none',
  eyebrowThickness: 'normales',
  hasMustache: false,
};

export default function TraitSelector({ photoUri, onComplete, onBack }: TraitSelectorProps) {
  const [traits, setTraits] = useState<FaceTraits>(DEFAULT_TRAITS);

  const updateTrait = (patch: Partial<FaceTraits>) => {
    setTraits((prev) => ({ ...prev, ...patch }));
  };

  return (
    <View style={styles.container}>
      {/* PANEL SUPERIOR */}
      <View style={styles.topPanel}>
        <View style={styles.previewColumn}>
          <View style={[styles.imageContainer, { borderColor: '#EAB308' }]}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          </View>
          <Text style={styles.previewLabel}>Tu foto 📷</Text>
        </View>

        <View style={styles.previewColumn}>
          <View style={[styles.imageContainer, { borderColor: '#22C55E' }]}>
            <SvgXml xml={generateFaceSVG(traits)} width="100%" height="100%" />
          </View>
          <Text style={styles.previewLabel}>Tu avatar ⚽</Text>
        </View>
      </View>

      {/* PANEL INFERIOR */}
      <ScrollView style={styles.bottomPanel} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.instruction}>Mirá tu foto y elegí tus rasgos</Text>

        {/* SECCIÓN 1 - Tono de piel */}
        <SectionTitle title="🎨 Color de piel" />
        <View style={styles.colorRow}>
          {SKIN_TONES.map((color) => (
            <TouchableOpacity
              key={color.value}
              onPress={() => updateTrait({ skinTone: color.value })}
              style={[
                styles.colorCircle,
                { backgroundColor: color.value },
                traits.skinTone === color.value && styles.colorCircleActive,
              ]}
            />
          ))}
        </View>

        {/* SECCIÓN 2 - Forma de cara */}
        <SectionTitle title="👤 Forma de cara" />
        <View style={styles.pillRow}>
          <Pill
            label="Ovalada"
            active={traits.faceShape === 'oval'}
            onPress={() => updateTrait({ faceShape: 'oval' })}
          />
          <Pill
            label="Redonda"
            active={traits.faceShape === 'redonda'}
            onPress={() => updateTrait({ faceShape: 'redonda' })}
          />
          <Pill
            label="Cuadrada"
            active={traits.faceShape === 'cuadrada'}
            onPress={() => updateTrait({ faceShape: 'cuadrada' })}
          />
        </View>

        {/* SECCIÓN 3 - Cabello */}
        <SectionTitle title="💈 Color de cabello" />
        <View style={styles.colorRow}>
          {HAIR_COLORS.map((color) => (
            <TouchableOpacity
              key={color.value}
              onPress={() => updateTrait({ hairColor: color.value })}
              style={[
                styles.colorCircle,
                { backgroundColor: color.value },
                traits.hairColor === color.value && styles.colorCircleActive,
              ]}
            />
          ))}
        </View>

        <SectionTitle title="✂️ Estilo de cabello" />
        <View style={styles.pillRow}>
          <Pill
            label="Corto"
            active={traits.hairStyle === 'corto'}
            onPress={() => updateTrait({ hairStyle: 'corto' })}
          />
          <Pill
            label="Media"
            active={traits.hairStyle === 'media'}
            onPress={() => updateTrait({ hairStyle: 'media' })}
          />
          <Pill
            label="Largo"
            active={traits.hairStyle === 'largo'}
            onPress={() => updateTrait({ hairStyle: 'largo' })}
          />
          <Pill
            label="Rizado"
            active={traits.hairStyle === 'rizado'}
            onPress={() => updateTrait({ hairStyle: 'rizado' })}
          />
          <Pill
            label="Calvo"
            active={traits.hairStyle === 'calvo'}
            onPress={() => updateTrait({ hairStyle: 'calvo' })}
          />
        </View>

        {/* SECCIÓN 4 - Ojos y cejas */}
        <SectionTitle title="👁 Color de ojos" />
        <View style={styles.colorRow}>
          {EYE_COLORS.map((color) => (
            <TouchableOpacity
              key={color.value}
              onPress={() => updateTrait({ eyeColor: color.value })}
              style={[
                styles.colorCircle,
                { backgroundColor: color.value },
                traits.eyeColor === color.value && styles.colorCircleActive,
              ]}
            />
          ))}
        </View>

        <SectionTitle title="〰️ Cejas" />
        <View style={styles.pillRow}>
          <Pill
            label="Finas"
            active={traits.eyebrowThickness === 'finas'}
            onPress={() => updateTrait({ eyebrowThickness: 'finas' })}
          />
          <Pill
            label="Normales"
            active={traits.eyebrowThickness === 'normales'}
            onPress={() => updateTrait({ eyebrowThickness: 'normales' })}
          />
          <Pill
            label="Gruesas"
            active={traits.eyebrowThickness === 'gruesas'}
            onPress={() => updateTrait({ eyebrowThickness: 'gruesas' })}
          />
        </View>

        {/* SECCIÓN 5 - Barba y bigote */}
        <View style={styles.switchRow}>
          <SectionTitle title="🧔 ¿Tenés barba?" />
          <Switch
            value={traits.hasBeard}
            onValueChange={(val) => updateTrait({ hasBeard: val })}
            trackColor={{ false: colors.surfaceMuted, true: '#22C55E' }}
          />
        </View>

        {traits.hasBeard && (
          <View style={styles.pillRow}>
            <Pill
              label="Incipiente"
              active={traits.beardStyle === 'stubble'}
              onPress={() => updateTrait({ beardStyle: 'stubble' })}
            />
            <Pill
              label="Corta"
              active={traits.beardStyle === 'short'}
              onPress={() => updateTrait({ beardStyle: 'short' })}
            />
            <Pill
              label="Completa"
              active={traits.beardStyle === 'full'}
              onPress={() => updateTrait({ beardStyle: 'full' })}
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <SectionTitle title="👨‍🦱 ¿Tenés bigote?" />
          <Switch
            value={traits.hasMustache}
            onValueChange={(val) => updateTrait({ hasMustache: val })}
            trackColor={{ false: colors.surfaceMuted, true: '#22C55E' }}
          />
        </View>

        <TouchableOpacity style={styles.completeButton} onPress={() => onComplete(traits)}>
          <Text style={styles.completeButtonText}>Crear mi avatar →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Volver a tomar foto</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topPanel: {
    height: '40%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingTop: 40,
    backgroundColor: colors.backgroundDeep,
  },
  previewColumn: {
    width: '44%',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewLabel: {
    marginTop: 8,
    fontSize: 11,
    color: colors.textSubtle,
    fontFamily: font.medium,
  },
  bottomPanel: {
    height: '60%',
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  instruction: {
    fontSize: 13,
    color: colors.textSubtle,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: font.medium,
  },
  sectionTitle: {
    fontSize: 14,
    color: colors.text,
    fontFamily: font.bold,
    marginTop: 16,
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorCircleActive: {
    borderColor: '#fff',
    borderWidth: 3,
    ...shadows.glow,
    shadowColor: '#EAB308',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  pillText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: font.semiBold,
  },
  pillTextActive: {
    color: colors.background,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  completeButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  completeButtonText: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 13,
  },
});
