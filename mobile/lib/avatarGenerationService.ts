import {
  DEMO_AVATAR_URL,
  type AvatarConfig,
} from '@/lib/avatar';

/**
 * Servicio para manejar la generación de avatares.
 * Ahora simplificado para delegar la generación a Ready Player Me directamente vía WebView.
 */
export const avatarGenerationService = {
  isConfigured() {
    return true; // Siempre configurado vía WebView
  },

  /**
   * Este método se mantiene por compatibilidad pero el flujo principal
   * ahora es a través de RPMWebView.
   */
  async generateFromPhoto(): Promise<any> {
    return {
      avatarUrl: DEMO_AVATAR_URL,
      provider: 'readyplayerme',
      modelFormat: 'glb',
      message: 'Usa el botón de Ready Player Me para generar desde foto.',
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
