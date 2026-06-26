import { CardTheme } from '../types';

export interface CardStyle {
  name: string;
  background: [string, string];
  border: string;
  textColor: string;
  accentColor: string;
  statBg: string;
}

export class PlayerCardThemeService {
  private static THEMES: Record<CardTheme, CardStyle> = {
    bronze: {
      name: 'Bronze',
      background: ['#4b3b3b', '#2a1f1f'],
      border: '#8c6e5e',
      textColor: '#ffffff',
      accentColor: '#cd7f32',
      statBg: 'rgba(205, 127, 50, 0.2)',
    },
    silver: {
      name: 'Silver',
      background: ['#4b4b4b', '#2d2d2d'],
      border: '#a0a0a0',
      textColor: '#ffffff',
      accentColor: '#c0c0c0',
      statBg: 'rgba(192, 192, 192, 0.2)',
    },
    gold: {
      name: 'Gold',
      background: ['#5d4d1a', '#2d250d'],
      border: '#d4af37',
      textColor: '#ffffff',
      accentColor: '#ffd700',
      statBg: 'rgba(255, 215, 0, 0.2)',
    },
    elite: {
      name: 'Elite',
      background: ['#2b1a5d', '#0d051a'],
      border: '#9d50bb',
      textColor: '#ffffff',
      accentColor: '#6e48aa',
      statBg: 'rgba(157, 80, 187, 0.2)',
    },
  };

  static getTheme(overall: number): CardTheme {
    if (overall >= 85) return 'elite';
    if (overall >= 75) return 'gold';
    if (overall >= 65) return 'silver';
    return 'bronze';
  }

  static getCardStyle(theme: CardTheme): CardStyle {
    return this.THEMES[theme];
  }
}
