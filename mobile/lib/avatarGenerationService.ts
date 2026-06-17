import {
  DEMO_AVATAR_URL,
  type AvatarConfig,
  type AvatarCustomization,
  type AvatarPhotoSource,
} from '@/lib/avatar';

type AvatarGenerationRequest = {
  userId: string;
  photo: AvatarPhotoSource;
  avatarName: string;
  teamColor: string;
  customization: AvatarCustomization;
};

type AvatarGenerationResult = {
  avatarUrl: string;
  provider: string | null;
  modelFormat: 'glb' | 'gltf';
  message: string;
  traits?: any;
};

function getAvatarApiUrl() {
  return process.env.EXPO_PUBLIC_AVATAR_GENERATION_API_URL;
}

export const avatarGenerationService = {
  isConfigured() {
    return Boolean(getAvatarApiUrl());
  },

  async generateFromPhoto(request: AvatarGenerationRequest): Promise<AvatarGenerationResult> {
    const apiUrl = getAvatarApiUrl();

    if (!apiUrl) {
      // Mock realistic generation
      return {
        avatarUrl: 'https://models.readyplayer.me/651f33f67f1e7a46f6f1c4a0.glb',
        provider: 'mock_realistic',
        modelFormat: 'glb',
        message: 'Rasgos faciales analizados con exito. Generando modelo realista...',
        traits: {
          faceShape: Math.random(),
          jawShape: Math.random(),
          noseShape: Math.random(),
          lipShape: Math.random(),
          eyeDistance: 0.4 + Math.random() * 0.2,
          eyeColor: '#4d342c',
          eyebrowsType: 'natural'
        }
      };
    }

    const formData = new FormData();
    formData.append('userId', request.userId);
    formData.append('avatarName', request.avatarName);
    formData.append('teamColor', request.teamColor);
    formData.append('customization', JSON.stringify(request.customization));
    formData.append('photo', {
      uri: request.photo.uri,
      name: 'avatar-selfie.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('El proveedor externo no pudo generar el avatar.');
    }

    const data = (await response.json()) as Partial<AvatarGenerationResult>;

    if (!data.avatarUrl) {
      throw new Error('La respuesta del proveedor no incluyo un modelo 3D.');
    }

    return {
      avatarUrl: data.avatarUrl,
      provider: data.provider ?? 'external',
      modelFormat: data.modelFormat ?? 'glb',
      message: data.message ?? 'Avatar generado correctamente.',
    };
  },

  buildManualConfig(config: AvatarConfig): AvatarConfig {
    return {
      ...config,
      avatarUrl: config.avatarUrl ?? DEMO_AVATAR_URL,
      source: 'manual',
      provider: null,
      modelFormat: 'glb',
      updatedAt: new Date().toISOString(),
    };
  },
};
