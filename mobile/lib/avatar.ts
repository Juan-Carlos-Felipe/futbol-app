import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { type PlayerAvatarConfig } from '@/types/avatar';

export type AvatarPose = 'idle' | 'arms_crossed' | 'celebration' | 'focused';

export const DEFAULT_AVATAR_CONFIG: PlayerAvatarConfig = {
  version: 1,
  skin: 1,
  faceShape: 1,
  eyes: 1,
  eyebrows: 1,
  nose: 1,
  mouth: 1,
  jaw: 1,
  hair: 0, // 0 = sin cabello / calvo
  hairColor: 1,
  beard: 0, // 0 = sin barba
  beardColor: 1,
  shirt: 1,
  shirtColor: 1,
  number: 10,
  pose: 'idle',
  updatedAt: new Date().toISOString(),
};

function storageKey(userId: string) {
  return `player_avatar_v2_${userId}`;
}

export async function saveAvatarConfig(userId: string, config: PlayerAvatarConfig) {
  // Save locally
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(config));

  // Save to Supabase
  const { error } = await supabase
    .from('users')
    .update({
      avatar_config: config,
      avatar_3d_url: null // We no longer use external URLs
    })
    .eq('id', userId);

  if (error) throw error;
}

export async function loadAvatarConfig(userId: string): Promise<PlayerAvatarConfig> {
  // Try local first for speed
  const stored = await AsyncStorage.getItem(storageKey(userId));
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing local avatar config', e);
    }
  }

  // Fallback to Supabase
  const { data, error } = await supabase
    .from('users')
    .select('avatar_config')
    .eq('id', userId)
    .single();

  if (!error && data?.avatar_config) {
    const config = data.avatar_config as PlayerAvatarConfig;
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(config));
    return config;
  }

  return DEFAULT_AVATAR_CONFIG;
}
