import * as THREE from 'three';

export class AvatarMaterialService {
  static applyColors(model: THREE.Object3D, config: {
    skinTone: string,
    hairColor: string,
    shirtColor: string
  }) {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;

        if (child.name.includes('skin') || child.name.includes('body') || child.name.includes('head')) {
          mat.color.set(this.getSkinHex(config.skinTone));
        }

        if (child.name.includes('hair')) {
          mat.color.set(config.hairColor);
        }

        if (child.name.includes('shirt')) {
          mat.color.set(config.shirtColor);
        }
      }
    });
  }

  private static getSkinHex(tone: string): string {
    const tones: Record<string, string> = {
      light: '#f9d4b8',
      medium: '#d2a37f',
      tan: '#b57e5b',
      dark: '#5c3b24'
    };
    return tones[tone] || tones.medium;
  }
}
