import { AvatarConfig } from '../types';
import { FaceMetrics } from '../types/faceAnalysis';
import { normalize } from './FaceLandmarkUtils';

export class FaceMetricsMapper {
  static mapFaceMetricsToAvatarConfig(metrics: FaceMetrics): AvatarConfig {
    return {
      // Map facial proportions to 0-100 sliders
      headShape: normalize(metrics.faceRatio, 1.2, 1.6),
      jawWidth: normalize(metrics.jawWidth / metrics.faceWidth, 0.7, 0.9),
      chinHeight: normalize(metrics.chinHeight / metrics.faceHeight, 0.1, 0.2),

      eyesSize: normalize(metrics.leftEyeSize / metrics.faceWidth, 0.05, 0.1),
      eyesDistance: normalize(metrics.eyeDistance / metrics.faceWidth, 0.2, 0.3),

      noseWidth: normalize(metrics.noseWidth / metrics.faceWidth, 0.15, 0.25),
      noseHeight: normalize(metrics.noseHeight / metrics.faceHeight, 0.15, 0.25),

      mouthWidth: normalize(metrics.mouthWidth / metrics.faceWidth, 0.3, 0.5),
      lipThickness: normalize(metrics.lipThickness / metrics.faceHeight, 0.02, 0.06),

      skinTone: metrics.skinTone,

      // Default values for non-facial traits
      hairStyle: 'short',
      hairColor: '#2b2b2b',
      beard: 'none',
      height: 178,
      weight: 75,
      muscle: 50,
    };
  }
}
