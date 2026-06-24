import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { CameraGuide } from './CameraGuide';
import { removeBackgroundSafe } from '@/lib/backgroundRemoval';
import { colors, font, spacing, radii } from '@/lib/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PhotoCaptureProps {
  onCapture: (processedUri: string) => void;
  onClose: () => void;
}

type Step = 'camera' | 'processing' | 'result';

const TIPS = [
  "💡 Fondo liso o pared — el fondo se elimina automáticamente",
  "☀️ Buena iluminación frontal",
  "📏 Mantené distancia de 60-80cm del teléfono",
  "👕 La camiseta se agrega después — cualquier ropa está bien",
  "😐 Expresión neutral o sonrisa leve",
];

const PROCESSING_TEXTS = [
  "🔍 Detectando tu silueta...",
  "✂️ Eliminando el fondo...",
  "✨ Aplicando últimos retoques...",
];

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onCapture, onClose }) => {
  const [step, setStep] = useState<Step>('camera');
  const [originalUri, setOriginalUri] = useState<string | null>(null);
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  const [backgroundRemoved, setBackgroundRemoved] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [procTextIndex, setProcTextIndex] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (step === 'camera') {
      const interval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % TIPS.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'processing') {
      const interval = setInterval(() => {
        setProcTextIndex((prev) => (prev + 1) % PROCESSING_TEXTS.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          base64: false,
          skipProcessing: false,
        });
        processPhoto(photo.uri);
      } catch (error) {
        console.error('Capture error:', error);
      }
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.9,
    });

    if (!result.canceled) {
      processPhoto(result.assets[0].uri);
    }
  };

  const processPhoto = async (uri: string) => {
    setOriginalUri(uri);
    setStep('processing');
    const result = await removeBackgroundSafe(uri);
    setProcessedUri(result.uri);
    setBackgroundRemoved(result.backgroundRemoved);
    setStep('result');
  };

  if (hasPermission === null) {
    return <View style={styles.centered}><ActivityIndicator color={colors.accent} /></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.centered}><Text style={{ color: 'white' }}>Sin acceso a la cámara</Text></View>;
  }

  return (
    <View style={styles.container}>
      {step === 'camera' && (
        <>
          <CameraView
            ref={cameraRef}
            facing="front"
            style={StyleSheet.absoluteFill}
          />
          <CameraGuide mode="bust" screenWidth={screenWidth} screenHeight={screenHeight} />

          <View style={styles.instructions}>
            <Text style={styles.instrTitle}>📸 Posicioná tu busto</Text>
            <Text style={styles.instrSub}>Cabeza y torso dentro del marco · Mirá al frente</Text>
          </View>

          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
              <Ionicons name="images-outline" size={28} color="white" />
              <Text style={styles.galleryLabel}>Galería</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 'processing' && (
        <View style={styles.processingContainer}>
          {originalUri && <Image source={{ uri: originalUri }} style={[StyleSheet.absoluteFill, { opacity: 0.4 }]} />}
          <ActivityIndicator size="large" color={colors.success} />
          <Text style={styles.procText}>{PROCESSING_TEXTS[procTextIndex]}</Text>
        </View>
      )}

      {step === 'result' && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Comparación</Text>

          <View style={styles.comparisonRow}>
            <View style={styles.resultCol}>
              <Image source={{ uri: originalUri! }} style={styles.resultImg} />
              <Text style={styles.resultLabel}>Original</Text>
            </View>
            <View style={styles.resultCol}>
              <View style={styles.transparentBg}>
                <Image source={{ uri: processedUri! }} style={styles.resultImg} />
              </View>
              <Text style={styles.resultLabel}>
                {backgroundRemoved ? "✅ Fondo eliminado" : "⚠️ Sin procesar"}
              </Text>
            </View>
          </View>

          {!backgroundRemoved && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                No pudimos eliminar el fondo automáticamente. Igual podés continuar o intentar con mejor iluminación.
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.useBtn} onPress={() => onCapture(processedUri!)}>
            <Text style={styles.useBtnText}>✅ Usar esta foto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.retryBtn} onPress={() => setStep('camera')}>
            <Text style={styles.retryBtnText}>🔄 Volver a sacar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  instructions: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instrTitle: { color: 'white', fontFamily: font.bold, fontSize: 18, textAlign: 'center' },
  instrSub: { color: 'rgba(255,255,255,0.8)', fontFamily: font.regular, fontSize: 13, textAlign: 'center', marginTop: 4 },
  tipContainer: {
    position: 'absolute',
    bottom: 140,
    width: '100%',
    paddingHorizontal: 30,
  },
  tipText: { color: 'white', fontSize: 14, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: 10 },
  controls: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  galleryBtn: { alignItems: 'center' },
  galleryLabel: { color: 'white', fontSize: 12, marginTop: 4 },
  closeBtn: { padding: 10 },
  processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  procText: { color: 'white', marginTop: 20, fontSize: 16, fontFamily: font.medium },
  resultContainer: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: colors.background },
  resultTitle: { color: 'white', fontSize: 24, fontFamily: font.bebas, textAlign: 'center', marginBottom: 20 },
  comparisonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  resultCol: { width: '47%', alignItems: 'center' },
  resultImg: { width: '100%', aspectRatio: 4 / 5, borderRadius: 10 },
  resultLabel: { color: colors.textSubtle, fontSize: 11, marginTop: 8 },
  transparentBg: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 10,
    backgroundColor: '#eee',
    // Simulación de tablero de ajedrez sería con un asset o patrón
  },
  warningBanner: { backgroundColor: '#fef3c7', padding: 12, borderRadius: 8, marginBottom: 20 },
  warningText: { color: '#92400e', fontSize: 12, textAlign: 'center' },
  useBtn: { backgroundColor: colors.success, padding: 16, borderRadius: radii.md, alignItems: 'center', marginBottom: 12 },
  useBtnText: { color: 'white', fontFamily: font.bold, fontSize: 16 },
  retryBtn: { padding: 16, borderRadius: radii.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  retryBtnText: { color: 'white', fontFamily: font.medium, fontSize: 16 },
});
