export type ShirtTier = 'free' | 'premium' | 'exclusive';

export type ShirtDesign =
  | 'solid'
  | 'stripes_v'
  | 'stripes_h'
  | 'gradient'
  | 'halves'
  | 'collar';

export interface Shirt {
  id: string;
  name: string;
  tier: ShirtTier;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  design: ShirtDesign;
  price_balones?: number;
  lockedUntilLevel?: number;
}

// ── CAMISETAS GRATUITAS (disponibles desde el inicio) ─────────
export const FREE_SHIRTS: Shirt[] = [
  {
    id: 'white-classic',
    name: 'Blanca clásica',
    tier: 'free',
    primaryColor: '#f8fafc',
    secondaryColor: '#e2e8f0',
    design: 'solid',
  },
  {
    id: 'black-classic',
    name: 'Negra clásica',
    tier: 'free',
    primaryColor: '#111827',
    secondaryColor: '#374151',
    design: 'solid',
  },
  {
    id: 'green-classic',
    name: 'Verde FutbolApp',
    tier: 'free',
    primaryColor: '#16a34a',
    secondaryColor: '#ffffff',
    design: 'solid',
  },
  {
    id: 'blue-classic',
    name: 'Azul profundo',
    tier: 'free',
    primaryColor: '#1e40af',
    secondaryColor: '#ffffff',
    design: 'solid',
  },
  {
    id: 'red-classic',
    name: 'Rojo pasión',
    tier: 'free',
    primaryColor: '#dc2626',
    secondaryColor: '#ffffff',
    design: 'solid',
  },
  {
    id: 'navy-white',
    name: 'Azul marino',
    tier: 'free',
    primaryColor: '#1e3a5f',
    secondaryColor: '#ffffff',
    design: 'solid',
  },
  {
    id: 'yellow-black',
    name: 'Amarillo y negro',
    tier: 'free',
    primaryColor: '#eab308',
    secondaryColor: '#111827',
    design: 'solid',
  },
  {
    id: 'purple-classic',
    name: 'Morado élite',
    tier: 'free',
    primaryColor: '#7c3aed',
    secondaryColor: '#ffffff',
    design: 'solid',
  },
  {
    id: 'orange-black',
    name: 'Naranja y negro',
    tier: 'free',
    primaryColor: '#ea580c',
    secondaryColor: '#111827',
    design: 'solid',
  },
  {
    id: 'celeste-white',
    name: 'Celeste y blanco',
    tier: 'free',
    primaryColor: '#0ea5e9',
    secondaryColor: '#ffffff',
    design: 'solid',
  },
];

// ── CAMISETAS PREMIUM (se compran con Balones) ────────────────
export const PREMIUM_SHIRTS: Shirt[] = [
  {
    id: 'stripes-classic',
    name: 'Rayas clásicas',
    tier: 'premium',
    primaryColor: '#1e40af',
    secondaryColor: '#ffffff',
    design: 'stripes_v',
    price_balones: 300,
  },
  {
    id: 'gold-black',
    name: 'Dorada y negra',
    tier: 'premium',
    primaryColor: '#f59e0b',
    secondaryColor: '#111827',
    design: 'halves',
    price_balones: 400,
    lockedUntilLevel: 4,
  },
  {
    id: 'gradient-fire',
    name: 'Fuego',
    tier: 'premium',
    primaryColor: '#dc2626',
    secondaryColor: '#f97316',
    design: 'gradient',
    price_balones: 500,
    lockedUntilLevel: 5,
  },
  {
    id: 'gradient-ice',
    name: 'Hielo',
    tier: 'premium',
    primaryColor: '#0ea5e9',
    secondaryColor: '#e0f2fe',
    design: 'gradient',
    price_balones: 500,
    lockedUntilLevel: 5,
  },
  {
    id: 'stripes-h-red',
    name: 'Franjas horizontales',
    tier: 'premium',
    primaryColor: '#dc2626',
    secondaryColor: '#ffffff',
    design: 'stripes_h',
    price_balones: 350,
  },
  {
    id: 'night-gold',
    name: 'Noche y oro',
    tier: 'premium',
    primaryColor: '#0f172a',
    secondaryColor: '#f59e0b',
    accentColor: '#7c3aed',
    design: 'gradient',
    price_balones: 800,
    lockedUntilLevel: 6,
  },
];

// ── CAMISETAS EXCLUSIVAS (futuro — compra real) ───────────────
export const EXCLUSIVE_SHIRTS: Shirt[] = [
  {
    id: 'legend-black',
    name: 'Camiseta Leyenda',
    tier: 'exclusive',
    primaryColor: '#111827',
    secondaryColor: '#f59e0b',
    accentColor: '#dc2626',
    design: 'gradient',
    lockedUntilLevel: 7,
  },
];

export const ALL_SHIRTS = [
  ...FREE_SHIRTS,
  ...PREMIUM_SHIRTS,
  ...EXCLUSIVE_SHIRTS,
];

export const getShirtById = (id: string): Shirt =>
  ALL_SHIRTS.find(s => s.id === id) ?? FREE_SHIRTS[0];

// Generar SVG de la camiseta según diseño
export const generateShirtSVG = (shirt: Shirt): string => {
  const { primaryColor: p, secondaryColor: s, accentColor: a, design } = shirt;

  const base = (content: string) => `
<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="shirtClip">
      <path d="M 30 0 L 0 50 L 35 65 L 35 240 L 165 240 L 165 65 L 200 50 L 170 0 L 140 25 Q 100 40 60 25 Z"/>
    </clipPath>
    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${p}"/>
      <stop offset="100%" stop-color="${a ?? s}"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#shirtClip)">
    ${content}
  </g>
  <!-- Cuello -->
  <path d="M 70 0 Q 100 30 130 0 Q 100 20 70 0" fill="${s}" opacity="0.9"/>
  <!-- Mangas -->
  <path d="M 30 0 L 0 50 L 35 65 L 50 30 Z" fill="${p}" opacity="0.85"/>
  <path d="M 170 0 L 200 50 L 165 65 L 150 30 Z" fill="${p}" opacity="0.85"/>
  <!-- Sombras sutiles -->
  <path d="M 35 65 L 35 240 L 50 240 L 50 65 Z" fill="rgba(0,0,0,0.06)"/>
  <path d="M 165 65 L 165 240 L 150 240 L 150 65 Z" fill="rgba(0,0,0,0.06)"/>
</svg>`;

  const designs: Record<string, string> = {
    solid: base(`
      <rect x="0" y="0" width="200" height="240" fill="${p}"/>`),

    stripes_v: base(`
      <rect x="0" y="0" width="200" height="240" fill="${p}"/>
      ${[0, 1, 2, 3, 4, 5, 6].map(i =>
        `<rect x="${i * 28}" y="0" width="14" height="240" fill="${s}" opacity="0.9"/>`
      ).join('')}`),

    stripes_h: base(`
      <rect x="0" y="0" width="200" height="240" fill="${p}"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i =>
        `<rect x="0" y="${i * 28}" width="200" height="14" fill="${s}" opacity="0.9"/>`
      ).join('')}`),

    gradient: base(`
      <rect x="0" y="0" width="200" height="240" fill="url(#grad)"/>`),

    halves: base(`
      <rect x="0" y="0" width="100" height="240" fill="${p}"/>
      <rect x="100" y="0" width="100" height="240" fill="${s}"/>`),

    collar: base(`
      <rect x="0" y="0" width="200" height="240" fill="${p}"/>
      <rect x="0" y="0" width="200" height="60" fill="${s}"/>`),
  };

  return designs[design] ?? designs.solid;
};
