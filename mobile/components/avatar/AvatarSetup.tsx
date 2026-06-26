import { useEffect, useState } from 'react';
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
import AvatarPreview from '@/components/avatar/AvatarPreview';
import FaceOvalCamera, { type FaceCaptureGuide } from '@/components/avatar/FaceOvalCamera';
import {
  type AvatarConfig,
  type AvatarPhotoSource,
  TEAM_COLORS,
  createDefaultAvatarConfig,
  normalizeAvatarConfig,
  uploadProfilePhoto,
} from '@/lib/avatar';
import { useAvatarStore } from '@/lib/avatarStore';
import { colors, font, radii, shadows } from '@/lib/theme';

type AvatarSetupProps = {
  userId: string;
  currentConfig: AvatarConfig | null;
  onComplete: (config: AvatarConfig) => void;
};

export default function AvatarSetup({ userId, currentConfig, onComplete }: AvatarSetupProps) {
  const store = useAvatarStore();
  const [config, setConfig] = useState<AvatarConfig>(() =>
    normalizeAvatarConfig(currentConfig ?? createDefaultAvatarConfig(userId), userId)
  );
  const [selectedPhoto, setSelectedPhoto] = useState<AvatarPhotoSource | null>(
    currentConfig?.photo ?? null
  );
  const [showOvalCamera, setShowOvalCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const nextConfig = normalizeAvatarConfig(currentConfig ?? createDefaultAvatarConfig(userId), userId);
    setConfig(nextConfig);
    setSelectedPhoto(nextConfig.photo ?? null);
    store.setConfig(nextConfig);
  }, [currentConfig, userId]);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para tu perfil.');
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

  async function handleOvalCapture(uri: string, _guide: FaceCaptureGuide) {
    setShowOvalCamera(false);
    await handlePhoto({
      uri,
      source: 'camera',
      createdAt: new Date().toISOString(),
    });
  }

  async function handlePhoto(photo: AvatarPhotoSource) {
    const actions = [{ resize: { width: 900 } }];
    const candidate = await ImageManipulator.manipulateAsync(
      photo.uri,
      actions,
      { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
    );

    const finalPhoto = { ...photo, uri: candidate.uri };
    setSelectedPhoto(finalPhoto);

    const nextConfig: AvatarConfig = {
      ...config,
      avatarUrl: candidate.uri, // Previsualización local
      photo: finalPhoto,
      source: 'photo',
      updatedAt: new Date().toISOString(),
    };

    setConfig(nextConfig);
    store.setConfig(nextConfig);
  }

  async function save() {
    setIsUploading(true);
    try {
      let finalAvatarUrl = config.avatarUrl;

      // Si la foto es local (file://), subirla a Supabase
      if (selectedPhoto?.uri && (selectedPhoto.uri.startsWith('file://') || selectedPhoto.uri.startsWith('content://'))) {
        finalAvatarUrl = await uploadProfilePhoto(userId, selectedPhoto.uri);
      }

      const finalConfig = {
        ...config,
        avatarUrl: finalAvatarUrl,
        photo: selectedPhoto ? { ...selectedPhoto, uri: finalAvatarUrl! } : null,
        updatedAt: new Date().toISOString(),
      };

      await store.save(finalConfig);
      onComplete(finalConfig);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo guardar el perfil.'
      );
    } finally {
      setIsUploading(false);
    }
  }

  if (showOvalCamera) {
    return <FaceOvalCamera onCancel={() => setShowOvalCamera(false)} onCapture={handleOvalCapture} />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>MI PERFIL</Text>
          <Text style={styles.title}>Foto de Jugador</Text>
          <Text style={styles.subtitle}>
            Sube tu mejor foto futbolera para aparecer en las láminas y partidos.
          </Text>
        </View>

        <View style={styles.previewCard}>
          <AvatarPreview
            avatarUrl={config.avatarUrl}
            pose={config.selectedPose}
            teamColor={config.teamColor}
            avatarName={config.avatarName}
            faceAdjustment={config.faceAdjustment}
            width={260}
            height={330}
          />
          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={styles.uploadingText}>Subiendo perfil...</Text>
            </View>
          )}
        </View>

        <View style={styles.photoCard}>
          <View style={styles.photoHeader}>
            <View>
              <Text style={styles.sectionTitle}>Captura tu perfil</Text>
              <Text style={styles.privacyText}>
                La foto se ajustará automáticamente al cuerpo del jugador. Prueba con diferentes poses.
              </Text>
            </View>
            <Ionicons name="camera-reverse-outline" size={24} color={colors.accent} />
          </View>

          {selectedPhoto ? (
            <View style={styles.photoPreviewRow}>
              <Image source={{ uri: selectedPhoto.uri }} style={styles.photoPreview} />
              <View style={styles.photoMeta}>
                <Text style={styles.photoTitle}>Foto seleccionada</Text>
                <Text style={styles.photoSubtitle}>
                  Origen: {selectedPhoto.source === 'camera' ? 'Cámara' : 'Galería'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                setSelectedPhoto(null);
                setConfig(c => ({ ...c, avatarUrl: null, photo: null }));
              }} disabled={isUploading}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={pickPhoto} disabled={isUploading}>
              <Ionicons name="image-outline" size={18} color={colors.text} />
              <Text style={styles.secondaryButtonText}>Subir foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto} disabled={isUploading}>
              <Ionicons name="camera-outline" size={18} color={colors.text} />
              <Text style={styles.secondaryButtonText}>Tomar foto</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.configCard}>
          <Text style={styles.sectionTitle}>Color de Camiseta</Text>
          <Text style={styles.privacyText}>Elige el color de tu equipo para el preview.</Text>
          <View style={styles.colorGrid}>
            {TEAM_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  config.teamColor === color && styles.selectedColor,
                ]}
                onPress={() => setConfig({ ...config, teamColor: color })}
                disabled={isUploading}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (store.loading || isUploading) && styles.saveButtonDisabled]}
          onPress={save}
          disabled={store.loading || isUploading}
        >
          { (store.loading || isUploading) ? <ActivityIndicator color={colors.background} /> : null}
          <Text style={styles.saveText}>{(store.loading || isUploading) ? 'Guardando...' : 'Guardar Perfil'}</Text>
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
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(23,24,39,0.7)',
    justifyContent: 'center',
    zIndex: 10,
  },
  uploadingText: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 14,
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
  configCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
  },
  colorOption: {
    borderRadius: radii.pill,
    height: 40,
    width: 40,
  },
  selectedColor: {
    borderColor: colors.white,
    borderWidth: 3,
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
