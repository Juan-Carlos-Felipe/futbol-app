export const theme = {
  colors: {
    // Primarios
    primary: '#16a34a',
    primaryDark: '#0a3d1f',
    primaryLight: '#dcfce7',
    primaryMid: '#166534',

    // FIFA / impacto
    gold: '#f59e0b',
    goldLight: '#fef3c7',
    goldDark: '#92400e',

    // Resultados
    win: '#16a34a',
    winBg: '#f0fdf4',
    winBorder: '#bbf7d0',
    loss: '#dc2626',
    lossBg: '#fef2f2',
    lossBorder: '#fecaca',
    draw: '#d97706',
    drawBg: '#fffbeb',
    drawBorder: '#fde68a',

    // Neutros
    white: '#ffffff',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray400: '#9ca3af',
    gray600: '#4b5563',
    gray900: '#111827',

    // Acción
    blue: '#2563eb',
    blueBg: '#eff6ff',
  },
  fonts: {
    display: 'BebasNeue',   // títulos grandes, stats, números FIFA
    body: 'DMSans',          // todo lo demás
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
  },
}
