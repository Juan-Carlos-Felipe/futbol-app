export const colors = {
  background: '#171827',
  backgroundDeep: '#10111d',
  surface: '#222132',
  surfaceSoft: '#2b293b',
  surfaceMuted: '#1d1d2c',
  accent: '#D2B5FF',
  accentStrong: '#b78cff',
  accentBlue: '#6f8cff',
  success: '#33d69f',
  warning: '#f4b740',
  danger: '#ff6b7a',
  white: '#FFFFFF',
  text: '#FFFFFF',
  textMuted: '#DADADA',
  textSubtle: '#797979',
  border: 'rgba(255,255,255,0.08)',
};

export const gradients = {
  hero: ['#6f8cff', '#D2B5FF', '#ff8a7a'] as const,
  card: ['#252438', '#1b1c2d'] as const,
  score: ['#6888ff', '#D2B5FF'] as const,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const font = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
};
