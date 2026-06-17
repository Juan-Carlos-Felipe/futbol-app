import React, { Suspense } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei/native';
import { PlayerAvatarConfig } from '@/types/avatar';
import { colors, font } from '@/lib/theme';
import { SKIN_TONES, SHIRT_COLORS, HAIR_COLORS } from '@/constants/avatarOptions';

interface PlayerModelProps {
  config: PlayerAvatarConfig;
}

function PlayerModel({ config }: PlayerModelProps) {
  const skinColor = SKIN_TONES.find(s => s.id === config.skin)?.color || '#E0AC69';
  const shirtColor = SHIRT_COLORS.find(s => s.id === config.shirtColor)?.color || '#FF0000';
  const hairColor = HAIR_COLORS.find(s => s.id === config.hairColor)?.color || '#090806';

  return (
    <group position={[0, -1, 0]}>
      {/* Cuerpo/Camiseta */}
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[0.8, 1.2, 0.4]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>

      {/* Cabeza */}
      <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Pelo (si tiene) */}
      {config.hair > 0 && (
        <mesh position={[0, 1.75, 0]}>
          <boxGeometry args={[0.55, 0.1, 0.55]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
      )}

      {/* Piernas (Placeholder) */}
      <mesh castShadow receiveShadow position={[-0.2, 0, 0]}>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.2, 0, 0]}>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
    </group>
  );
}

interface PlayerAvatarViewerProps {
  config: PlayerAvatarConfig;
  width?: number;
  height?: number;
  autoRotate?: boolean;
}

export default function PlayerAvatarViewer({
  config,
  width = 300,
  height = 400,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  autoRotate = false
}: PlayerAvatarViewerProps) {
  return (
    <View style={[styles.container, { width, height }]}>
      <Suspense fallback={
        <View style={styles.fallback}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.fallbackText}>Cargando jugador...</Text>
        </View>
      }>
        <Canvas shadows camera={{ position: [0, 0.5, 3], fov: 45 }}>
          <PerspectiveCamera makeDefault position={[0, 0.5, 2.5]} />
          <ambientLight intensity={0.5} />
          <spotLight position={[5, 10, 5]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-5, 5, -5]} intensity={0.5} />

          <PlayerModel config={config} />

          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.4}
            scale={10}
            blur={2.5}
            far={4}
          />
          <Environment preset="city" />
        </Canvas>
      </Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  fallbackText: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 12,
  }
});
