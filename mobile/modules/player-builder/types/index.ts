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

export interface PlayerProfile {
  id: string;
  name: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  avatarConfig: AvatarConfig;
  createdAt: string;
  updatedAt: string;
}
