import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { DEFAULT_TEAM_COLOR } from '@/lib/avatar';

type AvatarPlaceholderProps = {
  size?: 'sm' | 'md' | 'lg';
  teamColor?: string;
};

const SIZE = {
  sm: { width: 90, height: 130, head: 24, body: 46 },
  md: { width: 130, height: 180, head: 32, body: 62 },
  lg: { width: 170, height: 230, head: 42, body: 82 },
};

export default function AvatarPlaceholder({
  size = 'md',
  teamColor = DEFAULT_TEAM_COLOR,
}: AvatarPlaceholderProps) {
  const motion = useRef(new Animated.Value(0)).current;
  const shadow = useRef(new Animated.Value(0)).current;
  const dimensions = SIZE[size];

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
      <View style={[styles.head, { width: dimensions.head, height: dimensions.head }]} />
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
    backgroundColor: '#f8cfa6',
    borderColor: '#111827',
    borderRadius: 999,
    borderWidth: 2,
    marginBottom: 4,
    zIndex: 3,
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
    fontSize: 20,
    fontWeight: '900',
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
});
