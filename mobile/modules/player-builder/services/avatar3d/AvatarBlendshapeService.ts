import * as THREE from 'three';

export class AvatarBlendshapeService {
  /**
   * Applies blendshape values to a mesh if they exist.
   * Values are normalized from 0-100 to 0-1.
   */
  static applyBlendShapes(mesh: THREE.Mesh, config: Record<string, number>) {
    if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

    Object.entries(config).forEach(([key, value]) => {
      const index = mesh.morphTargetDictionary![key];
      if (index !== undefined) {
        mesh.morphTargetInfluences![index] = value / 100;
      } else {
        // Warning only in dev mode for missing blendshapes
        if (__DEV__) {
          // console.warn(`Blendshape ${key} not found on mesh ${mesh.name}`);
        }
      }
    });
  }
}
