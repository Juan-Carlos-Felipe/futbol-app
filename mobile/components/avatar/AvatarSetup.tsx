import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AvatarConfigPanel from '@/components/avatar/AvatarConfig';
import AvatarPreview from '@/components/avatar/AvatarPreview';
import RPMWebView from '@/components/avatar/RPMWebView';
import {
  DEMO_AVATAR_URL,
  type AvatarConfig,
  createDefaultAvatarConfig,
  normalizeAvatarConfig,
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
  const [showRPM, setShowRPM] = useState(false);

  useEffect(() => {
    const nextConfig = normalizeAvatarConfig(currentConfig ?? createDefaultAvatarConfig(userId), userId);
    setConfig(nextConfig);
    store.setConfig(nextConfig);
  }, [currentConfig, userId]);

  const previewConfig = useMemo(
    () => ({
      ...config,
      avatarUrl: config.avatarUrl ?? DEMO_AVATAR_URL,
    }),
    [config]
  );

  async function handleRPMAvatar(url: string) {
    setShowRPM(false);
    const nextConfig: AvatarConfig = {
      ...config,
      avatarUrl: url,
      source: 'external_provider',
      provider: 'readyplayerme',
      updatedAt: new Date().toISOString(),
    };
    setConfig(nextConfig);
    store.setConfig(nextConfig);

    // Auto-save when coming back from RPM for better UX
    try {
      await store.save(nextConfig);
      onComplete(nextConfig);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el avatar generado.');
    }
  }

  async function save() {
    try {
      await store.save(config);
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
        <View style={styles.header}>
          <Text style={styles.kicker}>FIFA STYLE AVATAR</Text>
          <Text style={styles.title}>Crea tu Jugador</Text>
          <Text style={styles.subtitle}>
            Genera un avatar realista 3D a partir de una foto para tu carta de jugador.
          </Text>
        </View>

        <View style={styles.previewCard}>
          <AvatarPreview
            avatarUrl={previewConfig.avatarUrl}
            pose={previewConfig.selectedPose}
            teamColor={previewConfig.teamColor}
            customization={previewConfig.customization}
            avatarName={previewConfig.avatarName}
            width={260}
            height={330}
            autoRotate
            showControls
          />
        </View>

        <TouchableOpacity
          style={styles.rpmButton}
          onPress={() => setShowRPM(true)}
        >
          <LinearGradient
            colors={['#8b5cf6', '#d946ef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rpmButtonGradient}
          >
            <Ionicons name="camera" size={24} color={colors.white} />
            <View>
              <Text style={styles.rpmButtonTitle}>CREAR DESDE FOTO</Text>
              <Text style={styles.rpmButtonSub}>Avatar realista (Ready Player Me)</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.configCard}>
          <Text style={styles.sectionTitle}>Ajustes de carta</Text>
          <AvatarConfigPanel config={config} onChange={(nextConfig) => {
            setConfig(nextConfig);
            store.setConfig(nextConfig);
          }} />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, store.loading && styles.saveButtonDisabled]}
          onPress={save}
          disabled={store.loading}
        >
          {store.loading ? <ActivityIndicator color={colors.background} /> : null}
          <Text style={styles.saveText}>{store.loading ? 'Guardando...' : 'Confirmar Avatar'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showRPM} animationType="slide">
        <View style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRPM(false)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editor Realista</Text>
            <View style={{ width: 28 }} />
          </View>
          <RPMWebView onAvatarCreated={handleRPMAvatar} onCancel={() => setShowRPM(false)} />
        </View>
      </Modal>
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
  rpmButton: {
    marginTop: 20,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.glow,
  },
  rpmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  rpmButtonTitle: {
    color: colors.white,
    fontFamily: font.extraBold,
    fontSize: 18,
    fontWeight: '900',
  },
  rpmButtonSub: {
    color: colors.white,
    fontFamily: font.medium,
    fontSize: 12,
    opacity: 0.8,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: colors.backgroundDeep,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: colors.white,
    fontFamily: font.bold,
    fontSize: 18,
  },
  closeButton: {
    padding: 4,
  },
});
