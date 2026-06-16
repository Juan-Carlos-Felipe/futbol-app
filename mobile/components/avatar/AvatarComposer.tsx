import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { generateFaceSVG, FaceTraits } from '@/lib/faceStylization';

// Definimos las poses según el tipo en lib/avatar.ts
export type AvatarPose = 'arms_crossed' | 'jogging' | 'stretching' | 'idle' | 'warmup';

interface AvatarComposerProps {
  traits: FaceTraits | null;
  teamColor: string;
  pose: AvatarPose;
  width?: number; // default 280
  height?: number; // default 400
}

// Map de imágenes de cuerpo (usar assets locales si existen, o placeholders)
// Jules: Como no encontré las imágenes en assets, uso placeholders que representen el cuerpo
const POSE_IMAGES: Record<AvatarPose, any> = {
  arms_crossed: { uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=body_arms&backgroundColor=transparent&top[]&accessories[]&clothing=shirt&clothingColor=f5f5f5' },
  jogging:      { uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=body_jogging&backgroundColor=transparent&top[]&accessories[]&clothing=shirt&clothingColor=f5f5f5' },
  stretching:   { uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=body_stretching&backgroundColor=transparent&top[]&accessories[]&clothing=shirt&clothingColor=f5f5f5' },
  idle:         { uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=body_idle&backgroundColor=transparent&top[]&accessories[]&clothing=shirt&clothingColor=f5f5f5' },
  warmup:       { uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=body_warmup&backgroundColor=transparent&top[]&accessories[]&clothing=shirt&clothingColor=f5f5f5' },
};

// Calibración del rostro (ajustada para calzar con el área de la cabeza)
const FACE_POSITIONS: Record<AvatarPose, {
  top: number, left: number,
  width: number, height: number
}> = {
  arms_crossed: { top: 18, left: 52,  width: 176, height: 194 },
  jogging:      { top: 12, left: 50,  width: 180, height: 198 },
  stretching:   { top: 22, left: 54,  width: 172, height: 190 },
  idle:         { top: 15, left: 51,  width: 178, height: 196 },
  warmup:       { top: 20, left: 53,  width: 174, height: 192 },
};

export default function AvatarComposer({
  traits,
  teamColor,
  pose,
  width = 280,
  height = 400,
}: AvatarComposerProps) {
  const faceSvg = traits ? generateFaceSVG(traits) : null;
  const pos = FACE_POSITIONS[pose];

  // Escalamiento basado en el ancho/alto solicitado (asumiendo base de 280x400)
  const scaleX = width / 280;
  const scaleY = height / 400;

  return (
    <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
      {/* Cuerpo base */}
      <Image
        source={POSE_IMAGES[pose]}
        style={{ width, height, position: 'absolute' }}
        resizeMode="contain"
      />

      {/* Rostro SVG posicionado */}
      {faceSvg && (
        <View style={{
          position: 'absolute',
          top: pos.top * scaleY,
          left: pos.left * scaleX,
          width: pos.width * scaleX,
          height: pos.height * scaleY,
          overflow: 'hidden',
          borderRadius: (pos.width * scaleX) * 0.5, // óvalo
          // Debug border si estamos en dev
          borderWidth: __DEV__ ? 1 : 0,
          borderColor: 'rgba(255,0,0,0.5)',
        }}>
          <SvgXml
            xml={faceSvg}
            width={pos.width * scaleX}
            height={pos.height * scaleY}
          />
        </View>
      )}

      {/* Overlay de color de camiseta */}
      {teamColor !== '#16a34a' && (
        <View style={{
          position: 'absolute',
          top: height * 0.35,
          left: width * 0.15,
          width: width * 0.7,
          height: height * 0.45,
          backgroundColor: teamColor,
          opacity: 0.25,
          borderRadius: 8,
          zIndex: -1, // Detrás del rostro pero sobre el cuerpo (si el cuerpo es transparente)
        }}/>
      )}
    </View>
  );
}
