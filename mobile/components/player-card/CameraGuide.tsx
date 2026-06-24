import React from 'react';
import Svg, { Ellipse, Rect, Path, Defs, Mask, Line, Rect as SvgRect } from 'react-native-svg';

interface CameraGuideProps {
  mode: 'bust';
  screenWidth: number;
  screenHeight: number;
}

export const CameraGuide: React.FC<CameraGuideProps> = ({ screenWidth, screenHeight }) => {
  const guideWidth = screenWidth * 0.72;
  const guideHeight = screenHeight * 0.65;
  const centerX = screenWidth / 2;
  const centerY = screenHeight * 0.42;

  return (
    <Svg width={screenWidth} height={screenHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <Mask id="guideMask">
          {/* Todo blanco = visible */}
          <SvgRect width={screenWidth} height={screenHeight} fill="white" />
          {/* Área guía = negro = transparente (se ve la cámara) */}
          <Rect
            x={centerX - guideWidth / 2}
            y={centerY - guideHeight / 2}
            width={guideWidth}
            height={guideHeight}
            rx={guideWidth * 0.15}
            fill="black"
          />
        </Mask>
      </Defs>

      {/* Overlay oscuro exterior */}
      <SvgRect
        width={screenWidth}
        height={screenHeight}
        fill="rgba(0,0,0,0.52)"
        mask="url(#guideMask)"
      />

      {/* Marco de la silueta */}
      <Rect
        x={centerX - guideWidth / 2}
        y={centerY - guideHeight / 2}
        width={guideWidth}
        height={guideHeight}
        rx={guideWidth * 0.15}
        fill="none"
        stroke="#ffffff"
        strokeWidth={2.5}
        strokeDasharray="12,6"
      />

      {/* Esquinas marcadas */}
      <Path
        d={`M ${centerX - guideWidth / 2 + 30} ${centerY - guideHeight / 2} L ${centerX - guideWidth / 2} ${centerY - guideHeight / 2} L ${centerX - guideWidth / 2} ${centerY - guideHeight / 2 + 30}`}
        fill="none" stroke="#16a34a" strokeWidth={4} strokeLinecap="round"
      />
      <Path
        d={`M ${centerX + guideWidth / 2 - 30} ${centerY - guideHeight / 2} L ${centerX + guideWidth / 2} ${centerY - guideHeight / 2} L ${centerX + guideWidth / 2} ${centerY - guideHeight / 2 + 30}`}
        fill="none" stroke="#16a34a" strokeWidth={4} strokeLinecap="round"
      />
      <Path
        d={`M ${centerX - guideWidth / 2} ${centerY + guideHeight / 2 - 30} L ${centerX - guideWidth / 2} ${centerY + guideHeight / 2} L ${centerX - guideWidth / 2 + 30} ${centerY + guideHeight / 2}`}
        fill="none" stroke="#16a34a" strokeWidth={4} strokeLinecap="round"
      />
      <Path
        d={`M ${centerX + guideWidth / 2} ${centerY + guideHeight / 2 - 30} L ${centerX + guideWidth / 2} ${centerY + guideHeight / 2} L ${centerX + guideWidth / 2 - 30} ${centerY + guideHeight / 2}`}
        fill="none" stroke="#16a34a" strokeWidth={4} strokeLinecap="round"
      />

      {/* Línea horizontal guía (nivel de hombros) */}
      <Line
        x1={centerX - guideWidth / 2 + 10}
        y1={centerY + guideHeight * 0.12}
        x2={centerX + guideWidth / 2 - 10}
        y2={centerY + guideHeight * 0.12}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={1}
        strokeDasharray="4,4"
      />

      {/* Línea vertical central */}
      <Line
        x1={centerX}
        y1={centerY - guideHeight / 2 + 10}
        x2={centerX}
        y2={centerY + guideHeight / 2 - 10}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
        strokeDasharray="4,4"
      />

      {/* Óvalo para la cabeza */}
      <Ellipse
        cx={centerX}
        cy={centerY - guideHeight * 0.18}
        rx={guideWidth * 0.28}
        ry={guideHeight * 0.22}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
        strokeDasharray="6,4"
      />
    </Svg>
  );
};
