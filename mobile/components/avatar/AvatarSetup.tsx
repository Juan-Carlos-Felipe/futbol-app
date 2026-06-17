import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import AvatarConfigPanel from '@/components/avatar/AvatarConfig';
import AvatarPreview from '@/components/avatar/AvatarPreview';
import FaceOvalCamera, { type FaceCaptureGuide } from '@/components/avatar/FaceOvalCamera';
import RPMWebView, { getReadyPlayerMeCreatorUrl } from '@/components/avatar/RPMWebView';
import { avatarGenerationService } from '@/lib/avatarGenerationService';
import {
  type AvatarConfig,
  type AvatarPhotoSource,
  type GeneratedAvatarFeatures,
  DEFAULT_FACE_ADJUSTMENT,
  createDefaultAvatarConfig,
  normalizeAvatarConfig,
} from '@/lib/avatar';
import { analyzeSelfieForAvatarWithLandmarks, getFaceDetectionMessage } from '@/lib/avatarFaceAnalysis';
import { useAvatarStore } from '@/lib/avatarStore';
import { colors, font, gradients, radii, shadows } from '@/lib/theme';

type AvatarSetupProps = {
  userId: string;
  currentConfig: AvatarConfig | null;
  onComplete: (config: AvatarConfig) => void;
};

const GENERATION_MESSAGES = [
  'Analizando rasgos de la foto...',
  'Preparando modelo base...',
  'Aplicando camiseta y estilo...',
  'Dejando todo listo para guardar...',
];

export default function AvatarSetup({ userId, currentConfig, onComplete }: AvatarSetupProps) {
  const store = useAvatarStore();
  const [config, setConfig] = useState<AvatarConfig>(() =>
    normalizeAvatarConfig(currentConfig ?? createDefaultAvatarConfig(userId), userId)
  );
  const [selectedPhoto, setSelectedPhoto] = useState<AvatarPhotoSource | null>(
    currentConfig?.photo ?? null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [modeMessage, setModeMessage] = useState<string | null>(null);
  const [showRpmCreator, setShowRpmCreator] = useState(false);
  const [showOvalCamera, setShowOvalCamera] = useState(false);
  const rpmCreatorUrl = getReadyPlayerMeCreatorUrl();

  useEffect(() => {
    const nextConfig = normalizeAvatarConfig(currentConfig ?? createDefaultAvatarConfig(userId), userId);
    setConfig(nextConfig);
    setSelectedPhoto(nextConfig.photo ?? null);
    store.setConfig(nextConfig);
  }, [currentConfig, userId]);

  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % GENERATION_MESSAGES.length);
    }, 650);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const providerConfigured = avatarGenerationService.isConfigured();
  const previewConfig = useMemo(
    () => config,
    [config]
  );

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para preparar el avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.86,
    });

    if (result.canceled) return;

    await handlePhoto({
      uri: result.assets[0].uri,
      source: 'library',
      createdAt: new Date().toISOString(),
    });
  }

  async function takePhoto() {
    setShowOvalCamera(true);
  }

  async function handleOvalCapture(uri: string, guide: FaceCaptureGuide) {
    setShowOvalCamera(false);
    await handlePhoto({
      uri,
      source: 'camera',
      createdAt: new Date().toISOString(),
    }, guide);
  }

  async function handlePhoto(photo: AvatarPhotoSource, guide?: FaceCaptureGuide) {
    const prepared = await prepareFacePhoto(photo, guide);
    if (!prepared) {
      const blankConfig: AvatarConfig = {
        ...config,
        avatarUrl: null,
        photo: null,
        source: 'manual',
        provider: null,
        modelFormat: null,
        generatedFeatures: null,
        updatedAt: new Date().toISOString(),
      };
      setSelectedPhoto(null);
      setConfig(blankConfig);
      store.setConfig(blankConfig);
      await store.save(blankConfig);
      return;
    }
    setSelectedPhoto(prepared.photo);
    setConfig((current) => ({
      ...current,
      photo: null,
      source: 'photo',
      generatedFeatures: prepared.features,
      updatedAt: new Date().toISOString(),
    }));
    await generateAvatar(prepared.photo, prepared.features);
  }

  async function prepareFacePhoto(
    photo: AvatarPhotoSource,
    _guide?: FaceCaptureGuide
  ): Promise<{ photo: AvatarPhotoSource; features: GeneratedAvatarFeatures } | null> {
    // No recortamos antes de analizar: algunas camaras entregan una resolucion/orientacion
    // distinta al preview y eso terminaba capturando solo frente/pelo.
    const actions = [{ resize: { width: 900 } }];
    const candidate = await ImageManipulator.manipulateAsync(
      photo.uri,
      actions,
      { base64: true, compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
    );

    const analysis = await analyzeSelfieForAvatarWithLandmarks(candidate.base64 ?? '');
    if (!analysis.detected || !analysis.features) {
      Alert.alert('Rostro no detectado', getFaceDetectionMessage(analysis.reason));
      return null;
    }

    return {
      photo: {
        ...photo,
        uri: candidate.uri,
      },
      features: analysis.features,
    };
  }

  async function generateAvatar(photo: AvatarPhotoSource, features: GeneratedAvatarFeatures) {
    setIsGenerating(true);
    setMessageIndex(0);
    setModeMessage(null);

    try {
      const result = await avatarGenerationService.generateFromPhoto({
        userId,
        photo,
        avatarName: config.avatarName,
        teamColor: config.teamColor,
        customization: config.customization,
        generatedFeatures: features,
      });

      const nextConfig: AvatarConfig = {
        ...config,
        avatarUrl: result.avatarUrl,
        photo: null,
        source: result.provider === 'local-face-analysis' || !result.provider ? 'photo' : 'external_provider',
        provider: result.provider,
        modelFormat: result.modelFormat,
        faceAdjustment: DEFAULT_FACE_ADJUSTMENT,
        generatedFeatures: features,
        avatarVersion: 2,
        updatedAt: new Date().toISOString(),
      };

      setConfig(nextConfig);
      store.setConfig(nextConfig);
      await store.save(nextConfig);
      setModeMessage(result.message);
    } catch (error) {
      Alert.alert(
        'No se pudo generar',
        error instanceof Error ? error.message : 'Intenta nuevamente con otra foto.'
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleReadyPlayerMeAvatar(avatarUrl: string) {
    const nextConfig: AvatarConfig = {
      ...config,
      avatarUrl,
      source: 'external_provider',
      provider: 'readyplayerme',
      modelFormat: avatarUrl.endsWith('.gltf') ? 'gltf' : 'glb',
      updatedAt: new Date().toISOString(),
    };

    try {
      setConfig(nextConfig);
      store.setConfig(nextConfig);
      await store.save(nextConfig);
      setShowRpmCreator(false);
      onComplete(nextConfig);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo guardar el avatar profesional.'
      );
    }
  }

  async function save() {
    const nextConfig = avatarGenerationService.buildManualConfig({
      ...config,
      photo: selectedPhoto,
      updatedAt: new Date().toISOString(),
    });

    try {
      await store.save(nextConfig);
      onComplete(nextConfig);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo guardar el avatar.'
      );
    }
  }

  if (showRpmCreator) {
    return (
      <View style={styles.screen}>
        <View style={styles.rpmHeader}>
          <TouchableOpacity style={styles.rpmCloseButton} onPress={() => setShowRpmCreator(false)}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={styles.secondaryButtonText}>Volver</Text>
          </TouchableOpacity>
          <Text style={styles.rpmTitle}>Ready Player Me</Text>
        </View>
        {rpmCreatorUrl ? (
          <RPMWebView creatorUrl={rpmCreatorUrl} onAvatarCreated={handleReadyPlayerMeAvatar} />
        ) : null}
      </View>
    );
  }

  if (showOvalCamera) {
    return <FaceOvalCamera onCancel={() => setShowOvalCamera(false)} onCapture={handleOvalCapture} />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>MI AVATAR</Text>
          <Text style={styles.title}>Creador 3D</Text>
          <Text style={styles.subtitle}>
            Personaliza tu jugador, guarda cambios y deja preparado el flujo desde selfie.
          </Text>
        </View>

        <View style={styles.previewCard}>
          <AvatarPreview
            avatarUrl={previewConfig.avatarUrl}
            pose={previewConfig.selectedPose}
            teamColor={previewConfig.teamColor}
            customization={previewConfig.customization}
            faceAdjustment={previewConfig.faceAdjustment}
            generatedFeatures={previewConfig.generatedFeatures}
            avatarName={previewConfig.avatarName}
            width={260}
            height={330}
            autoRotate
            showControls
          />
          {isGenerating ? (
            <View style={styles.generatingOverlay}>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={styles.generatingText}>{GENERATION_MESSAGES[messageIndex]}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.photoCard}>
          <View style={styles.photoHeader}>
            <View>
              <Text style={styles.sectionTitle}>Crear avatar desde foto</Text>
              <Text style={styles.privacyText}>
                Toma la foto con el rostro dentro del ovalo. La app lo ajusta al cuerpo del jugador.
              </Text>
            </View>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.accent} />
          </View>

          {selectedPhoto ? (
            <View style={styles.photoPreviewRow}>
              <Image source={{ uri: selectedPhoto.uri }} style={styles.photoPreview} />
              <View style={styles.photoMeta}>
                <Text style={styles.photoTitle}>Selfie lista</Text>
                <Text style={styles.photoSubtitle}>
                  Origen: {selectedPhoto.source === 'camera' ? 'Camara' : 'Galeria'}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={pickPhoto} disabled={isGenerating}>
              <Ionicons name="image-outline" size={18} color={colors.text} />
              <Text style={styles.secondaryButtonText}>Subir selfie</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto} disabled={isGenerating}>
              <Ionicons name="camera-outline" size={18} color={colors.text} />
              <Text style={styles.secondaryButtonText}>Tomar foto</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.rpmButton}
            onPress={async () => {
              if (!rpmCreatorUrl) {
                setShowOvalCamera(true);
                return;
              }
              setShowRpmCreator(true);
            }}
            disabled={isGenerating}
          >
            <Ionicons name="body-outline" size={18} color={colors.background} />
            <Text style={styles.rpmButtonText}>Crear avatar profesional</Text>
          </TouchableOpacity>

          <Text style={styles.providerStatus}>
            {providerConfigured
              ? 'Proveedor externo configurado para generar GLB/GLTF.'
              : 'Modo foto activo: captura tu rostro y se adapta al jugador de la lamina.'}
          </Text>
          {modeMessage ? <Text style={styles.modeMessage}>{modeMessage}</Text> : null}
        </View>

        <View style={styles.configCard}>
          <AvatarConfigPanel config={config} onChange={(nextConfig) => {
            setConfig(nextConfig);
            store.setConfig(nextConfig);
          }} />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (isGenerating || store.loading) && styles.saveButtonDisabled]}
          onPress={save}
          disabled={isGenerating || store.loading}
        >
          {store.loading ? <ActivityIndicator color={colors.background} /> : null}
          <Text style={styles.saveText}>{store.loading ? 'Guardando...' : 'Guardar avatar'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 18, paddingBottom: 38 },
  header: { marginBottom: 16 },
  kicker: {
    color: colors.accent,
    fontFamily: font.bold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontFamily: font.extraBold,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 4,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  previewCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 356,
    overflow: 'hidden',
    paddingVertical: 12,
    ...shadows.card,
  },
  generatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(23,24,39,0.86)',
    justifyContent: 'center',
  },
  generatingText: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 12,
  },
  photoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  photoHeader: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  sectionTitle: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 16,
    fontWeight: '900',
  },
  privacyText: {
    color: colors.textSubtle,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    maxWidth: 280,
  },
  photoPreviewRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.lg,
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    padding: 10,
  },
  photoPreview: { borderRadius: radii.md, height: 64, width: 64 },
  photoMeta: { flex: 1 },
  photoTitle: { color: colors.text, fontFamily: font.bold, fontSize: 14, fontWeight: '900' },
  photoSubtitle: { color: colors.textSubtle, fontFamily: font.regular, fontSize: 12, marginTop: 3 },
  photoActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  rpmHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  rpmCloseButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  rpmTitle: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 13,
    fontWeight: '900',
  },
  rpmButton: {
    alignItems: 'center',
    backgroundColor: colors.warning,
    borderRadius: radii.lg,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 13,
  },
  rpmButtonText: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 13,
    fontWeight: '900',
  },
  providerStatus: {
    color: colors.textMuted,
    fontFamily: font.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  modeMessage: {
    color: colors.warning,
    fontFamily: font.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  configCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 18,
    paddingVertical: 16,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveText: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 15,
    fontWeight: '900',
  },
});
