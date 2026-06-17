import { type AvatarPose } from '@/lib/avatar';

export interface PlayerAvatarConfig {
  version: number;
  skin: number;
  faceShape: number;
  eyes: number;
  eyebrows: number;
  nose: number;
  mouth: number;
  jaw: number;
  hair: number;
  hairColor: number;
  beard: number;
  beardColor: number;
  shirt: number;
  shirtColor: number;
  number: number;
  pose: AvatarPose;
  updatedAt: string;
}

export type AvatarCategory = 'Rostro' | 'Cabello' | 'Barba' | 'Camiseta' | 'Número';
