import { AvatarConfig } from '../types';
import { FaceMetrics } from '../types/faceAnalysis';
import { FaceMetricsMapper } from './FaceMetricsMapper';
import { AvatarConfigGenerator } from './AvatarConfigGenerator';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as blazeface from '@tensorflow-models/blazeface';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode as atob } from 'base-64';
import decodeJpeg from 'jpeg-js';

export class FaceAnalysisError extends Error {
  constructor(public code: 'NO_FACE' | 'MODEL_ERROR' | 'IMAGE_ERROR' | 'LOW_CONFIDENCE', message: string) {
    super(message);
    this.name = 'FaceAnalysisError';
  }
}

export class FaceAnalysisService {
  private static model: blazeface.BlazeFaceModel | null = null;

  static async loadModel(): Promise<void> {
    if (this.model) return;
    try {
      await tf.ready();
      this.model = await blazeface.load();
    } catch (e) {
      console.error('Failed to load BlazeFace model:', e);
      throw new FaceAnalysisError('MODEL_ERROR', 'No se pudo cargar el analizador facial.');
    }
  }

  /**
   * Performs real local face analysis on the provided image.
   */
  static async analyzeSelfie(imageUri: string): Promise<AvatarConfig> {
    try {
      await this.loadModel();

      if (!this.model) {
         throw new FaceAnalysisError('MODEL_ERROR', 'Modelo no cargado.');
      }

      if (imageUri === 'dummy-uri') {
        return AvatarConfigGenerator.generateRandom();
      }

      // 1. Prepare Image
      let manipulated;
      try {
        manipulated = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 128, height: 128 } }],
          { base64: true, format: ImageManipulator.SaveFormat.JPEG }
        );
      } catch (e) {
        throw new FaceAnalysisError('IMAGE_ERROR', 'Error al procesar la imagen.');
      }

      const imgB64 = manipulated.base64;
      if (!imgB64) throw new FaceAnalysisError('IMAGE_ERROR', 'No se pudo obtener datos de la imagen.');

      // 2. Decode JPEG
      const rawData = atob(imgB64);
      const bytes = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) {
        bytes[i] = rawData.charCodeAt(i);
      }

      let decoded;
      try {
        decoded = decodeJpeg.decode(bytes, { useTArray: true });
      } catch (e) {
        throw new FaceAnalysisError('IMAGE_ERROR', 'Error al decodificar la imagen.');
      }

      const { width, height, data } = decoded;
      const rgb = new Uint8Array(width * height * 3);
      for (let i = 0; i < width * height; i++) {
        rgb[i * 3] = data[i * 4];
        rgb[i * 3 + 1] = data[i * 4 + 1];
        rgb[i * 3 + 2] = data[i * 4 + 2];
      }

      const imageTensor = tf.tensor3d(rgb, [height, width, 3]);

      try {
        const predictions = await this.model.estimateFaces(imageTensor, false);

        if (predictions.length === 0) {
          throw new FaceAnalysisError('NO_FACE', 'No pudimos detectar bien tu rostro. Intenta con una selfie frontal, buena iluminación y sin objetos tapando la cara.');
        }

        const face = predictions[0];

        // Check confidence
        const probability = Array.isArray(face.probability) ? face.probability[0] : (face.probability as any)?.dataSync()[0];
        if (probability !== undefined && probability < 0.8) {
           throw new FaceAnalysisError('LOW_CONFIDENCE', 'Detección con baja confianza.');
        }

        if (!face.landmarks) {
          throw new FaceAnalysisError('NO_FACE', 'No se encontraron puntos de referencia faciales.');
        }

        const metrics = this.extractMetricsFromLandmarks(
          face.topLeft,
          face.bottomRight,
          face.landmarks as [number, number][]
        );
        return FaceMetricsMapper.mapFaceMetricsToAvatarConfig(metrics);
      } finally {
        imageTensor.dispose();
      }

    } catch (error) {
      if (error instanceof FaceAnalysisError) throw error;
      console.error('Face Analysis Error:', error);
      throw new FaceAnalysisError('IMAGE_ERROR', 'Error inesperado durante el análisis.');
    }
  }

  private static extractMetricsFromLandmarks(
    topLeft: [number, number] | tf.Tensor1D,
    bottomRight: [number, number] | tf.Tensor1D,
    landmarks: [number, number][]
  ): FaceMetrics {
    const [rightEye, leftEye, nose, mouth] = landmarks;

    const tl = (Array.isArray(topLeft) ? topLeft : (topLeft as any).dataSync()) as [number, number];
    const br = (Array.isArray(bottomRight) ? bottomRight : (bottomRight as any).dataSync()) as [number, number];

    const faceWidth = br[0] - tl[0];
    const faceHeight = br[1] - tl[1];

    const eyeDistance = Math.hypot(leftEye[0] - rightEye[0], leftEye[1] - rightEye[1]);
    const noseToMouth = Math.abs(mouth[1] - nose[1]);

    return {
      faceWidth,
      faceHeight,
      faceRatio: faceHeight / faceWidth,
      jawWidth: faceWidth * 0.85,
      cheekboneWidth: faceWidth * 0.95,
      chinHeight: faceHeight * 0.15,
      foreheadHeight: faceHeight * 0.2,
      eyeDistance,
      leftEyeSize: eyeDistance * 0.3,
      rightEyeSize: eyeDistance * 0.3,
      eyeAngle: (leftEye[1] - rightEye[1]) / eyeDistance,
      noseWidth: faceWidth * 0.22,
      noseHeight: noseToMouth * 1.2,
      mouthWidth: eyeDistance * 1.2,
      lipThickness: faceHeight * 0.04,
      eyebrowHeight: faceHeight * 0.1,
      skinTone: 'medium'
    };
  }
}
