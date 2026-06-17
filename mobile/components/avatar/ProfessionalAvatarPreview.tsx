import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GeneratedFootballAvatar from '@/components/avatar/GeneratedFootballAvatar';
import {
  DEMO_AVATAR_URL,
  DEFAULT_FACE_ADJUSTMENT,
  getReadyPlayerMePreviewUrl,
  isReadyPlayerMeUrl,
  type AvatarFaceAdjustment,
  type AvatarPose,
  type GeneratedAvatarFeatures,
} from '@/lib/avatar';
import { colors, font, radii } from '@/lib/theme';

const REALISTIC_PLAYER_BODY = require('../../assets/avatar/player-body-arms-crossed.png');
const BODY_ASSET = { width: 914, height: 1721 };
const BODY_FACE_BOX = { x: 370, y: 218, width: 176, height: 232 };

type ProfessionalAvatarPreviewProps = {
  avatarUrl: string | null;
  pose: AvatarPose;
  teamColor: string;
  width?: number;
  height?: number;
  faceAdjustment?: AvatarFaceAdjustment;
  generatedFeatures?: GeneratedAvatarFeatures | null;
  avatarName?: string;
  compact?: boolean;
};

export default function ProfessionalAvatarPreview({
  avatarUrl,
  pose,
  teamColor,
  width = 180,
  height = 260,
  faceAdjustment,
  avatarName,
  compact = false,
  generatedFeatures,
}: ProfessionalAvatarPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const loadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRpmAvatar = isReadyPlayerMeUrl(avatarUrl) && avatarUrl !== DEMO_AVATAR_URL;
  const isGeneratedAvatar = Boolean(generatedFeatures || avatarUrl?.startsWith('generated://'));
  const faceUri = !isGeneratedAvatar && avatarUrl && !isRpmAvatar && avatarUrl !== DEMO_AVATAR_URL ? avatarUrl : null;
  const previewUrl = useMemo(
    () => (isRpmAvatar ? getReadyPlayerMePreviewUrl(avatarUrl, compact ? 512 : 768) : null),
    [avatarUrl, compact, isRpmAvatar, retryKey]
  );

  useEffect(() => {
    if (loadTimeout.current) clearTimeout(loadTimeout.current);
    setFailed(false);
    setLoading(Boolean(previewUrl));

    if (!previewUrl) return;

    loadTimeout.current = setTimeout(() => {
      setLoading(false);
      setFailed(true);
    }, 9000);

    return () => {
      if (loadTimeout.current) clearTimeout(loadTimeout.current);
    };
  }, [previewUrl]);

  function retry() {
    setFailed(false);
    setLoading(Boolean(previewUrl));
    setRetryKey((current) => current + 1);
  }

  return (
    <View style={[styles.stage, { width, height }]}>
      <LinearGradient
        colors={['#151827', '#231f36', '#4c3b25']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.backdrop}
      />
      <View style={styles.stadiumLights} />
      <View style={styles.topLight} />
      <View style={[styles.kitGlow, { backgroundColor: teamColor }]} />
      <View style={styles.goldFrame} />

      {avatarName ? <Text style={styles.nameTag} numberOfLines={1}>{avatarName}</Text> : null}
      <Text style={styles.poseTag}>{getPoseLabel(pose)}</Text>

      <View style={styles.floorShadow} />
      {isGeneratedAvatar && generatedFeatures ? (
        <View style={styles.generatedAvatarWrap}>
          <GeneratedFootballAvatar features={generatedFeatures} teamColor={teamColor} />
        </View>
      ) : previewUrl && !failed ? (
        <Image
          key={`${previewUrl}-${retryKey}`}
          source={{ uri: previewUrl }}
          style={[styles.avatarImage, compact && styles.avatarImageCompact]}
          resizeMode="contain"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => {
            if (loadTimeout.current) clearTimeout(loadTimeout.current);
            setLoading(false);
          }}
          onError={() => {
            if (loadTimeout.current) clearTimeout(loadTimeout.current);
            setLoading(false);
            setFailed(true);
          }}
        />
      ) : faceUri ? (
        <PremiumPlayerComposite
          faceUri={faceUri}
          teamColor={teamColor}
          compact={compact}
          faceAdjustment={faceAdjustment}
        />
      ) : (
        <PremiumSilhouette teamColor={teamColor} compact={compact} />
      )}

      {loading ? (
        <View style={styles.loadingLayer}>
          <ActivityIndicator color={colors.warning} />
          <Text style={styles.loadingText}>Cargando avatar</Text>
        </View>
      ) : null}

      {failed ? (
        <View style={styles.errorLayer}>
          <Text style={styles.errorTitle}>No se pudo cargar</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <LinearGradient
        colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.32)']}
        style={styles.depthOverlay}
      />
    </View>
  );
}

function PremiumPlayerComposite({
  faceUri,
  teamColor,
  compact,
  faceAdjustment,
}: {
  faceUri: string;
  teamColor: string;
  compact: boolean;
  faceAdjustment?: AvatarFaceAdjustment;
}) {
  const adjust = faceAdjustment ?? DEFAULT_FACE_ADJUSTMENT;
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const bodyHeight = layout ? layout.height * (compact ? 1.3 : 1.28) : 0;
  const bodyWidth = bodyHeight ? (bodyHeight * BODY_ASSET.width) / BODY_ASSET.height : 0;
  const bodyLeft = layout ? (layout.width - bodyWidth) / 2 : 0;
  const bodyTop = layout ? -layout.height * (compact ? 0.03 : 0.04) : 0;
  const faceFrame = layout
    ? {
        left: bodyLeft + (BODY_FACE_BOX.x / BODY_ASSET.width) * bodyWidth,
        top: bodyTop + (BODY_FACE_BOX.y / BODY_ASSET.height) * bodyHeight,
        width: (BODY_FACE_BOX.width / BODY_ASSET.width) * bodyWidth,
        height: (BODY_FACE_BOX.height / BODY_ASSET.height) * bodyHeight,
      }
    : null;

  return (
    <View
      style={[styles.playerComposite, compact && styles.playerCompositeCompact]}
      onLayout={(event) => setLayout(event.nativeEvent.layout)}
    >
      {layout ? (
        <Image
          source={REALISTIC_PLAYER_BODY}
          style={[
            styles.realBodyImage,
            {
              height: bodyHeight,
              left: bodyLeft,
              top: bodyTop,
              width: bodyWidth,
            },
          ]}
          resizeMode="contain"
        />
      ) : null}
      <View style={[styles.kitColorWash, { backgroundColor: teamColor }]} />
      <View style={[styles.kitStripe, { backgroundColor: lightenTeam(teamColor) }]} />
      {faceFrame ? (
      <View
        style={[
          styles.realFaceFrame,
          {
            height: faceFrame.height,
            left: faceFrame.left,
            top: faceFrame.top,
            width: faceFrame.width,
          },
        ]}
      >
        <Image
          source={{ uri: faceUri }}
          style={[
            styles.faceImage,
            {
              transform: [
                { translateX: adjust.offsetX },
                { translateY: adjust.offsetY },
                { scale: adjust.scale },
              ],
            },
          ]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.16)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.20)']}
          style={styles.faceDepth}
        />
      </View>
      ) : null}
    </View>
  );
}

function PremiumSilhouette({ teamColor, compact }: { teamColor: string; compact: boolean }) {
  return (
    <View style={[styles.silhouette, compact && styles.silhouetteCompact]}>
      <Image source={REALISTIC_PLAYER_BODY} style={styles.silhouetteBodyImage} resizeMode="contain" />
      <View style={[styles.kitColorWash, { backgroundColor: teamColor }]} />
    </View>
  );
}

function lightenTeam(color: string) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return '#6f8cff';

  const amount = 42;
  const channels = [1, 3, 5].map((start) =>
    Math.min(255, parseInt(color.slice(start, start + 2), 16) + amount)
  );

  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function getPoseLabel(pose: AvatarPose) {
  const labels: Record<AvatarPose, string> = {
    jogging: 'Trotando',
    stretching: 'Estirando',
    idle: 'Retrato',
    arms_crossed: 'Capitan',
    warmup: 'Calentando',
  };
  return labels[pose];
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    borderColor: 'rgba(244,183,64,0.28)',
    borderRadius: radii.xl,
    borderWidth: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  backdrop: { ...StyleSheet.absoluteFillObject },
  stadiumLights: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    height: 1,
    left: 18,
    position: 'absolute',
    right: 18,
    top: '28%',
  },
  topLight: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    height: 80,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  kitGlow: {
    bottom: 18,
    height: 88,
    opacity: 0.22,
    position: 'absolute',
    width: '82%',
  },
  goldFrame: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(244,183,64,0.22)',
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  nameTag: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 12,
    fontWeight: '900',
    left: 14,
    position: 'absolute',
    right: 82,
    top: 14,
    zIndex: 4,
  },
  poseTag: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    borderWidth: 1,
    color: colors.text,
    fontFamily: font.semiBold,
    fontSize: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 4,
  },
  floorShadow: {
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderRadius: 999,
    bottom: 22,
    height: 22,
    position: 'absolute',
    width: '62%',
  },
  generatedAvatarWrap: {
    bottom: -18,
    height: '108%',
    left: '-2%',
    position: 'absolute',
    right: '-2%',
    zIndex: 2,
  },
  avatarImage: {
    height: '96%',
    marginBottom: -8,
    width: '104%',
    zIndex: 2,
  },
  avatarImageCompact: {
    height: '102%',
    marginBottom: -10,
    width: '112%',
  },
  playerComposite: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  playerCompositeCompact: {
    bottom: 0,
  },
  realBodyImage: {
    position: 'absolute',
  },
  silhouetteBodyImage: {
    height: '110%',
    width: '110%',
  },
  kitColorWash: {
    borderRadius: 46,
    bottom: '16%',
    height: '28%',
    opacity: 0.18,
    position: 'absolute',
    width: '58%',
    zIndex: 3,
  },
  kitStripe: {
    borderRadius: 999,
    height: 5,
    opacity: 0.64,
    position: 'absolute',
    top: '45%',
    transform: [{ rotate: '-7deg' }],
    width: '48%',
    zIndex: 4,
  },
  realFaceFrame: {
    backgroundColor: '#151827',
    borderRadius: 999,
    overflow: 'hidden',
    position: 'absolute',
    zIndex: 5,
  },
  faceImage: {
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  faceDepth: {
    ...StyleSheet.absoluteFillObject,
  },
  depthOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  loadingLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(16,17,29,0.52)',
    justifyContent: 'center',
    zIndex: 6,
  },
  loadingText: {
    color: colors.text,
    fontFamily: font.semiBold,
    fontSize: 11,
    marginTop: 8,
  },
  errorLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(16,17,29,0.76)',
    justifyContent: 'center',
    padding: 18,
    zIndex: 6,
  },
  errorTitle: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.warning,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: {
    color: colors.background,
    fontFamily: font.bold,
    fontSize: 12,
    fontWeight: '900',
  },
  silhouette: {
    alignItems: 'center',
    height: '78%',
    justifyContent: 'flex-end',
    marginBottom: 22,
    width: '72%',
    zIndex: 2,
  },
  silhouetteCompact: {
    height: '72%',
    width: '68%',
  },
  silhouetteHead: {
    backgroundColor: '#151827',
    borderColor: 'rgba(244,183,64,0.48)',
    borderRadius: 999,
    borderWidth: 1,
    height: 56,
    marginBottom: -2,
    width: 48,
  },
  silhouetteNeck: {
    borderRadius: 8,
    height: 18,
    opacity: 0.92,
    width: 32,
  },
  silhouetteTorso: {
    borderColor: 'rgba(255,255,255,0.25)',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    height: 86,
    width: '72%',
  },
  silhouetteShoulders: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    bottom: 24,
    height: 28,
    position: 'absolute',
    width: '100%',
  },
});
