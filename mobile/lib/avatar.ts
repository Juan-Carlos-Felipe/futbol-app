import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export type AvatarPose = 'idle' | 'arms_crossed';
export type AvatarGenerationSource = 'manual' | 'photo';

export interface AvatarPhotoSource {
  uri: string;
  source: 'camera' | 'library';
  createdAt: string;
}

export interface AvatarFaceAdjustment {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface AvatarConfig {
  userId: string;
  avatarUrl: string | null;
  avatarName: string;
  selectedPose: AvatarPose;
  teamColor: string;
  source: AvatarGenerationSource;
  photo?: AvatarPhotoSource | null;
  faceAdjustment: AvatarFaceAdjustment;
  avatarVersion?: number;
  updatedAt: string | null;
}

export const DEFAULT_AVATAR_POSE: AvatarPose = 'idle';
export const DEFAULT_TEAM_COLOR = '#D2B5FF';

export const DEFAULT_FACE_ADJUSTMENT: AvatarFaceAdjustment = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

export const POSE_LABELS: Record<AvatarPose, string> = {
  idle: 'Retrato',
  arms_crossed: 'Capitán',
};

export const TEAM_COLORS = ['#D2B5FF', '#6f8cff', '#33d69f', '#ff6b7a', '#f4b740', '#FFFFFF'];

function storageKey(userId: string) {
  return `avatar_config_${userId}`;
}

export function createDefaultAvatarConfig(userId: string): AvatarConfig {
  return {
    userId,
    avatarUrl: null,
    avatarName: 'Mi Jugador',
    selectedPose: DEFAULT_AVATAR_POSE,
    teamColor: DEFAULT_TEAM_COLOR,
    source: 'manual',
    photo: null,
    faceAdjustment: DEFAULT_FACE_ADJUSTMENT,
    avatarVersion: 1,
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeAvatarConfig(
  config: Partial<AvatarConfig> | null | undefined,
  userId: string
): AvatarConfig {
  const base = createDefaultAvatarConfig(userId);

  if (!config) return base;

  return {
    ...base,
    ...config,
    userId,
    avatarUrl: config.avatarUrl ?? base.avatarUrl,
    avatarName: config.avatarName?.trim() || base.avatarName,
    selectedPose: config.selectedPose ?? base.selectedPose,
    teamColor: config.teamColor ?? base.teamColor,
    source: config.source ?? base.source,
    photo: config.photo ?? null,
    faceAdjustment: {
      ...base.faceAdjustment,
      ...(config.faceAdjustment ?? {}),
    },
    avatarVersion: config.avatarVersion ?? base.avatarVersion,
    updatedAt: config.updatedAt ?? base.updatedAt,
  };
}

export async function uploadProfilePhoto(userId: string, uri: string): Promise<string> {
  const fileName = `${userId}/${Date.now()}.jpg`;

  // En React Native (Expo), fetch la URI local para obtener un blob
  const response = await fetch(uri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path);

  return publicUrl;
}

export async function saveAvatarConfig(config: AvatarConfig) {
  await AsyncStorage.setItem(storageKey(config.userId), JSON.stringify(config));
}

export async function loadAvatarConfig(userId: string): Promise<AvatarConfig | null> {
  const stored = await AsyncStorage.getItem(storageKey(userId));
  let localConfig: AvatarConfig | null = null;

  if (stored) {
    try {
      localConfig = normalizeAvatarConfig(JSON.parse(stored) as Partial<AvatarConfig>, userId);
    } catch {
      await AsyncStorage.removeItem(storageKey(userId));
    }
  }

  const { data, error } = await supabase
    .from('users')
    .select('avatar_3d_url, avatar_pose, avatar_team_color')
    .eq('id', userId)
    .single();

  if (error || !data?.avatar_3d_url) return localConfig;

  const remoteConfig = normalizeAvatarConfig(
    {
      ...(localConfig ?? {}),
      avatarUrl: data.avatar_3d_url,
      selectedPose: data.avatar_pose as AvatarPose,
      teamColor: data.avatar_team_color,
      source: 'photo',
    },
    userId
  );

  await saveAvatarConfig(remoteConfig);
  return remoteConfig;
}

export async function saveAvatarUrl(userId: string, avatarUrl: string) {
  const { error } = await supabase
    .from('users')
    .update({ avatar_3d_url: avatarUrl })
    .eq('id', userId);

  if (error) throw error;
}

export async function saveAvatarToProfile(config: AvatarConfig) {
  await saveAvatarConfig(config);

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
