import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import Svg, { Ellipse, Defs, Mask, Rect } from 'react-native-svg';
import { colors, font } from '@/lib/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FaceCaptureProps {
  onCapture: (photoUri: string, photoBase64: string) => void;
  onClose: () => void;
}

export default function FaceCapture({ onCapture, onClose }: FaceCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const ovalWidth = screenWidth * 0.65;
  const ovalHeight = screenWidth * 0.85;
  const ovalY = screenHeight * 0.18;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const borderColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#A855F7', '#FFFFFF'], // Morado a Blanco
  });

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: true,
        exif: false,
      });

      // Recortar SOLO el óvalo
      // Calculamos las proporciones del recorte basado en el tamaño real de la imagen
      const { width: pw, height: ph } = photo;

      // El aspect ratio de la camara suele ser diferente al de la pantalla
      // Asumimos que la camara llena la pantalla (cover)
      const screenAspect = screenHeight / screenWidth;
      const photoAspect = ph / pw;

      let actualWidth, actualHeight, offsetX = 0, offsetY = 0;
      if (photoAspect > screenAspect) {
        // Foto más alta que la pantalla
        actualWidth = pw;
        actualHeight = pw * screenAspect;
        offsetY = (ph - actualHeight) / 2;
      } else {
        // Foto más ancha que la pantalla
        actualHeight = ph;
        actualWidth = ph / screenAspect;
        offsetX = (pw - actualWidth) / 2;
      }

      const ovalW = actualWidth * 0.65;
      const ovalH = actualWidth * 0.85;
      const ovalX = (actualWidth - ovalW) / 2 + offsetX;
      const ovalYPhoto = actualHeight * 0.18 + offsetY;

      const cropped = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{
          crop: {
            originX: ovalX,
            originY: ovalYPhoto,
            width: ovalW,
            height: ovalH,
          }
        }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
      );

      onCapture(cropped.uri, cropped.base64!);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="front"
        ref={cameraRef}
      />

      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%">
          <Defs>
            <Mask id="mask" x="0" y="0" width="100%" height="100%">
              <Rect x="0" y="0" width="100%" height="100%" fill="white" />
              <Ellipse
                cx={screenWidth / 2}
                cy={ovalY + ovalHeight / 2}
                rx={ovalWidth / 2}
                ry={ovalHeight / 2}
                fill="black"
              />
            </Mask>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.55)"
            mask="url(#mask)"
          />
        </Svg>

        <Animated.View
          style={[
            styles.ovalBorder,
            {
              top: ovalY,
              left: (screenWidth - ovalWidth) / 2,
              width: ovalWidth,
              height: ovalHeight,
              borderColor: borderColor,
            },
          ]}
        />
      </View>

      <View style={styles.overlay}>
        <Text style={styles.guideText}>Alineá tu rostro dentro del óvalo</Text>
        <Text style={[styles.statusText, { color: '#22C55E' }]}>📸 Listo para capturar</Text>

        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
    fontFamily: font.medium,
  },
  button: {
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: colors.background,
    fontFamily: font.bold,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  guideText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: font.medium,
    textAlign: 'center',
    marginTop: 20,
  },
  statusText: {
    fontSize: 14,
    fontFamily: font.bold,
    marginTop: 10,
  },
  ovalBorder: {
    position: 'absolute',
    borderWidth: 2.5,
    borderRadius: screenWidth, // Aproximación para que parezca óvalo
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
