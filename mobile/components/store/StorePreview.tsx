import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { type AvatarPose } from '@/lib/avatar';
import { type StoreItem } from '@/lib/store';
import { font } from '@/lib/theme';

const POSE_EMOJIS: Record<AvatarPose, string> = {
  idle: '⚽',
  arms_crossed: '💪',
  celebration: '🔥',
  focused: '🧘',
};

const POSE_LABELS: Record<AvatarPose, string> = {
  idle: 'Estandar',
  arms_crossed: 'Capitán',
  celebration: 'Celebración',
  focused: 'Concentrado',
};

export function StorePreview({ item, size = 'sm' }: { item: StoreItem; size?: 'sm' | 'lg' }) {
  const large = size === 'lg';

  if (item.type === 'jersey_color' || item.type === 'jersey_design') {
    return (
      <View
        style={[
          styles.jersey,
          {
            backgroundColor: String(item.data?.color ?? '#16a34a'),
            height: large ? 92 : 62,
            width: large ? 92 : 62,
          },
        ]}
      >
        <Text style={[styles.jerseyNumber, { fontSize: large ? 32 : 22 }]}>10</Text>
      </View>
    );
  }

  if (item.type === 'pose') {
    const pose = (item.data?.pose ?? 'idle') as AvatarPose;
    return (
      <View style={styles.poseWrap}>
        <Text style={{ fontSize: large ? 54 : 38 }}>{POSE_EMOJIS[pose] ?? '⚽'}</Text>
        <Text style={styles.poseText}>{POSE_LABELS[pose] ?? item.name}</Text>
      </View>
    );
  }

  if (item.type === 'badge') {
    return <Text style={{ fontSize: large ? 62 : 46 }}>{String(item.data?.icon ?? '⭐')}</Text>;
  }

  const rawGradient = Array.isArray(item.data?.gradient) ? item.data.gradient : [];
  const gradient: readonly [string, string] = [
    typeof rawGradient[0] === 'string' ? rawGradient[0] : '#9ca3af',
    typeof rawGradient[1] === 'string' ? rawGradient[1] : '#6b7280',
  ];

  return (
    <LinearGradient
      colors={gradient}
      style={[
        styles.frame,
        {
          height: large ? 140 : 110,
          width: large ? 102 : 80,
        },
      ]}
    >
      <Text style={styles.frameRating}>99</Text>
      <View style={styles.frameAvatar} />
      <Text style={styles.frameName}>FUT</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    borderRadius: 10,
    justifyContent: 'space-between',
    padding: 9,
  },
  frameAvatar: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 999,
    height: 38,
    width: 38,
  },
  frameName: {
    color: '#ffffff',
    fontFamily: font.extraBold,
    fontSize: 12,
    fontWeight: '900',
  },
  frameRating: {
    alignSelf: 'flex-start',
    color: '#ffffff',
    fontFamily: font.extraBold,
    fontSize: 18,
    fontWeight: '900',
  },
  jersey: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
  },
  jerseyNumber: {
    color: '#ffffff',
    fontFamily: font.extraBold,
    fontWeight: '900',
  },
  poseText: {
    color: '#6b7280',
    fontFamily: font.semiBold,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  poseWrap: { alignItems: 'center' },
});
