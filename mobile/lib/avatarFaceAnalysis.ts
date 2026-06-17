import jpeg from 'jpeg-js';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import type { GeneratedAvatarFeatures } from '@/lib/avatar';

type AnalysisResult = {
  detected: boolean;
  features?: GeneratedAvatarFeatures;
  reason?: string;
};

type Rgb = { r: number; g: number; b: number };
let faceModelPromise: Promise<blazeface.BlazeFaceModel> | null = null;

export async function analyzeSelfieForAvatarWithLandmarks(base64: string): Promise<AnalysisResult> {
  if (!base64) {
    return { detected: false, reason: 'empty-image' };
  }

  try {
    const decoded = jpeg.decode(base64ToBytes(base64), { useTArray: true });
    const prediction = await detectFaceWithBlazeFace(decoded.width, decoded.height, decoded.data);
    if (!prediction) {
      return analyzeSelfieForAvatar(base64);
    }

    return analyzeSelfieForAvatar(base64, prediction);
  } catch {
    return analyzeSelfieForAvatar(base64);
  }
}

export function analyzeSelfieForAvatar(
  base64: string,
  landmarkFace?: { topLeft: [number, number]; bottomRight: [number, number]; landmarks: [number, number][] }
): AnalysisResult {
  if (!base64) {
    return { detected: false, reason: 'empty-image' };
  }

  const decoded = jpeg.decode(base64ToBytes(base64), { useTArray: true });
  const { width, height, data } = decoded;
  const skinPixels: Rgb[] = [];
  let minX = landmarkFace?.topLeft[0] ?? width;
  let minY = landmarkFace?.topLeft[1] ?? height;
  let maxX = landmarkFace?.bottomRight[0] ?? 0;
  let maxY = landmarkFace?.bottomRight[1] ?? 0;
  let sampledSearch = 0;

  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const index = (y * width + x) * 4;
      const rgb = { r: data[index], g: data[index + 1], b: data[index + 2] };
      const inSearchArea = x > width * 0.12 && x < width * 0.88 && y > height * 0.08 && y < height * 0.86;

      if (inSearchArea) {
        sampledSearch++;
        if (isSkinLike(rgb) && (landmarkFace ? isInsideFaceBox(x, y, landmarkFace) : isNearImageCenter(x, y, width, height))) {
          skinPixels.push(rgb);
          if (!landmarkFace) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
    }
  }

  const skinRatio = sampledSearch ? skinPixels.length / sampledSearch : 0;
  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;
  const boxCenterX = (minX + maxX) / 2;
  const boxCenterY = (minY + maxY) / 2;
  const centered = Math.abs(boxCenterX - width / 2) < width * 0.2 && Math.abs(boxCenterY - height * 0.46) < height * 0.24;
  const notCut = minX > width * 0.04 && maxX < width * 0.96 && minY > height * 0.03 && maxY < height * 0.92;
  const notTooClose = boxWidth < width * 0.66 && boxHeight < height * 0.72;
  const notTooFar = boxWidth > width * 0.16 && boxHeight > height * 0.2;
  const detected = (landmarkFace || skinRatio > 0.025) && notTooFar && notTooClose && centered && notCut;

  if (!detected) {
    const reason = !notTooFar
      ? 'face-too-far'
      : !notTooClose
        ? 'face-too-close'
        : !centered
          ? 'face-not-centered'
          : !notCut
            ? 'face-cut'
            : 'face-not-detected';
    return { detected: false, reason };
  }

  const skin = averageColor(skinPixels, { r: 198, g: 135, b: 88 });
  const hairPixels = collectHairPixels(data, width, height, {
    minX,
    minY,
    maxX,
    maxY,
  });
  const hair = averageColor(hairPixels, darken(skin, 0.42));
  const faceWidthRatio = clamp(boxWidth / width, 0.26, 0.64);
  const faceHeightRatio = clamp(boxHeight / height, 0.28, 0.76);
  const landmarkTraits = landmarkFace ? getLandmarkTraits(landmarkFace, boxWidth, boxHeight) : null;
  const luminance = getLuminance(skin);
  const contrast = Math.abs(getLuminance(hair) - luminance);
  const confidence = clamp(0.48 + skinRatio * 1.7 + contrast / 420, 0, 0.96);

  return {
    detected: true,
    features: {
      skinColor: rgbToHex(skin),
      skinShadowColor: rgbToHex(darken(skin, 0.72)),
      hairColor: rgbToHex(hair),
      faceWidth: scale(faceWidthRatio, 0.26, 0.64, 0.86, 1.16),
      faceHeight: scale(faceHeightRatio, 0.28, 0.76, 0.9, 1.18),
      jawWidth: scale(sampleLowerSkinWidth(data, width, height), 0.16, 0.54, 0.74, 1.12),
      cheekWidth: scale(faceWidthRatio, 0.26, 0.64, 0.88, 1.18),
      eyeSpacing: landmarkTraits?.eyeSpacing ?? scale(faceWidthRatio, 0.26, 0.64, 0.88, 1.1),
      eyeSize: landmarkTraits?.eyeSize ?? clamp(0.95 + (0.54 - faceWidthRatio) * 0.35, 0.88, 1.08),
      eyebrowTilt: landmarkTraits?.tilt ?? clamp((getLuminance(hair) - 80) / 500, -0.12, 0.12),
      noseWidth: landmarkTraits?.noseWidth ?? clamp(0.88 + (faceWidthRatio - 0.43) * 0.45, 0.84, 1.12),
      noseLength: landmarkTraits?.noseLength ?? clamp(0.92 + (faceHeightRatio - 0.52) * 0.42, 0.86, 1.14),
      mouthWidth: landmarkTraits?.mouthWidth ?? clamp(0.92 + (faceWidthRatio - 0.42) * 0.5, 0.86, 1.16),
      mouthFullness: clamp(0.9 + (skin.r - skin.b) / 420, 0.86, 1.18),
      hairVolume: clamp(hairPixels.length / Math.max(1, skinPixels.length) * 2.4, 0.72, 1.24),
      hairline: clamp(0.92 + (minY / height - 0.18) * 0.8, 0.82, 1.12),
      confidence,
    },
  };
}

async function detectFaceWithBlazeFace(width: number, height: number, rgba: Uint8Array) {
  await tf.ready();
  faceModelPromise ??= blazeface.load();
  const model = await faceModelPromise;
  const rgb = new Uint8Array(width * height * 3);

  for (let source = 0, target = 0; source < rgba.length; source += 4, target += 3) {
    rgb[target] = rgba[source];
    rgb[target + 1] = rgba[source + 1];
    rgb[target + 2] = rgba[source + 2];
  }

  const imageTensor = tf.tensor3d(rgb, [height, width, 3]);
  try {
    const predictions = await model.estimateFaces(imageTensor, false);
    const first = predictions[0];
    if (!first) return null;

    const topLeft = first.topLeft as [number, number];
    const bottomRight = first.bottomRight as [number, number];
    const landmarks = (first.landmarks ?? []) as [number, number][];
    return { topLeft, bottomRight, landmarks };
  } finally {
    imageTensor.dispose();
  }
}

function getLandmarkTraits(
  face: { topLeft: [number, number]; bottomRight: [number, number]; landmarks: [number, number][] },
  boxWidth: number,
  boxHeight: number
) {
  const [rightEye, leftEye, nose, mouth, rightEar, leftEar] = face.landmarks;
  if (!rightEye || !leftEye || !nose || !mouth) return null;

  const eyeDistance = distance(leftEye, rightEye);
  const earDistance = rightEar && leftEar ? distance(leftEar, rightEar) : boxWidth;
  const mouthToNose = Math.abs(mouth[1] - nose[1]);
  const eyeLineTilt = (leftEye[1] - rightEye[1]) / Math.max(1, eyeDistance);

  return {
    eyeSpacing: clamp(scale(eyeDistance / boxWidth, 0.26, 0.42, 0.86, 1.14), 0.84, 1.16),
    eyeSize: clamp(scale(eyeDistance / Math.max(1, earDistance), 0.25, 0.4, 0.9, 1.08), 0.86, 1.1),
    tilt: clamp(eyeLineTilt, -0.12, 0.12),
    noseWidth: clamp(scale(Math.abs(leftEye[0] - nose[0]) / boxWidth, 0.08, 0.28, 0.86, 1.12), 0.84, 1.16),
    noseLength: clamp(scale(mouthToNose / boxHeight, 0.16, 0.34, 0.88, 1.14), 0.86, 1.16),
    mouthWidth: clamp(scale(eyeDistance / boxWidth, 0.26, 0.42, 0.86, 1.16), 0.84, 1.18),
  };
}

function distance(a: [number, number], b: [number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function isInsideFaceBox(
  x: number,
  y: number,
  face: { topLeft: [number, number]; bottomRight: [number, number] }
) {
  const paddingX = (face.bottomRight[0] - face.topLeft[0]) * 0.12;
  const paddingY = (face.bottomRight[1] - face.topLeft[1]) * 0.08;
  return (
    x >= face.topLeft[0] - paddingX &&
    x <= face.bottomRight[0] + paddingX &&
    y >= face.topLeft[1] - paddingY &&
    y <= face.bottomRight[1] + paddingY
  );
}

export function getFaceDetectionMessage(reason?: string) {
  switch (reason) {
    case 'face-too-close':
      return 'Aleja un poco el celular. El rostro debe entrar completo dentro del ovalo.';
    case 'face-too-far':
      return 'Acerca un poco el rostro al ovalo, mirando al frente y con buena luz.';
    case 'face-cut':
      return 'El rostro aparece cortado. Incluye frente, menton y ambos lados de la cara.';
    case 'face-not-centered':
      return 'Centra tu rostro completo dentro del ovalo, con buena iluminacion y mirando al frente.';
    default:
      return 'Coloca tu rostro completo dentro del ovalo, con buena iluminacion y mirando al frente.';
  }
}

function isNearImageCenter(x: number, y: number, width: number, height: number) {
  const normalized =
    ((x - width / 2) ** 2) / ((width * 0.42) ** 2) +
    ((y - height * 0.48) ** 2) / ((height * 0.44) ** 2);
  return normalized <= 1.1;
}

function collectHairPixels(
  data: Uint8Array,
  width: number,
  height: number,
  face: { minX: number; minY: number; maxX: number; maxY: number }
) {
  const pixels: Rgb[] = [];
  const faceWidth = face.maxX - face.minX;
  const xStart = Math.max(0, Math.round(face.minX - faceWidth * 0.08));
  const xEnd = Math.min(width, Math.round(face.maxX + faceWidth * 0.08));
  const yStart = Math.max(0, Math.round(face.minY - height * 0.1));
  const yEnd = Math.min(height, Math.round(face.minY + height * 0.16));

  for (let y = yStart; y < yEnd; y += 3) {
    for (let x = xStart; x < xEnd; x += 3) {
      const index = (y * width + x) * 4;
      const rgb = { r: data[index], g: data[index + 1], b: data[index + 2] };
      if (isHairLike(rgb)) {
        pixels.push(rgb);
      }
    }
  }

  return pixels;
}

function sampleLowerSkinWidth(data: Uint8Array, width: number, height: number) {
  const yStart = Math.round(height * 0.62);
  const yEnd = Math.round(height * 0.78);
  let minX = width;
  let maxX = 0;

  for (let y = yStart; y < yEnd; y += 4) {
    for (let x = Math.round(width * 0.22); x < width * 0.78; x += 4) {
      const index = (y * width + x) * 4;
      if (isSkinLike({ r: data[index], g: data[index + 1], b: data[index + 2] })) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
  }

  return maxX > minX ? (maxX - minX) / width : 0.34;
}

function isSkinLike({ r, g, b }: Rgb) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return r > 58 && g > 34 && b > 18 && max - min > 12 && r > b * 1.1 && g > b * 0.72 && r > g * 0.9;
}

function isHairLike(rgb: Rgb) {
  const lum = getLuminance(rgb);
  const saturation = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
  return lum < 138 && saturation > 8;
}

function averageColor(pixels: Rgb[], fallback: Rgb): Rgb {
  if (!pixels.length) return fallback;

  const totals = pixels.reduce(
    (acc, rgb) => ({ r: acc.r + rgb.r, g: acc.g + rgb.g, b: acc.b + rgb.b }),
    { r: 0, g: 0, b: 0 }
  );

  return {
    r: Math.round(totals.r / pixels.length),
    g: Math.round(totals.g / pixels.length),
    b: Math.round(totals.b / pixels.length),
  };
}

function darken(rgb: Rgb, amount: number): Rgb {
  return {
    r: Math.round(rgb.r * amount),
    g: Math.round(rgb.g * amount),
    b: Math.round(rgb.b * amount),
  };
}

function getLuminance(rgb: Rgb) {
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
}

function rgbToHex(rgb: Rgb) {
  return `#${[rgb.r, rgb.g, rgb.b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function scale(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  const normalized = (clamp(value, inMin, inMax) - inMin) / (inMax - inMin);
  return outMin + normalized * (outMax - outMin);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
