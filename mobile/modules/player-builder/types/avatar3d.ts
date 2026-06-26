export interface BlendShapeConfig {
  headShape: number;
  jawWidth: number;
  chinHeight: number;
  eyesSize: number;
  eyesDistance: number;
  noseWidth: number;
  noseHeight: number;
  mouthWidth: number;
  lipThickness: number;
}

export interface MaterialConfig {
  skinColor: string;
  hairColor: string;
  beardColor: string;
  shirtColor: string;
  shortColor: string;
  socksColor: string;
}

export interface BodyConfig {
  height: number;
  weight: number;
  muscle: number;
}
