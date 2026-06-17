import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PlayerAvatarConfig } from '@/types/avatar';
import PlayerAvatarViewer from './PlayerAvatarViewer';

interface AvatarPreviewProps {
  config: PlayerAvatarConfig;
  width?: number;
  height?: number;
  autoRotate?: boolean;
}

export default function AvatarPreview({
  config,
  width,
  height,
  autoRotate
}: AvatarPreviewProps) {
  return (
    <View style={styles.container}>
      <PlayerAvatarViewer
        config={config}
        width={width}
        height={height}
        autoRotate={autoRotate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});
