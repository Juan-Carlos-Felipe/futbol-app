export interface FaceTraits {
  skinTone: string        // hex color
  hairColor: string       // hex color
  hairStyle: 'corto' | 'largo' | 'rizado' | 'calvo' | 'media'
  eyeColor: string        // hex color
  faceShape: 'oval' | 'redonda' | 'cuadrada'
  hasBeard: boolean
  beardStyle: 'none' | 'stubble' | 'short' | 'full'
  eyebrowThickness: 'finas' | 'normales' | 'gruesas'
  hasMustache: boolean
}

// Paletas predefinidas
export const SKIN_TONES = [
  { label: 'Muy claro',  value: '#fde8ce' },
  { label: 'Claro',      value: '#f5c89a' },
  { label: 'Medio claro',value: '#e8a87c' },
  { label: 'Medio',      value: '#c68642' },
  { label: 'Medio oscuro',value: '#a0522d' },
  { label: 'Oscuro',     value: '#7b3f00' },
  { label: 'Muy oscuro', value: '#4a1c00' },
  { label: 'Ébano',      value: '#2c0a00' },
]

export const HAIR_COLORS = [
  { label: 'Negro',      value: '#1a1008' },
  { label: 'Castaño',    value: '#4a2c0a' },
  { label: 'Marrón',     value: '#7b4f1e' },
  { label: 'Rubio',      value: '#c8a44a' },
  { label: 'Pelirrojo',  value: '#b03a00' },
  { label: 'Canoso',     value: '#9e9e9e' },
  { label: 'Blanco',     value: '#e0e0e0' },
  { label: 'Teñido',     value: '#1565c0' },
]

export const EYE_COLORS = [
  { label: 'Marrón oscuro', value: '#3e1f00' },
  { label: 'Marrón',        value: '#7b4f1e' },
  { label: 'Miel',          value: '#c8862a' },
  { label: 'Verde',         value: '#2e7d32' },
  { label: 'Azul',          value: '#1565c0' },
  { label: 'Gris',          value: '#607d8b' },
]

// Helpers de color
export const lighten = (hex: string, amount: number): string => {
  const cleanHex = hex.replace('#', '')
  const num = parseInt(cleanHex, 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amount))
  return '#' + [r, g, b].map(x =>
    x.toString(16).padStart(2, '0')).join('')
}

export const darken = (hex: string, amount: number): string =>
  lighten(hex, -amount)

// Generar SVG completo del rostro
export const generateFaceSVG = (t: FaceTraits): string => {
  const skin = t.skinTone
  const hair = t.hairColor
  const eyes = t.eyeColor
  const skinDark = darken(skin, 20)
  const skinLight = lighten(skin, 15)
  const hairDark = darken(hair, 25)
  const eyebrowH = t.eyebrowThickness === 'gruesas' ? 8
    : t.eyebrowThickness === 'finas' ? 4 : 6

  const hairStyles: Record<string, string> = {
    corto: `
      <ellipse cx="100" cy="48" rx="64" ry="34" fill="${hair}"/>
      <rect x="36" y="38" width="128" height="28" rx="6" fill="${hair}"/>
      <ellipse cx="36" cy="78" rx="10" ry="28" fill="${hair}"/>
      <ellipse cx="164" cy="78" rx="10" ry="28" fill="${hair}"/>`,
    media: `
      <ellipse cx="100" cy="46" rx="65" ry="36" fill="${hair}"/>
      <rect x="35" y="36" width="130" height="32" rx="6" fill="${hair}"/>
      <ellipse cx="34" cy="88" rx="12" ry="42" fill="${hair}"/>
      <ellipse cx="166" cy="88" rx="12" ry="42" fill="${hair}"/>`,
    largo: `
      <ellipse cx="100" cy="44" rx="66" ry="38" fill="${hair}"/>
      <rect x="28" y="58" width="20" height="120" rx="10" fill="${hair}"/>
      <rect x="152" y="58" width="20" height="120" rx="10" fill="${hair}"/>`,
    rizado: `
      <ellipse cx="100" cy="42" rx="70" ry="42" fill="${hair}"/>
      <ellipse cx="58" cy="56" rx="22" ry="20" fill="${hair}"/>
      <ellipse cx="142" cy="56" rx="22" ry="20" fill="${hair}"/>
      <ellipse cx="100" cy="38" rx="50" ry="28" fill="${hairDark}"/>`,
    calvo: `
      <ellipse cx="100" cy="52" rx="64" ry="30"
        fill="${lighten(skin, 5)}" opacity="0.3"/>`,
  }
  const hairSVG = hairStyles[t.hairStyle] ?? ''

  const beardStyles: Record<string, string> = {
    stubble: `<ellipse cx="100" cy="162" rx="38" ry="24"
      fill="${darken(skin, 35)}" opacity="0.22"/>`,
    short: `<path d="M70 148 Q100 178 130 148 Q130 180 100 185 Q70 180 70 148"
      fill="${darken(skin, 38)}" opacity="0.52"/>`,
    full: `<path d="M65 142 Q100 190 135 142 Q136 198 100 204 Q64 198 65 142"
      fill="${darken(skin, 40)}" opacity="0.68"/>`,
    none: '',
  }
  const beardSVG = !t.hasBeard ? '' : (beardStyles[t.beardStyle] ?? '')

  const mustacheSVG = t.hasMustache ? `
    <path d="M82 147 Q91 141 100 144 Q109 141 118 147
             Q111 152 100 150 Q89 152 82 147"
      fill="${darken(skin, 38)}" opacity="0.6"/>` : ''

  const faceRx = t.faceShape === 'redonda' ? 68
    : t.faceShape === 'cuadrada' ? 56 : 62
  const faceRy = t.faceShape === 'redonda' ? 70
    : t.faceShape === 'cuadrada' ? 76 : 78

  return `<svg viewBox="0 0 200 220"
    xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sg" cx="45%" cy="35%" r="65%">
      <stop offset="0%" stop-color="${skinLight}"/>
      <stop offset="100%" stop-color="${skin}"/>
    </radialGradient>
    <radialGradient id="cg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${darken(skin, 8)}"
        stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${skin}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Cuello -->
  <rect x="83" y="192" width="34" height="32" rx="5"
    fill="${skin}"/>

  <!-- Cara -->
  <ellipse cx="100" cy="112" rx="${faceRx}" ry="${faceRy}"
    fill="url(#sg)"/>

  <!-- Orejas -->
  <ellipse cx="35" cy="112" rx="10" ry="15" fill="${skin}"/>
  <ellipse cx="37" cy="112" rx="6" ry="10" fill="${skinDark}"/>
  <ellipse cx="165" cy="112" rx="10" ry="15" fill="${skin}"/>
  <ellipse cx="163" cy="112" rx="6" ry="10" fill="${skinDark}"/>

  <!-- Cabello -->
  ${hairSVG}

  <!-- Cejas -->
  <rect x="58" y="${80}" width="30" height="${eyebrowH}" rx="3"
    fill="${hairDark}"/>
  <rect x="112" y="${80}" width="30" height="${eyebrowH}" rx="3"
    fill="${hairDark}"/>

  <!-- Ojo izquierdo -->
  <ellipse cx="73" cy="102" rx="17" ry="13" fill="white"/>
  <ellipse cx="73" cy="103" rx="10" ry="10" fill="${eyes}"/>
  <ellipse cx="73" cy="103" rx="6.5" ry="7" fill="#111"/>
  <circle cx="76" cy="100" r="2.5" fill="white"/>
  <path d="M56 99 Q73 90 90 99" stroke="${skinDark}"
    stroke-width="1.8" fill="none"/>

  <!-- Ojo derecho -->
  <ellipse cx="127" cy="102" rx="17" ry="13" fill="white"/>
  <ellipse cx="127" cy="103" rx="10" ry="10" fill="${eyes}"/>
  <ellipse cx="127" cy="103" rx="6.5" ry="7" fill="#111"/>
  <circle cx="130" cy="100" r="2.5" fill="white"/>
  <path d="M110 99 Q127 90 144 99" stroke="${skinDark}"
    stroke-width="1.8" fill="none"/>

  <!-- Nariz -->
  <path d="M97 115 Q94 130 87 138 Q100 143 113 138 Q106 130 103 115"
    fill="${skinDark}" opacity="0.45"/>
  <ellipse cx="90" cy="137" rx="6" ry="4"
    fill="${skinDark}" opacity="0.4"/>
  <ellipse cx="110" cy="137" rx="6" ry="4"
    fill="${skinDark}" opacity="0.4"/>

  <!-- Boca -->
  <path d="M78 155 Q100 168 122 155"
    stroke="${darken(skin, 32)}" stroke-width="2.5"
    fill="none" stroke-linecap="round"/>
  <path d="M80 155 Q100 161 120 155"
    fill="${darken(skin, 18)}" opacity="0.35"/>

  <!-- Barba -->
  ${beardSVG}

  <!-- Bigote -->
  ${mustacheSVG}

  <!-- Mejillas -->
  <ellipse cx="55" cy="128" rx="22" ry="13"
    fill="url(#cg)"/>
  <ellipse cx="145" cy="128" rx="22" ry="13"
    fill="url(#cg)"/>

  <!-- Brillo frente -->
  <ellipse cx="100" cy="68" rx="28" ry="14"
    fill="white" opacity="0.07"/>
</svg>`
}
