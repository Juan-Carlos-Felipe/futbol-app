import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import type { GeneratedAvatarFeatures } from '@/lib/avatar';

type GeneratedFootballAvatarProps = {
  features: GeneratedAvatarFeatures;
  teamColor: string;
};

export default function GeneratedFootballAvatar({ features, teamColor }: GeneratedFootballAvatarProps) {
  const faceW = 78 * features.faceWidth;
  const faceH = 104 * features.faceHeight;
  const jawW = 54 * features.jawWidth;
  const cheekW = 72 * features.cheekWidth;
  const eyeGap = 23 * features.eyeSpacing;
  const eyeSize = 5.2 * features.eyeSize;
  const noseW = 10 * features.noseWidth;
  const noseL = 24 * features.noseLength;
  const mouthW = 27 * features.mouthWidth;
  const mouthH = 4.6 * features.mouthFullness;
  const hairTop = 69 * features.hairline;
  const hairLift = 18 * features.hairVolume;

  return (
    <Svg width="100%" height="100%" viewBox="0 0 220 320">
      <Defs>
        <SvgLinearGradient id="kit" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={lighten(teamColor, 36)} />
          <Stop offset="0.52" stopColor={teamColor} />
          <Stop offset="1" stopColor={darken(teamColor, 0.46)} />
        </SvgLinearGradient>
        <SvgLinearGradient id="skin" x1="0.2" y1="0" x2="0.85" y2="1">
          <Stop offset="0" stopColor={lighten(features.skinColor, 24)} />
          <Stop offset="0.55" stopColor={features.skinColor} />
          <Stop offset="1" stopColor={features.skinShadowColor} />
        </SvgLinearGradient>
        <RadialGradient id="faceLight" cx="38%" cy="28%" rx="58%" ry="62%">
          <Stop offset="0" stopColor="rgba(255,255,255,0.24)" />
          <Stop offset="0.7" stopColor="rgba(255,255,255,0)" />
        </RadialGradient>
        <SvgLinearGradient id="shadow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgba(0,0,0,0)" />
          <Stop offset="1" stopColor="rgba(0,0,0,0.34)" />
        </SvgLinearGradient>
      </Defs>

      <Ellipse cx="110" cy="292" rx="72" ry="15" fill="rgba(0,0,0,0.42)" />

      <Path
        d="M40 294 C45 230 58 196 85 180 L96 175 L124 175 L137 181 C163 197 176 230 181 294 Z"
        fill="url(#kit)"
      />
      <Path d="M63 217 C77 233 91 241 110 242 C129 241 144 233 158 217" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
      <Path d="M66 193 C78 215 94 228 110 229 C126 228 142 215 154 193" fill="rgba(16,17,29,0.36)" />
      <Path d="M90 176 C94 195 126 195 130 176 L126 157 L94 157 Z" fill="url(#skin)" />
      <Path d="M92 181 C99 190 121 190 128 181" stroke="rgba(0,0,0,0.22)" strokeWidth="2" strokeLinecap="round" />

      <Ellipse cx={110 - faceW / 2 - 3} cy="125" rx="8" ry="17" fill="url(#skin)" />
      <Ellipse cx={110 + faceW / 2 + 3} cy="125" rx="8" ry="17" fill="url(#skin)" />
      <Path d={`M${110 - faceW / 2 - 4} 121 C${110 - faceW / 2 - 10} 128 ${110 - faceW / 2 - 5} 136 ${110 - faceW / 2 + 1} 132`} stroke={features.skinShadowColor} strokeWidth="1.4" fill="none" opacity="0.58" />
      <Path d={`M${110 + faceW / 2 + 4} 121 C${110 + faceW / 2 + 10} 128 ${110 + faceW / 2 + 5} 136 ${110 + faceW / 2 - 1} 132`} stroke={features.skinShadowColor} strokeWidth="1.4" fill="none" opacity="0.58" />
      <Path
        d={`M${110 - faceW / 2} 116
           C${110 - cheekW / 2} 85 ${110 - faceW / 2 + 9} 63 110 ${hairTop}
           C${110 + faceW / 2 - 9} 63 ${110 + cheekW / 2} 85 ${110 + faceW / 2} 116
           C${110 + jawW / 2} ${118 + faceH * 0.54} ${110 + jawW / 3} ${138 + faceH * 0.48} 110 ${152 + faceH * 0.28}
           C${110 - jawW / 3} ${138 + faceH * 0.48} ${110 - jawW / 2} ${118 + faceH * 0.54} ${110 - faceW / 2} 116 Z`}
        fill="url(#skin)"
      />
      <Path
        d={`M${110 + faceW / 2 - 7} 98
           C${110 + faceW / 2 + 1} 124 ${110 + jawW / 2 - 1} ${136 + faceH * 0.45} 110 ${152 + faceH * 0.28}
           C${110 + jawW / 2 - 10} ${142 + faceH * 0.42} ${110 + faceW / 2 - 10} 120 ${110 + faceW / 2 - 7} 98 Z`}
        fill="rgba(0,0,0,0.12)"
      />
      <Path
        d={`M${110 - faceW / 2 + 5} 116
           C${110 - cheekW / 2 + 2} 89 ${110 - faceW / 2 + 14} 70 110 ${hairTop + 3}
           C${110 - 7} 98 ${110 - 8} 132 110 ${151 + faceH * 0.22}
           C${110 - jawW / 3} ${140 + faceH * 0.45} ${110 - jawW / 2} ${119 + faceH * 0.52} ${110 - faceW / 2 + 5} 116 Z`}
        fill="url(#faceLight)"
      />
      <Path
        d={`M${110 - jawW / 3} ${139 + faceH * 0.48} Q110 ${155 + faceH * 0.25} ${110 + jawW / 3} ${139 + faceH * 0.48}`}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />

      <Path
        d={`M${110 - faceW / 2 - 1} ${hairTop + 5}
           C${110 - 36} ${hairTop - hairLift} ${110 - 8} ${hairTop - hairLift - 6} ${110 + 30} ${hairTop - hairLift + 2}
           C${110 + faceW / 2 + 6} ${hairTop + 12} ${110 + faceW / 2 - 2} 92 ${110 + faceW / 2 - 5} 106
           C${110 + 28} 90 ${110 + 6} 84 ${110 - 18} 88
           C${110 - 34} 90 ${110 - faceW / 2 - 7} 99 ${110 - faceW / 2 - 1} ${hairTop + 5} Z`}
        fill={features.hairColor}
      />
      <Path
        d={`M${110 - faceW / 2 + 5} ${hairTop + 2} C${110 - 20} ${hairTop - hairLift - 3} ${110 + 7} ${hairTop - hairLift} ${110 + faceW / 2 - 10} ${hairTop + 8}`}
        stroke={lighten(features.hairColor, 28)}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.42"
      />

      <G>
        <Path d={`M${110 - eyeGap - 14} 109 Q${110 - eyeGap - 3} ${105 - features.eyebrowTilt * 20} ${110 - eyeGap + 12} 108`} stroke={features.hairColor} strokeWidth="3.3" strokeLinecap="round" />
        <Path d={`M${110 + eyeGap - 12} 108 Q${110 + eyeGap + 3} ${105 + features.eyebrowTilt * 20} ${110 + eyeGap + 14} 109`} stroke={features.hairColor} strokeWidth="3.3" strokeLinecap="round" />
        <Ellipse cx={110 - eyeGap} cy="120" rx={eyeSize + 3.5} ry="4.2" fill="rgba(255,255,255,0.92)" />
        <Ellipse cx={110 + eyeGap} cy="120" rx={eyeSize + 3.5} ry="4.2" fill="rgba(255,255,255,0.92)" />
        <Ellipse cx={110 - eyeGap} cy="120" rx={eyeSize * 0.55} ry={eyeSize * 0.58} fill="#10111d" />
        <Ellipse cx={110 + eyeGap} cy="120" rx={eyeSize * 0.55} ry={eyeSize * 0.58} fill="#10111d" />
        <Ellipse cx={110 - eyeGap + 1.2} cy="118.5" rx="1.2" ry="1" fill="rgba(255,255,255,0.75)" />
        <Ellipse cx={110 + eyeGap + 1.2} cy="118.5" rx="1.2" ry="1" fill="rgba(255,255,255,0.75)" />
      </G>
      <Path d={`M${110 - eyeGap - 11} 126 Q${110 - eyeGap} 130 ${110 - eyeGap + 11} 126`} stroke="rgba(0,0,0,0.14)" strokeWidth="1.2" fill="none" />
      <Path d={`M${110 + eyeGap - 11} 126 Q${110 + eyeGap} 130 ${110 + eyeGap + 11} 126`} stroke="rgba(0,0,0,0.14)" strokeWidth="1.2" fill="none" />

      <Path
        d={`M110 125 C${110 - noseW / 2} ${130 + noseL * 0.25} ${110 - noseW / 2} ${139 + noseL * 0.5} ${110 - noseW * 0.75} ${146 + noseL * 0.35}
           M110 125 C${110 + noseW / 2} ${131 + noseL * 0.25} ${110 + noseW / 2} ${139 + noseL * 0.5} ${110 + noseW * 0.75} ${146 + noseL * 0.35}`}
        stroke={darken(features.skinShadowColor, 0.84)}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.66"
      />
      <Path
        d={`M${110 - mouthW / 2} 164 Q110 ${168 + mouthH} ${110 + mouthW / 2} 164
           Q110 ${172 + mouthH * 0.25} ${110 - mouthW / 2} 164 Z`}
        fill="#6b3335"
        opacity="0.9"
      />
      <Path d={`M${110 - mouthW / 2 + 4} 166 Q110 ${170 + mouthH * 0.4} ${110 + mouthW / 2 - 4} 166`} stroke="rgba(255,255,255,0.24)" strokeWidth="1.3" strokeLinecap="round" />

      <Rect x="70" y="216" width="80" height="5" rx="3" fill="rgba(255,255,255,0.34)" transform="rotate(-8 110 218)" />
      <Path d="M73 203 L91 294" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      <Path d="M95 199 L110 294" stroke="rgba(255,255,255,0.08)" strokeWidth="1.4" />
      <Path d="M125 199 L110 294" stroke="rgba(0,0,0,0.12)" strokeWidth="1.4" />
      <Path d="M147 203 L129 294" stroke="rgba(0,0,0,0.14)" strokeWidth="2" />
      <Path d="M44 294 C47 251 59 219 78 199" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
      <Path d="M176 294 C173 251 161 219 142 199" stroke="rgba(0,0,0,0.24)" strokeWidth="2" />
      <Rect x="40" y="180" width="142" height="114" fill="url(#shadow)" opacity="0.42" />
    </Svg>
  );
}

function lighten(color: string, amount: number) {
  return shift(color, amount);
}

function darken(color: string, amount: number) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
  const channels = [1, 3, 5].map((start) => Math.round(parseInt(color.slice(start, start + 2), 16) * amount));
  return `#${channels.map((channel) => clamp(channel, 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function shift(color: string, amount: number) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
  const channels = [1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16) + amount);
  return `#${channels.map((channel) => clamp(channel, 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
