import { Image, StyleSheet, View, Animated, ActivityIndicator } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import AvatarPlaceholder from '@/components/avatar/AvatarPlaceholder';
import {
  type AvatarCustomization,
  type AvatarPose,
  getAvatarRenderUrl
} from '@/lib/avatar';
import { colors, radii, shadows } from '@/lib/theme';

type AvatarPreviewProps = {
  avatarUrl: string | null;
  pose: AvatarPose;
  teamColor: string;
  width?: number;
  height?: number;
  autoRotate?: boolean;
  customization?: Partial<AvatarCustomization>;
  showControls?: boolean;
  avatarName?: string;
};

export default function AvatarPreview({
  avatarUrl,
  pose,
  teamColor,
  width = 170,
  height = 240,
  customization,
  avatarName,
}: AvatarPreviewProps) {
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Obtenemos la URL de renderizado 2D realista
  const renderUrl = getAvatarRenderUrl(avatarUrl, pose);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  if (!avatarUrl || !renderUrl) {
    return (
      <AvatarPlaceholder
        size={height > 220 ? 'lg' : 'md'}
        teamColor={teamColor}
        customization={customization}
        label={avatarName}
      />
    );
  }

  return (
    <View style={[styles.container, { width, height }]}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      )}
      <Animated.Image
        source={{ uri: renderUrl }}
        style={[
          styles.image,
          { width, height, opacity: fadeAnim }
        ]}
        resizeMode="contain"
        onLoad={() => setLoading(false)}
      />

      {/* Sombra base para realismo */}
      <View style={styles.shadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    zIndex: 2,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  shadow: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 999,
    bottom: 20,
    height: 15,
    position: 'absolute',
    width: '60%',
    zIndex: 1,
    transform: [{ scaleX: 1.5 }],
  },
});
