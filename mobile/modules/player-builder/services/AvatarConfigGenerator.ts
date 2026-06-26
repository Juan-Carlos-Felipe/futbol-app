import { AvatarConfig } from '../types';

export class AvatarConfigGenerator {
  private static skinTones: AvatarConfig['skinTone'][] = ['light', 'medium', 'dark', 'tan'];
  private static hairStyles: AvatarConfig['hairStyle'][] = ['short', 'long', 'bald', 'fade', 'buzz'];
  private static beards: AvatarConfig['beard'][] = ['none', 'short', 'long', 'goatee'];
  private static hairColors = ['#2b2b2b', '#4a3728', '#7c5c42', '#a5a5a5', '#dcdcdc'];

  static generateRandom(): AvatarConfig {
    return {
      headShape: this.randomInt(30, 70),
      jawWidth: this.randomInt(30, 80),
      chinHeight: this.randomInt(20, 60),
      eyesSize: this.randomInt(40, 70),
      eyesDistance: this.randomInt(40, 60),
      noseWidth: this.randomInt(30, 60),
      noseHeight: this.randomInt(40, 70),
      mouthWidth: this.randomInt(40, 70),
      lipThickness: this.randomInt(30, 60),
      skinTone: this.randomElement(this.skinTones),
      hairStyle: this.randomElement(this.hairStyles),
      hairColor: this.randomElement(this.hairColors),
      beard: this.randomElement(this.beards),
      height: this.randomInt(160, 200),
      weight: this.randomInt(60, 100),
      muscle: this.randomInt(30, 90),
    };
  }

  private static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private static randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
