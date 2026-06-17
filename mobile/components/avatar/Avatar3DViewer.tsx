// ✅ REDISEÑADO con theme.ts
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Animated } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
  type AvatarPose,
  type AvatarCustomization,
  REALISTIC_BASE_MODEL_URL,
  FUT_LIGHTING
} from '@/lib/avatar';
import { colors } from '@/lib/theme';

interface Avatar3DViewerProps {
  avatarUrl?: string | null;
  pose: AvatarPose;
  teamColor: string;
  customization?: Partial<AvatarCustomization>;
  width?: number;
  height?: number;
  autoRotate?: boolean;
}

export default function Avatar3DViewer({
  avatarUrl,
  pose,
  teamColor,
  customization,
  width = 300,
  height = 400,
  autoRotate = true,
}: Avatar3DViewerProps) {
  const [loading, setLoading] = useState(true);
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(loadingAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [loading]);

  const onContextCreate = async (gl: any) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const scene = new THREE.Scene();

    // Camera setup - bust view for premium feel
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.set(0, 1.6, 1.8);
    camera.lookAt(0, 1.55, 0);

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background for FifaCard integration
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting - EA Sports FC style
    const ambientLight = new THREE.AmbientLight(0xffffff, FUT_LIGHTING.ambientIntensity);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(FUT_LIGHTING.directionalColor, FUT_LIGHTING.directionalIntensity);
    mainLight.position.set(1, 4, 3);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(FUT_LIGHTING.rimColor, FUT_LIGHTING.rimIntensity);
    rimLight.position.set(-2, 2, -1);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xd2b5ff, 0.4);
    fillLight.position.set(-1, 0, 1);
    scene.add(fillLight);

    // Model Loading
    const loader = new GLTFLoader();
    const url = avatarUrl || REALISTIC_BASE_MODEL_URL;

    try {
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });

      const model = gltf.scene;
      scene.add(model);

      // Auto-centering and scaling
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.y = -center.y + 0.8; // Adjust to show bust

      // Apply morph targets for facial traits
      if (customization?.traits) {
        model.traverse((child: any) => {
          if (child.isMesh && child.morphTargetInfluences) {
            const traits = customization.traits!;
            // Map our traits to common RPM/Realistic blendshapes
            const morphs = child.morphTargetDictionary;
            if (morphs) {
              if (morphs['mouthSmile']) child.morphTargetInfluences[morphs['mouthSmile']] = customization.expression === 'smile' ? 0.8 : 0;
              if (morphs['jawOpen']) child.morphTargetInfluences[morphs['jawOpen']] = traits.jawShape;
              if (morphs['noseSize']) child.morphTargetInfluences[morphs['noseSize']] = traits.noseShape;
              if (morphs['eyeWideLeft']) child.morphTargetInfluences[morphs['eyeWideLeft']] = traits.eyeDistance;
              if (morphs['eyeWideRight']) child.morphTargetInfluences[morphs['eyeWideRight']] = traits.eyeDistance;
            }
          }
        });
      }

      setLoading(false);

      const render = () => {
        requestAnimationFrame(render);
        if (autoRotate) {
          model.rotation.y += 0.005;
        }
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      render();
    } catch (error) {
      console.error('Error loading 3D model:', error);
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Animated.Text style={[styles.loadingText, { opacity: loadingAnim }]}>
            CARGANDO JUGADOR...
          </Animated.Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  glView: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23,24,39,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.accent,
    marginTop: 12,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
