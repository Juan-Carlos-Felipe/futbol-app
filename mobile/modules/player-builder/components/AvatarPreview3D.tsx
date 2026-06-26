import React, { Suspense } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei/native';
import { AvatarConfig } from '../types';
import { AvatarConfigApplier } from '../services/avatar3d/AvatarConfigApplier';
import { AvatarModelService } from '../services/avatar3d/AvatarModelService';
import * as THREE from 'three';

interface Props {
  config: AvatarConfig;
  mode?: 'editor' | 'card' | 'thumbnail';
}

function AvatarModel({ config, mode }: Props) {
  const [model, setModel] = React.useState<THREE.Group | null>(null);

  React.useEffect(() => {
    AvatarModelService.loadBaseModel().then(setModel);
  }, []);

  React.useLayoutEffect(() => {
    if (model) {
      AvatarConfigApplier.apply(model, config);
    }
  }, [model, config]);

  if (!model) return null;

  return <primitive object={model} />;
}

export function AvatarPreview3D({ config, mode = 'editor' }: Props) {
  const isCard = mode === 'card';
  const isThumbnail = mode === 'thumbnail';

  return (
    <View style={[
      styles.container,
      isCard && styles.cardContainer,
      isThumbnail && styles.thumbnailContainer
    ]}>
      <Canvas>
        <PerspectiveCamera
          makeDefault
          position={isCard ? [0, 1.7, 0.6] : (isThumbnail ? [0, 1.7, 0.4] : [0, 1.6, 1.2])}
          fov={isCard ? 35 : (isThumbnail ? 30 : 40)}
        />
        {!isThumbnail && (
          <OrbitControls
            enablePan={false}
            enableZoom={!isCard}
            minDistance={0.5}
            maxDistance={3}
            target={isCard ? [0, 1.65, 0] : [0, 1.5, 0]}
          />
        )}

        <ambientLight intensity={0.6} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        <Suspense fallback={null}>
          <AvatarModel config={config} mode={mode} />
          <Environment preset="city" />
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.4}
            scale={10}
            blur={2.5}
            far={4}
          />
        </Suspense>
      </Canvas>

      {!isCard && !isThumbnail && (
        <View style={styles.overlay}>
          <Text style={styles.debugText}>Preview 3D Beta</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 350,
    backgroundColor: '#0a0d14',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardContainer: {
    height: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  thumbnailContainer: {
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: '#1e293b',
    borderWidth: 0,
  },
  overlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  debugText: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
