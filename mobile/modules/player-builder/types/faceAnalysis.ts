export interface FaceLandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface FaceMetrics {
  faceWidth: number;
  faceHeight: number;
  faceRatio: number;
  jawWidth: number;
  cheekboneWidth: number;
  chinHeight: number;
  foreheadHeight: number;
  eyeDistance: number;
  leftEyeSize: number;
  rightEyeSize: number;
  eyeAngle: number;
  noseWidth: number;
  noseHeight: number;
  mouthWidth: number;
  lipThickness: number;
  eyebrowHeight: number;
  skinTone: 'light' | 'medium' | 'dark' | 'tan';
}

export interface FaceAnalysisResult {
  success: boolean;
  metrics?: FaceMetrics;
  error?: string;
}
