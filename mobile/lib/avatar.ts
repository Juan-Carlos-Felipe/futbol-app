import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export type AvatarPose = 'jogging' | 'stretching' | 'idle' | 'arms_crossed' | 'warmup';

export interface AvatarConfig {
  userId: string;
  avatarUrl: string | null;
  selectedPose: AvatarPose;
  teamColor: string;
  updatedAt: string | null;
}

export const DEFAULT_AVATAR_POSE: AvatarPose = 'jogging';
export const DEFAULT_TEAM_COLOR = '#16a34a';
export const DEMO_AVATAR_URL = 'https://models.readyplayer.me/638df693d72bffc6fa17943c.glb';

export const POSE_LABELS: Record<AvatarPose, string> = {
  jogging: 'Trotando',
  stretching: 'Estirando',
  idle: 'Previo al partido',
  arms_crossed: 'Brazos cruzados',
  warmup: 'Calentando',
};

export const POSE_ICONS: Record<AvatarPose, string> = {
  jogging: 'run',
  stretching: 'fitness',
  idle: 'target',
  arms_crossed: 'strong',
  warmup: 'warm',
};

export const AVATAR_POSES = Object.keys(POSE_LABELS) as AvatarPose[];

export const TEAM_COLORS = ['#16a34a', '#2563eb', '#dc2626', '#7c3aed', '#d97706', '#111827'];

export const ANIMATION_URLS: Record<AvatarPose, string> = {
  jogging: 'https://models.readyplayer.me/animations/jogging.glb',
  stretching: 'https://models.readyplayer.me/animations/stretching.glb',
  idle: 'https://models.readyplayer.me/animations/idle.glb',
  arms_crossed: 'https://models.readyplayer.me/animations/arms-crossed.glb',
  warmup: 'https://models.readyplayer.me/animations/warmup.glb',
};

function storageKey(userId: string) {
  return `avatar_config_${userId}`;
}

export async function saveAvatarConfig(config: AvatarConfig) {
  await AsyncStorage.setItem(storageKey(config.userId), JSON.stringify(config));
}

export async function loadAvatarConfig(userId: string): Promise<AvatarConfig | null> {
  const stored = await AsyncStorage.getItem(storageKey(userId));
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AvatarConfig;
  } catch {
    await AsyncStorage.removeItem(storageKey(userId));
    return null;
  }
}

export async function saveAvatarUrl(userId: string, avatarUrl: string) {
  const { error } = await supabase
    .from('users')
    .update({ avatar_3d_url: avatarUrl })
    .eq('id', userId);

  if (error) throw error;
}

export async function saveAvatarToProfile(config: AvatarConfig) {
  const { error } = await supabase
    .from('users')
    .update({
      avatar_3d_url: config.avatarUrl,
      avatar_pose: config.selectedPose,
      avatar_team_color: config.teamColor,
    })
    .eq('id', config.userId);

  if (error) throw error;
}
