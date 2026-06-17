import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export type AvatarPose = 'jogging' | 'stretching' | 'idle' | 'arms_crossed' | 'warmup';
export type AvatarSkinTone = 'fair' | 'light' | 'tan' | 'brown' | 'deep';
export type AvatarHairStyle = 'short' | 'fade' | 'curly' | 'long' | 'buzz';
export type AvatarOutfit = 'home' | 'away' | 'keeper' | 'training';
export type AvatarAccessory = 'none' | 'headband' | 'wristbands' | 'captain_band';
export type AvatarExpression = 'focused' | 'smile' | 'serious' | 'celebration';
export type AvatarGenerationSource = 'manual' | 'photo' | 'external_provider';

export interface AvatarCustomization {
  skinTone: AvatarSkinTone;
  hairStyle: AvatarHairStyle;
  hairColor: string;
  outfit: AvatarOutfit;
  accessory: AvatarAccessory;
  expression: AvatarExpression;
}

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

export interface GeneratedAvatarFeatures {
  skinColor: string;
  skinShadowColor: string;
  hairColor: string;
  faceWidth: number;
  faceHeight: number;
  jawWidth: number;
  cheekWidth: number;
  eyeSpacing: number;
  eyeSize: number;
  eyebrowTilt: number;
  noseWidth: number;
  noseLength: number;
  mouthWidth: number;
  mouthFullness: number;
  hairVolume: number;
  hairline: number;
  confidence: number;
}

export interface AvatarConfig {
  userId: string;
  avatarUrl: string | null;
  avatarName: string;
  selectedPose: AvatarPose;
  teamColor: string;
  customization: AvatarCustomization;
  source: AvatarGenerationSource;
  photo?: AvatarPhotoSource | null;
  provider?: string | null;
  modelFormat?: 'glb' | 'gltf' | 'image' | null;
  faceAdjustment: AvatarFaceAdjustment;
  generatedFeatures?: GeneratedAvatarFeatures | null;
  avatarVersion?: number;
  updatedAt: string | null;
}

export const DEFAULT_AVATAR_POSE: AvatarPose = 'idle';
export const DEFAULT_TEAM_COLOR = '#D2B5FF';
export const DEFAULT_HAIR_COLOR = '#221a16';
export const DEMO_AVATAR_URL = 'https://models.readyplayer.me/638df693d72bffc6fa17943c.glb';

export const DEFAULT_AVATAR_CUSTOMIZATION: AvatarCustomization = {
  skinTone: 'tan',
  hairStyle: 'short',
  hairColor: DEFAULT_HAIR_COLOR,
  outfit: 'home',
  accessory: 'none',
  expression: 'focused',
};

export const DEFAULT_FACE_ADJUSTMENT: AvatarFaceAdjustment = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

export const SKIN_TONES: Record<AvatarSkinTone, { label: string; color: string }> = {
  fair: { label: 'Clara', color: '#f5d6bd' },
  light: { label: 'Natural', color: '#e7b98f' },
  tan: { label: 'Bronceada', color: '#c68655' },
  brown: { label: 'Morena', color: '#8d5524' },
  deep: { label: 'Oscura', color: '#5c3524' },
};

export const HAIR_STYLES: Record<AvatarHairStyle, string> = {
  short: 'Corto',
  fade: 'Degradado',
  curly: 'Rizado',
  long: 'Largo',
  buzz: 'Rapado',
};

export const HAIR_COLORS = ['#221a16', '#5a3825', '#b87735', '#d7c29a', '#111827', '#DADADA'];

export const OUTFITS: Record<AvatarOutfit, string> = {
  home: 'Local',
  away: 'Visita',
  keeper: 'Arquero',
  training: 'Entreno',
};

export const ACCESSORIES: Record<AvatarAccessory, string> = {
  none: 'Sin accesorio',
  headband: 'Cintillo',
  wristbands: 'Munecas',
  captain_band: 'Capitan',
};

export const EXPRESSIONS: Record<AvatarExpression, string> = {
  focused: 'Concentrado',
  smile: 'Sonrisa',
  serious: 'Serio',
  celebration: 'Celebrando',
};

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
export const TEAM_COLORS = ['#D2B5FF', '#6f8cff', '#33d69f', '#ff6b7a', '#f4b740', '#FFFFFF'];

export const ANIMATION_URLS: Record<AvatarPose, string> = {
  jogging: 'https://models.readyplayer.me/animations/jogging.glb',
  stretching: 'https://models.readyplayer.me/animations/stretching.glb',
  idle: 'https://models.readyplayer.me/animations/idle.glb',
  arms_crossed: 'https://models.readyplayer.me/animations/arms-crossed.glb',
  warmup: 'https://models.readyplayer.me/animations/warmup.glb',
};

export function isReadyPlayerMeUrl(url: string | null | undefined) {
  return Boolean(url && /^https:\/\/models\.readyplayer\.me\/.+\.(glb|gltf|png|jpg|jpeg)(\?.*)?$/i.test(url));
}

export function getReadyPlayerMePreviewUrl(url: string | null | undefined, size = 768) {
  if (!url) return null;

  if (!isReadyPlayerMeUrl(url)) return url;

  const [path] = url.split('?');
  const previewPath = path.replace(/\.(glb|gltf)$/i, '.png');
  const params = new URLSearchParams({
    size: String(size),
    camera: 'portrait',
    expression: 'serious',
  });

  return `${previewPath}?${params.toString()}`;
}

function storageKey(userId: string) {
  return `avatar_config_${userId}`;
}

export function createDefaultAvatarConfig(userId: string): AvatarConfig {
  return {
    userId,
    avatarUrl: null,
    avatarName: 'Mi Avatar',
    selectedPose: DEFAULT_AVATAR_POSE,
    teamColor: DEFAULT_TEAM_COLOR,
    customization: DEFAULT_AVATAR_CUSTOMIZATION,
    source: 'manual',
    photo: null,
    provider: null,
    modelFormat: 'glb',
    faceAdjustment: DEFAULT_FACE_ADJUSTMENT,
    generatedFeatures: null,
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
    avatarUrl: config.avatarUrl === DEMO_AVATAR_URL ? null : config.avatarUrl ?? base.avatarUrl,
    avatarName: config.avatarName?.trim() || base.avatarName,
    selectedPose: config.selectedPose ?? base.selectedPose,
    teamColor: config.teamColor ?? base.teamColor,
    customization: {
      ...base.customization,
      ...(config.customization ?? {}),
    },
    source: config.source ?? base.source,
    photo: config.photo ?? null,
    provider: config.provider ?? null,
    modelFormat: config.modelFormat ?? 'glb',
    faceAdjustment: {
      ...base.faceAdjustment,
      ...(config.faceAdjustment ?? {}),
    },
    generatedFeatures: config.generatedFeatures ?? null,
    avatarVersion: config.avatarVersion ?? base.avatarVersion,
    updatedAt: config.updatedAt ?? base.updatedAt,
  };
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

  if (error || !data?.avatar_3d_url || data.avatar_3d_url === DEMO_AVATAR_URL) return localConfig;

  if (
    (localConfig?.provider === 'local-photo-preview' || localConfig?.provider === 'local-face-analysis') &&
    localConfig.avatarUrl
  ) {
    return localConfig;
  }

  const remoteConfig = normalizeAvatarConfig(
    {
      ...(localConfig ?? {}),
      avatarUrl: data.avatar_3d_url,
      selectedPose: data.avatar_pose as AvatarPose,
      teamColor: data.avatar_team_color,
      source: 'external_provider',
      provider: 'remote',
      modelFormat: 'glb',
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
  const isLocalPhotoPreview = config.modelFormat === 'image' || config.provider === 'local-photo-preview';

  const { error } = await supabase
    .from('users')
    .update({
      avatar_3d_url: isLocalPhotoPreview ? null : config.avatarUrl,
      avatar_pose: config.selectedPose,
      avatar_team_color: config.teamColor,
    })
    .eq('id', config.userId);

  if (error) throw error;
}
