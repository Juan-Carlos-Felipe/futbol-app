import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import {
  DEFAULT_AVATAR_CUSTOMIZATION,
  DEFAULT_TEAM_COLOR,
  SKIN_TONES,
  type AvatarCustomization,
} from '@/lib/avatar';
import { colors, font } from '@/lib/theme';

type AvatarPlaceholderProps = {
  size?: 'sm' | 'md' | 'lg';
  teamColor?: string;
  customization?: Partial<AvatarCustomization>;
  label?: string;
};

const SIZE = {
  sm: { width: 90, height: 130, head: 24, body: 46 },
  md: { width: 130, height: 180, head: 32, body: 62 },
  lg: { width: 170, height: 230, head: 42, body: 82 },
};

export default function AvatarPlaceholder({
  size = 'md',
  teamColor = DEFAULT_TEAM_COLOR,
  customization,
  label,
}: AvatarPlaceholderProps) {
  const motion = useRef(new Animated.Value(0)).current;
  const shadow = useRef(new Animated.Value(0)).current;
  const dimensions = SIZE[size];
  const avatar = { ...DEFAULT_AVATAR_CUSTOMIZATION, ...(customization ?? {}) };
  const skinColor = SKIN_TONES[avatar.skinTone].color;
  const hairHeight = avatar.hairStyle === 'long' ? dimensions.head * 0.45 : dimensions.head * 0.28;
  const accessoryColor = avatar.accessory === 'captain_band' ? '#f4b740' : colors.accent;

  useEffect(() => {
    const runner = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
      ])
    );
    const shadowRunner = Animated.loop(
      Animated.sequence([
        Animated.timing(shadow, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(shadow, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
      ])
    );

    runner.start();
    shadowRunner.start();
    return () => {
      runner.stop();
      shadowRunner.stop();
    };
  }, [motion, shadow]);

  const frontRotate = motion.interpolate({
    inputRange: [0, 1],
    outputRange: ['-18deg', '18deg'],
  });
  const backRotate = motion.interpolate({
    inputRange: [0, 1],
    outputRange: ['18deg', '-18deg'],
  });
  const shadowScale = shadow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });

  return (
    <View style={[styles.wrap, { width: dimensions.width, height: dimensions.height }]}>
      <Animated.View
        style={[
          styles.groundShadow,
          { transform: [{ scaleX: shadowScale }], width: dimensions.width * 0.62 },
        ]}
      />
      <View
        style={[
          styles.head,
          { backgroundColor: skinColor, width: dimensions.head, height: dimensions.head },
        ]}
      >
        <View
          style={[
            styles.hair,
            {
              backgroundColor: avatar.hairColor,
              height: hairHeight,
              borderTopLeftRadius: dimensions.head,
              borderTopRightRadius: dimensions.head,
            },
          ]}
        />
        {avatar.expression === 'smile' ? <View style={styles.smile} /> : null}
        {avatar.expression === 'serious' ? <View style={styles.serious} /> : null}
        {avatar.accessory === 'headband' ? (
          <View style={[styles.headband, { backgroundColor: accessoryColor }]} />
        ) : null}
      </View>
      <View
        style={[
          styles.body,
          {
            backgroundColor: teamColor,
            width: dimensions.body,
            height: dimensions.body * 0.9,
          },
        ]}
      >
        <Text style={styles.number}>10</Text>
        {avatar.accessory === 'captain_band' ? (
          <View style={[styles.captainBand, { backgroundColor: accessoryColor }]} />
        ) : null}
      </View>
      <Animated.View
        style={[
          styles.arm,
          styles.leftArm,
          { backgroundColor: teamColor, transform: [{ rotate: backRotate }] },
        ]}
      />
      <Animated.View
        style={[
          styles.arm,
          styles.rightArm,
          { backgroundColor: teamColor, transform: [{ rotate: frontRotate }] },
        ]}
      />
      <Animated.View style={[styles.leg, styles.leftLeg, { transform: [{ rotate: frontRotate }] }]} />
      <Animated.View style={[styles.leg, styles.rightLeg, { transform: [{ rotate: backRotate }] }]} />
      <View style={styles.ball} />
      {label ? <Text style={styles.label} numberOfLines={1}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  groundShadow: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 999,
    bottom: 12,
    height: 12,
    position: 'absolute',
  },
  head: {
    borderColor: '#111827',
    borderRadius: 999,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 4,
    zIndex: 3,
  },
  hair: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  smile: {
    alignSelf: 'center',
    borderBottomColor: '#3a2318',
    borderBottomWidth: 2,
    borderRadius: 999,
    bottom: '22%',
    height: 8,
    position: 'absolute',
    width: 16,
  },
  serious: {
    alignSelf: 'center',
    backgroundColor: '#3a2318',
    bottom: '26%',
    height: 2,
    position: 'absolute',
    width: 14,
  },
  headband: {
    height: 4,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '34%',
  },
  body: {
    alignItems: 'center',
    borderColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    zIndex: 2,
  },
  number: {
    color: '#ffffff',
    fontFamily: font.extraBold,
    fontSize: 20,
    fontWeight: '900',
  },
  captainBand: {
    borderRadius: 999,
    height: 8,
    position: 'absolute',
    right: -3,
    top: '32%',
    width: 18,
  },
  arm: {
    borderRadius: 999,
    height: 58,
    position: 'absolute',
    top: '38%',
    width: 12,
  },
  leftArm: {
    left: '25%',
  },
  rightArm: {
    right: '25%',
  },
  leg: {
    backgroundColor: '#111827',
    borderRadius: 999,
    bottom: '16%',
    height: 62,
    position: 'absolute',
    width: 13,
  },
  leftLeg: {
    left: '41%',
  },
  rightLeg: {
    right: '41%',
  },
  ball: {
    backgroundColor: '#ffffff',
    borderColor: '#111827',
    borderRadius: 999,
    borderWidth: 2,
    bottom: 18,
    height: 24,
    position: 'absolute',
    right: '18%',
    width: 24,
  },
  label: {
    bottom: 0,
    color: colors.textMuted,
    fontFamily: font.semiBold,
    fontSize: 11,
    left: 0,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
  },
});
