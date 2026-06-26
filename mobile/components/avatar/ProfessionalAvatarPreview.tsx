import { useMemo, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DEFAULT_FACE_ADJUSTMENT,
  type AvatarFaceAdjustment,
  type AvatarPose,
} from '@/lib/avatar';
import { colors, font, radii } from '@/lib/theme';

const REALISTIC_PLAYER_BODY = require('../../assets/avatar/player-body-arms-crossed.png');
const BODY_ASSET = { width: 914, height: 1721 };
// Ajustamos el face box para que sea un poco más grande y tome cuello/pecho
const BODY_FACE_BOX = { x: 360, y: 200, width: 196, height: 260 };

type ProfessionalAvatarPreviewProps = {
  avatarUrl: string | null;
  pose: AvatarPose;
  teamColor: string;
  width?: number;
  height?: number;
  faceAdjustment?: AvatarFaceAdjustment;
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
}: ProfessionalAvatarPreviewProps) {
  // En el nuevo sistema, avatarUrl es directamente la URI de la foto
  const faceUri = avatarUrl;

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

      {faceUri ? (
        <PremiumPlayerComposite
          faceUri={faceUri}
          teamColor={teamColor}
          compact={compact}
          faceAdjustment={faceAdjustment}
        />
      ) : (
        <PremiumSilhouette teamColor={teamColor} compact={compact} />
      )}

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
    idle: 'Retrato',
    arms_crossed: 'Capitán',
  };
  return labels[pose] || 'Jugador';
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
});
