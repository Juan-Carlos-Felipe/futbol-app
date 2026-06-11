import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AvatarPlaceholder from '@/components/avatar/AvatarPlaceholder';
import {
  DEFAULT_AVATAR_CUSTOMIZATION,
  type AvatarCustomization,
  type AvatarPose,
} from '@/lib/avatar';
import { colors, font, gradients, radii } from '@/lib/theme';

type AvatarViewerProps = {
  avatarUrl: string;
  pose: AvatarPose;
  teamColor: string;
  width?: number;
  height?: number;
  autoRotate?: boolean;
  backgroundColor?: string;
  customization?: Partial<AvatarCustomization>;
  showControls?: boolean;
  avatarName?: string;
};

export default function AvatarViewer({
  pose,
  teamColor,
  width = 200,
  height = 300,
  autoRotate = false,
  customization,
  showControls = true,
  avatarName,
}: AvatarViewerProps) {
  const rotate = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const zoom = useRef(new Animated.Value(1)).current;
  const avatar = useMemo(
    () => ({ ...DEFAULT_AVATAR_CUSTOMIZATION, ...(customization ?? {}) }),
    [customization]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
        onPanResponderMove: (_, gesture) => {
          rotate.setValue(clamp(gesture.dx / 180, -1, 1));
          zoom.setValue(clamp(1 - gesture.dy / 500, 0.9, 1.12));
        },
        onPanResponderRelease: () => {
          Animated.parallel([
            Animated.spring(rotate, { toValue: 0, useNativeDriver: true }),
            Animated.spring(zoom, { toValue: 1, useNativeDriver: true }),
          ]).start();
        },
      }),
    [rotate, zoom]
  );

  useEffect(() => {
    const floatRunner = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1300, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1300, useNativeDriver: true }),
      ])
    );
    floatRunner.start();

    let rotateRunner: Animated.CompositeAnimation | null = null;
    if (autoRotate) {
      rotateRunner = Animated.loop(
        Animated.sequence([
          Animated.timing(rotate, { toValue: 1, duration: 3200, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: -1, duration: 3200, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ])
      );
      rotateRunner.start();
    }

    return () => {
      floatRunner.stop();
      rotateRunner?.stop();
    };
  }, [autoRotate, float, rotate]);

  function adjustZoom(next: number) {
    Animated.spring(zoom, { toValue: next, useNativeDriver: true }).start();
  }

  const rotateY = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-18deg', '18deg'],
  });
  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const shadowScale = float.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.84],
  });

  return (
    <View style={[styles.stage, { width, height }]} {...panResponder.panHandlers}>
      <LinearGradient colors={gradients.card} style={styles.backdrop} />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <View style={styles.gridLine} />

      {avatarName ? <Text style={styles.nameTag} numberOfLines={1}>{avatarName}</Text> : null}
      <Text style={styles.poseTag}>{getPoseLabel(pose)}</Text>

      <Animated.View
        style={[
          styles.shadow,
          {
            transform: [{ scaleX: shadowScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.avatarWrap,
          {
            transform: [{ translateY }, { rotateY }, { scale: zoom }],
          },
        ]}
      >
        <AvatarPlaceholder
          size={height > 220 ? 'lg' : 'md'}
          teamColor={teamColor}
          customization={avatar}
        />
      </Animated.View>

      {showControls ? (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => adjustZoom(1.1)}>
            <Text style={styles.controlText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => adjustZoom(0.94)}>
            <Text style={styles.controlText}>-</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.compatText}>Vista Expo Go compatible</Text>
    </View>
  );
}

function getPoseLabel(pose: AvatarPose) {
  const labels: Record<AvatarPose, string> = {
    jogging: 'Trotando',
    stretching: 'Estirando',
    idle: 'Previo',
    arms_crossed: 'Capitan',
    warmup: 'Calentando',
  };
  return labels[pose];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  glowTop: {
    backgroundColor: 'rgba(210,181,255,0.28)',
    borderRadius: 999,
    height: 130,
    position: 'absolute',
    right: -36,
    top: -28,
    width: 130,
  },
  glowBottom: {
    backgroundColor: 'rgba(111,140,255,0.18)',
    borderRadius: 999,
    bottom: -42,
    height: 160,
    left: -42,
    position: 'absolute',
    width: 160,
  },
  gridLine: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: 62,
    height: 1,
    left: 18,
    position: 'absolute',
    right: 18,
  },
  nameTag: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 12,
    fontWeight: '900',
    left: 14,
    position: 'absolute',
    right: 86,
    top: 14,
  },
  poseTag: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.textMuted,
    fontFamily: font.semiBold,
    fontSize: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 999,
    bottom: 44,
    height: 18,
    position: 'absolute',
    width: 126,
  },
  controls: {
    bottom: 12,
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    right: 12,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  controlText: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 18,
    fontWeight: '900',
  },
  compatText: {
    bottom: 14,
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 10,
    left: 14,
    position: 'absolute',
  },
});
