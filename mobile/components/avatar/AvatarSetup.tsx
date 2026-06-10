import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AvatarPlaceholder from '@/components/avatar/AvatarPlaceholder';
import AvatarPreview from '@/components/avatar/AvatarPreview';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  AVATAR_POSES,
  DEFAULT_AVATAR_POSE,
  DEFAULT_TEAM_COLOR,
  DEMO_AVATAR_URL,
  POSE_LABELS,
  POSE_ICONS,
  TEAM_COLORS,
  saveAvatarConfig,
  saveAvatarToProfile,
  saveAvatarUrl,
  type AvatarConfig,
  type AvatarPose,
} from '@/lib/avatar';

type AvatarSetupProps = {
  userId: string;
  currentConfig: AvatarConfig | null;
  onComplete: (config: AvatarConfig) => void;
};

const GENERATION_MESSAGES = [
  'Analizando tu foto...',
  'Generando tu avatar...',
  'Aplicando tu camiseta...',
  'Casi listo...',
];

export default function AvatarSetup({ userId, currentConfig, onComplete }: AvatarSetupProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentConfig?.avatarUrl ?? null);
  const [selectedPose, setSelectedPose] = useState<AvatarPose>(
    currentConfig?.selectedPose ?? DEFAULT_AVATAR_POSE
  );
  const [teamColor, setTeamColor] = useState(currentConfig?.teamColor ?? DEFAULT_TEAM_COLOR);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % GENERATION_MESSAGES.length);
    }, 500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const canSave = Boolean(avatarUrl) && !isGenerating;
  const preview = useMemo(() => {
    if (!avatarUrl) {
      return <AvatarPlaceholder size="lg" teamColor={teamColor} />;
    }

    return (
      <AvatarPreview
        avatarUrl={avatarUrl}
        pose={selectedPose}
        teamColor={teamColor}
        width={170}
        height={240}
        autoRotate
      />
    );
  }, [avatarUrl, selectedPose, teamColor]);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    setPhotoUri(result.assets[0].uri);
    await generateAvatar();
  }

  async function generateAvatar() {
    setIsGenerating(true);
    setMessageIndex(0);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setAvatarUrl(DEMO_AVATAR_URL);
      await saveAvatarUrl(userId, DEMO_AVATAR_URL);
    } catch {
      Alert.alert('Error', 'No se pudo generar el avatar. Intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function save() {
    if (!avatarUrl) return;

    const config: AvatarConfig = {
      userId,
      avatarUrl,
      selectedPose,
      teamColor,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveAvatarConfig(config);
      await saveAvatarToProfile(config);
      onComplete(config);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo guardar el avatar.'
      );
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tu avatar 3D</Text>
        <Text style={styles.subtitle}>Sube una foto, elige pose y personaliza la camiseta.</Text>

        <View style={styles.previewCard}>
          {preview}
          {isGenerating ? (
            <View style={styles.generatingOverlay}>
              <ActivityIndicator color="#22c55e" size="large" />
              <Text style={styles.generatingText}>{GENERATION_MESSAGES[messageIndex]}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.uploadButton} onPress={pickPhoto} disabled={isGenerating}>
          <Ionicons name="camera-outline" size={20} color="#07120b" />
          <Text style={styles.uploadText}>
            {photoUri || avatarUrl ? 'Cambiar foto del avatar' : 'Subir mi foto para crear avatar'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Pose</Text>
        <View style={styles.poseGrid}>
          {AVATAR_POSES.map((pose) => {
            const selected = selectedPose === pose;
            return (
              <PressableScale
                key={pose}
                style={[styles.poseCard, selected && styles.poseCardActive]}
                onPress={() => setSelectedPose(pose)}
              >
                <Text style={styles.poseIcon}>{POSE_ICONS[pose]}</Text>
                <Text style={[styles.poseLabel, selected && styles.poseLabelActive]}>
                  {POSE_LABELS[pose]}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Color de camiseta</Text>
        <View style={styles.colorRow}>
          {TEAM_COLORS.map((color) => {
            const selected = color === teamColor;
            return (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  selected && styles.colorSwatchActive,
                ]}
                onPress={() => setTeamColor(color)}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={save}
          disabled={!canSave}
        >
          <Text style={styles.saveText}>Guardar avatar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#0f1117', flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  title: { color: '#ffffff', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#9ca3af', fontSize: 14, lineHeight: 20, marginTop: 4 },
  previewCard: {
    alignItems: 'center',
    backgroundColor: '#08130d',
    borderColor: '#1f3f2c',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 270,
    overflow: 'hidden',
  },
  generatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(15,17,23,0.84)',
    justifyContent: 'center',
  },
  generatingText: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginTop: 12 },
  uploadButton: {
    alignItems: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 14,
  },
  uploadText: { color: '#07120b', fontSize: 15, fontWeight: '900' },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
    marginTop: 22,
  },
  poseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  poseCard: {
    alignItems: 'center',
    backgroundColor: '#1a1d27',
    borderColor: '#2a2d3a',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    width: '31%',
  },
  poseCardActive: { borderColor: '#22c55e', borderWidth: 2 },
  poseIcon: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  poseLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  poseLabelActive: { color: '#22c55e' },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorSwatch: {
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    width: 38,
  },
  colorSwatchActive: {
    borderColor: '#ffffff',
    borderWidth: 3,
    elevation: 6,
    shadowColor: '#ffffff',
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 14,
    marginTop: 26,
    paddingVertical: 15,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
});
