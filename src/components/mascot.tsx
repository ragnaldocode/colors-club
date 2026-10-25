import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

interface MascotProps {
  size?: number;
  mood?: 'happy' | 'cheer';
}

/**
 * Lumi — personagem original do Colors Club: um vaga-lume-estrela que guia a criança.
 * Desenhado em vetor para não depender de imagens externas.
 */
export function Mascot({ size = 96, mood = 'happy' }: MascotProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel="Lumi, o vaga-lume">
      <Ellipse cx="60" cy="108" rx="34" ry="6" fill={colors.accentSoft} />
      <G>
        <Ellipse cx="38" cy="42" rx="16" ry="22" fill={colors.white} stroke={colors.ink} strokeWidth="3" opacity="0.95" />
        <Ellipse cx="82" cy="42" rx="16" ry="22" fill={colors.white} stroke={colors.ink} strokeWidth="3" opacity="0.95" />
      </G>
      <Path d="M 50 22 q -8 -14 -18 -16" stroke={colors.ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M 70 22 q 8 -14 18 -16" stroke={colors.ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      <Circle cx="32" cy="6" r="4" fill={colors.accent} stroke={colors.ink} strokeWidth="2" />
      <Circle cx="88" cy="6" r="4" fill={colors.accent} stroke={colors.ink} strokeWidth="2" />
      <Circle cx="60" cy="62" r="32" fill={colors.accent} stroke={colors.ink} strokeWidth="3.5" />
      <Ellipse cx="60" cy="72" rx="20" ry="16" fill={colors.accentSoft} />
      <Circle cx="49" cy="56" r="4.5" fill={colors.ink} />
      <Circle cx="71" cy="56" r="4.5" fill={colors.ink} />
      {mood === 'cheer' ? (
        <Path d="M 50 70 q 10 12 20 0" stroke={colors.ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <Path d="M 52 70 q 8 7 16 0" stroke={colors.ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      <Circle cx="38" cy="66" r="5" fill={colors.primary} opacity="0.45" />
      <Circle cx="82" cy="66" r="5" fill={colors.primary} opacity="0.45" />
    </Svg>
  );
}
