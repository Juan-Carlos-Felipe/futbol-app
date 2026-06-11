import { create } from 'zustand';
import {
  type AvatarConfig,
  createDefaultAvatarConfig,
  loadAvatarConfig,
  normalizeAvatarConfig,
  saveAvatarToProfile,
} from '@/lib/avatar';

type AvatarState = {
  config: AvatarConfig | null;
  loading: boolean;
  error: string | null;
  load: (userId: string) => Promise<AvatarConfig>;
  setConfig: (config: AvatarConfig) => void;
  save: (config: AvatarConfig) => Promise<void>;
  reset: (userId: string) => void;
};

export const useAvatarStore = create<AvatarState>((set) => ({
  config: null,
  loading: false,
  error: null,

  async load(userId) {
    set({ loading: true, error: null });
    try {
      const stored = await loadAvatarConfig(userId);
      const config = normalizeAvatarConfig(stored ?? createDefaultAvatarConfig(userId), userId);
      set({ config, loading: false });
      return config;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar el avatar.';
      set({ error: message, loading: false });
      throw error;
    }
  },

  setConfig(config) {
    set({ config, error: null });
  },

  async save(config) {
    set({ loading: true, error: null });
    try {
      await saveAvatarToProfile(config);
      set({ config, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el avatar.';
      set({ error: message, loading: false });
      throw error;
    }
  },

  reset(userId) {
    set({ config: createDefaultAvatarConfig(userId), error: null });
  },
}));
