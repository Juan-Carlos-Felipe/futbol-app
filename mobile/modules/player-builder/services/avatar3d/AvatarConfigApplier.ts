import * as THREE from 'three';
import { AvatarConfig } from '../../types';
import { AvatarMaterialService } from './AvatarMaterialService';
import { AvatarBlendshapeService } from './AvatarBlendshapeService';

export class AvatarConfigApplier {
  static apply(model: THREE.Object3D, config: AvatarConfig) {
    // 1. Materials
    AvatarMaterialService.applyColors(model, {
      skinTone: config.skinTone,
      hairColor: config.hairColor,
      shirtColor: '#16a34a', // Default team color
    });

    // 2. Scale / Body Proportions
    const heightScale = config.height / 180; // Relative to 1.80m
    const muscleScale = 0.9 + (config.muscle / 100) * 0.2; // 0.9 to 1.1

    model.scale.set(muscleScale, heightScale, muscleScale);

    // 3. Facial Blendshapes
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.morphTargetDictionary) {
        AvatarBlendshapeService.applyBlendShapes(child, {
          headShape: config.headShape,
          jawWidth: config.jawWidth,
          chinHeight: config.chinHeight,
          eyesSize: config.eyesSize,
          eyesDistance: config.eyesDistance,
          noseWidth: config.noseWidth,
          noseHeight: config.noseHeight,
          mouthWidth: config.mouthWidth,
          lipThickness: config.lipThickness,
        });
      }
    });
  }
}
