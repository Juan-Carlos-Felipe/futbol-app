import { loadAvatarConfig as loadFromLib, saveAvatarConfig as saveToLib, type PlayerAvatarConfig } from '@/lib/avatar';

export const avatarConfigService = {
  async getPlayerConfig(userId: string): Promise<PlayerAvatarConfig> {
    return loadFromLib(userId);
  },

  async savePlayerConfig(userId: string, config: PlayerAvatarConfig): Promise<void> {
    return saveToLib(userId, config);
  },

  getDefaultConfig(): PlayerAvatarConfig {
    return {
      version: 1,
      skin: 3,
      faceShape: 1,
      eyes: 1,
      eyebrows: 1,
      nose: 1,
      mouth: 1,
      jaw: 1,
      hair: 1,
      hairColor: 1,
      beard: 0,
      beardColor: 1,
      shirt: 1,
      shirtColor: 2,
      number: 10,
      pose: 'idle',
      updatedAt: new Date().toISOString(),
    };
  }
};
