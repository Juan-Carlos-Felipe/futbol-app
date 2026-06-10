import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import { useIsFocused } from '@react-navigation/native';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import AvatarPlaceholder from '@/components/avatar/AvatarPlaceholder';
import { ANIMATION_URLS, type AvatarPose } from '@/lib/avatar';

type AvatarViewerProps = {
  avatarUrl: string;
  pose: AvatarPose;
  teamColor: string;
  width?: number;
  height?: number;
  autoRotate?: boolean;
  backgroundColor?: string;
};

type DisposableRenderer = Renderer & { dispose?: () => void };

export default function AvatarViewer({
  avatarUrl,
  pose,
  teamColor,
  width = 200,
  height = 300,
  autoRotate = false,
  backgroundColor,
}: AvatarViewerProps) {
  const animationRef = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const rendererRef = useRef<DisposableRenderer | null>(null);
  const loaderRef = useRef(new GLTFLoader());
  const isFocused = useIsFocused();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    setShowFallback(false);
    const timeout = setTimeout(() => setShowFallback(true), 10000);
    return () => clearTimeout(timeout);
  }, [avatarUrl, pose]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      mixerRef.current?.stopAllAction();
      sceneRef.current?.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else {
          material?.dispose();
        }
      });
      rendererRef.current?.dispose?.();
    };
  }, []);

  async function loadGltf(url: string) {
    return new Promise<GLTF>((resolve, reject) => {
      loaderRef.current.load(url, resolve, undefined, reject);
    });
  }

  async function onContextCreate(gl: ExpoWebGLRenderingContext) {
    const renderer = new Renderer({ gl }) as DisposableRenderer;
    rendererRef.current = renderer;
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(
      backgroundColor ? new THREE.Color(backgroundColor) : new THREE.Color(0x000000),
      backgroundColor ? 1 : 0
    );

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      35,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.4, 2.8);
    camera.lookAt(0, 0.9, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(2, 4, 2);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4ade80, 0.3);
    fillLight.position.set(-2, 2, -1);
    scene.add(fillLight);

    try {
      const avatarGltf = await loadGltf(avatarUrl);
      const avatarModel = avatarGltf.scene;
      avatarModel.position.set(0, -0.9, 0);
      avatarModel.scale.set(1, 1, 1);

      avatarModel.traverse((child: THREE.Object3D) => {
        const mesh = child as THREE.Mesh;
        const name = child.name.toLowerCase();
        if (
          mesh.isMesh &&
          (name.includes('outfit') || name.includes('top') || name.includes('shirt'))
        ) {
          mesh.material = new THREE.MeshLambertMaterial({ color: new THREE.Color(teamColor) });
        }
      });

      scene.add(avatarModel);

      try {
        const animGltf = await loadGltf(ANIMATION_URLS[pose]);
        const mixer = new THREE.AnimationMixer(avatarModel);
        mixerRef.current = mixer;
        if (animGltf.animations.length > 0) {
          mixer.clipAction(animGltf.animations[0]).play();
        }
      } catch {
        if (avatarGltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(avatarModel);
          mixerRef.current = mixer;
          mixer.clipAction(avatarGltf.animations[0]).play();
        }
      }

      setShowFallback(false);
      const clock = new THREE.Clock();

      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        mixerRef.current?.update(clock.getDelta());
        if (autoRotate) {
          avatarModel.rotation.y += 0.005;
        }
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      animate();
    } catch (error) {
      console.error('Error loading 3D avatar:', error);
      setShowFallback(true);
      renderFallbackSphere(scene, camera, renderer, gl, teamColor);
    }
  }

  if (!isFocused || showFallback || Platform.OS === 'web') {
    return (
      <View style={[styles.fallbackWrap, { width, height }]}>
        <AvatarPlaceholder size={height > 220 ? 'lg' : 'md'} teamColor={teamColor} />
      </View>
    );
  }

  return <GLView style={{ width, height }} onContextCreate={onContextCreate} />;
}

function renderFallbackSphere(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: Renderer,
  gl: ExpoWebGLRenderingContext,
  teamColor: string
) {
  const geometry = new THREE.SphereGeometry(0.5, 32, 32);
  const material = new THREE.MeshLambertMaterial({ color: new THREE.Color(teamColor) });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  const animate = () => {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.01;
    renderer.render(scene, camera);
    gl.endFrameEXP();
  };
  animate();
}

const styles = StyleSheet.create({
  fallbackWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
