import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radii } from '@/lib/theme';

type FaceOvalCameraProps = {
  onCancel: () => void;
  onCapture: (uri: string, guide: FaceCaptureGuide) => void;
};

export type FaceCaptureGuide = {
  frameWidth: number;
  frameHeight: number;
  ovalWidth: number;
  ovalHeight: number;
  ovalCenterX: number;
  ovalCenterY: number;
};

export default function FaceOvalCamera({ onCancel, onCapture }: FaceOvalCameraProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const frameWidth = Math.min(screenWidth - 28, 360);
  const frameHeight = frameWidth / 0.75;
  const ovalWidth = frameWidth * 0.54;
  const ovalHeight = ovalWidth * 1.42;
  const ovalCenterY = frameHeight * 0.47;

  async function capture() {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      if (photo?.uri) {
        onCapture(photo.uri, {
          frameWidth,
          frameHeight,
          ovalWidth,
          ovalHeight,
          ovalCenterX: frameWidth / 2,
          ovalCenterY,
        });
      }
    } finally {
      setIsCapturing(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionTitle}>Permiso de camara</Text>
        <Text style={styles.permissionText}>
          Necesitamos la camara para alinear tu rostro dentro del ovalo del avatar.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryText}>Permitir camara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.cameraFrame, { width: frameWidth, height: frameHeight }]}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front" ratio="4:3" />
        <View style={styles.dimLayer} pointerEvents="none">
          <View style={[styles.topMask, { height: Math.max(0, ovalCenterY - ovalHeight / 2) }]} />
          <View style={[styles.middleRow, { height: ovalHeight }]}>
            <View style={styles.sideMask} />
            <View style={[styles.ovalGuide, { height: ovalHeight, width: ovalWidth }]}>
              <View style={styles.eyeLine} />
              <View style={styles.noseLine} />
              <View style={styles.mouthLine} />
              <View style={styles.chinLine} />
            </View>
            <View style={styles.sideMask} />
          </View>
          <View style={styles.bottomMask} />
        </View>
      </View>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Selfie frontal</Text>
      </View>
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Coloca frente, ojos, nariz, boca y menton dentro del ovalo.
        </Text>
        <Text style={styles.statusText}>Se validara el rostro completo al capturar</Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.captureButton} onPress={capture} disabled={isCapturing}>
          {isCapturing ? <ActivityIndicator color={colors.background} /> : <View style={styles.captureInner} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  cameraFrame: {
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  permissionScreen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  permissionTitle: {
    color: colors.text,
    fontFamily: font.extraBold,
    fontSize: 24,
    fontWeight: '900',
  },
  permissionText: {
    color: colors.textMuted,
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  primaryText: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    marginTop: 12,
    padding: 10,
  },
  secondaryText: {
    color: colors.textMuted,
    fontFamily: font.bold,
  },
  dimLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  topMask: {
    backgroundColor: 'rgba(16,17,29,0.54)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 330,
  },
  sideMask: {
    backgroundColor: 'rgba(16,17,29,0.54)',
    flex: 1,
  },
  ovalGuide: {
    alignItems: 'center',
    borderColor: colors.accent,
    borderRadius: 150,
    borderWidth: 3,
    height: 330,
    justifyContent: 'center',
    width: 245,
  },
  eyeLine: {
    backgroundColor: 'rgba(210,181,255,0.55)',
    height: 1,
    position: 'absolute',
    top: '36%',
    width: '72%',
  },
  noseLine: {
    backgroundColor: 'rgba(244,183,64,0.45)',
    height: '26%',
    position: 'absolute',
    top: '39%',
    width: 1,
  },
  mouthLine: {
    backgroundColor: 'rgba(210,181,255,0.42)',
    borderRadius: 999,
    height: 1,
    position: 'absolute',
    top: '68%',
    width: '42%',
  },
  chinLine: {
    borderBottomColor: 'rgba(244,183,64,0.45)',
    borderBottomWidth: 1,
    borderRadius: 999,
    bottom: '10%',
    height: 16,
    position: 'absolute',
    width: '34%',
  },
  bottomMask: {
    backgroundColor: 'rgba(16,17,29,0.54)',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    left: 18,
    position: 'absolute',
    right: 18,
    top: 48,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(16,17,29,0.7)',
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerText: {
    color: colors.text,
    fontFamily: font.extraBold,
    fontSize: 18,
    fontWeight: '900',
  },
  instructions: {
    alignItems: 'center',
    bottom: 130,
    left: 24,
    position: 'absolute',
    right: 24,
  },
  statusText: {
    backgroundColor: 'rgba(51,214,159,0.16)',
    borderColor: 'rgba(51,214,159,0.28)',
    borderRadius: 999,
    borderWidth: 1,
    color: colors.success,
    fontFamily: font.bold,
    fontSize: 11,
    marginTop: 8,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 7,
    textAlign: 'center',
  },
  instructionText: {
    backgroundColor: 'rgba(16,17,29,0.72)',
    borderRadius: 999,
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 12,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 9,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    bottom: 34,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  captureButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.text,
    borderRadius: 999,
    borderWidth: 4,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  captureInner: {
    backgroundColor: colors.background,
    borderRadius: 999,
    height: 42,
    width: 42,
  },
});
