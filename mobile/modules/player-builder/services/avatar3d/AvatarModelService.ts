import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

export class AvatarModelService {
  private static loader = new GLTFLoader();
  private static MODEL_PATH = 'assets/models/base_player.glb';

  static async loadBaseModel(): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      // In a real environment, this would load the actual GLB.
      // For this phase, we return a fallback or a placeholder structure
      // if the file is missing to prevent crashes.

      this.loader.load(
        this.MODEL_PATH,
        (gltf) => {
          resolve(gltf.scene);
        },
        undefined,
        (error) => {
          console.warn('Base model not found at', this.MODEL_PATH, '. Using technical placeholder.');
          resolve(this.createPlaceholderModel());
        }
      );
    });
  }

  private static createPlaceholderModel(): THREE.Group {
    const group = new THREE.Group();

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 32, 32),
      new THREE.MeshStandardMaterial({ name: 'head' })
    );
    head.position.y = 1.7;
    head.name = 'head';
    group.add(head);

    // Body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.2, 0.6, 32),
      new THREE.MeshStandardMaterial({ name: 'body' })
    );
    body.position.y = 1.3;
    body.name = 'body';
    group.add(body);

    return group;
  }
}
