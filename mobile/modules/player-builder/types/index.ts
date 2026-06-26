export interface AvatarConfig {
  headShape: number;
  jawWidth: number;
  chinHeight: number;
  eyesSize: number;
  eyesDistance: number;
  noseWidth: number;
  noseHeight: number;
  mouthWidth: number;
  lipThickness: number;
  skinTone: 'light' | 'medium' | 'dark' | 'tan';
  hairStyle: 'short' | 'long' | 'bald' | 'fade' | 'buzz';
  hairColor: string;
  beard: 'none' | 'short' | 'long' | 'goatee';
  height: number;
  weight: number;
  muscle: number;
}

export type CardTheme = 'bronze' | 'silver' | 'gold' | 'elite';

export interface PlayerProfile {
  id: string;
  name: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  shirtNumber: number;
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  avatarConfig: AvatarConfig;
  cardImageUri?: string;
  cardTheme?: CardTheme;
  createdAt: string;
  updatedAt: string;
}
