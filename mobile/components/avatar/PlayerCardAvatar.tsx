import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { PlayerAvatarConfig } from '@/types/avatar';
import PlayerAvatarViewer from './PlayerAvatarViewer';

interface PlayerCardAvatarProps {
  config: PlayerAvatarConfig;
  width?: number;
  height?: number;
}

export default function PlayerCardAvatar({ config, width = 200, height = 280 }: PlayerCardAvatarProps) {
  // En Perfil y Card usamos una versión optimizada.
  // Por ahora renderizamos el viewer 3D directamente,
  // pero está preparado para usar un snapshot si fuera necesario por rendimiento.
  return (
    <View style={[styles.container, { width, height }]}>
       <PlayerAvatarViewer
         config={config}
         width={width}
         height={height}
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
