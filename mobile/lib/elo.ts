export interface PlayerLevel {
  level: number;
  title: string;
  badgeColor: string;
  icon: string;
  eloMin: number;
  eloMax: number;
  progress: number;
}

type LevelDefinition = Omit<PlayerLevel, 'progress'>;

export const LEVELS: LevelDefinition[] = [
  { level: 1, title: 'Rookie', badgeColor: '#9ca3af', icon: '🥉', eloMin: 0, eloMax: 799 },
  { level: 2, title: 'Amateur', badgeColor: '#6b7280', icon: '⚽', eloMin: 800, eloMax: 899 },
  { level: 3, title: 'Semi-Pro', badgeColor: '#3b82f6', icon: '🔵', eloMin: 900, eloMax: 999 },
  { level: 4, title: 'Competitivo', badgeColor: '#8b5cf6', icon: '💜', eloMin: 1000, eloMax: 1099 },
  { level: 5, title: 'Elite', badgeColor: '#f59e0b', icon: '⭐', eloMin: 1100, eloMax: 1199 },
  { level: 6, title: 'Campeon', badgeColor: '#f59e0b', icon: '🏆', eloMin: 1200, eloMax: 1349 },
  { level: 7, title: 'Leyenda', badgeColor: '#dc2626', icon: '🔥', eloMin: 1350, eloMax: 9999 },
];

export const getLevel = (elo: number): PlayerLevel => {
  const level =
    LEVELS.find((candidate) => elo >= candidate.eloMin && elo <= candidate.eloMax) ??
    LEVELS[0];
  const rawProgress = Math.round(
    ((elo - level.eloMin) / Math.max(level.eloMax - level.eloMin, 1)) * 100
  );

  return {
    ...level,
    progress: Math.max(0, Math.min(rawProgress, 100)),
  };
};

export const getEloChange = (before: number, after: number) => {
  const change = after - before;

  return {
    change,
    isPositive: after >= before,
    display: `${change >= 0 ? '+' : ''}${change.toLocaleString('es-CL')}`,
  };
};

export const getFifaRating = (elo: number): number => {
  const min = 600;
  const max = 1500;
  const clamped = Math.min(Math.max(elo, min), max);

  return Math.round(50 + ((clamped - min) / (max - min)) * 49);
};
