/**
 * Paleta e medidas do Colors Club.
 * Cores quentes e acolhedoras, com contraste verificado para textos e botões.
 */
export const colors = {
  background: '#FFF7F0',
  surface: '#FFFFFF',
  surfaceAlt: '#FFEFE2',
  ink: '#2E2440',
  inkSoft: '#6C5F82',
  outline: '#EADCCD',
  primary: '#FF6F5B',
  primaryDark: '#C34432',
  primarySoft: '#FFE3DC',
  secondary: '#3FB8AF',
  secondaryDark: '#2A857E',
  secondarySoft: '#DDF4F1',
  accent: '#FFC93C',
  accentDark: '#8A6400',
  accentSoft: '#FFF3D1',
  success: '#3FAE6A',
  successDark: '#2C7A4A',
  successSoft: '#E4F6EA',
  danger: '#D64550',
  dangerSoft: '#FDE7E9',
  locked: '#9C93AE',
  lockedSoft: '#EDE8F3',
  white: '#FFFFFF',
  canvas: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 26,
  xl: 34,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, fontWeight: '800' as const, letterSpacing: 0.2 },
  title: { fontSize: 24, fontWeight: '800' as const },
  heading: { fontSize: 19, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '500' as const },
  label: { fontSize: 14, fontWeight: '700' as const },
  caption: { fontSize: 12, fontWeight: '600' as const },
} as const;

/** Cores disponíveis para pintar. Cores claramente distinguíveis. */
export const palette = [
  '#FF5C5C',
  '#FF9F45',
  '#FFD23F',
  '#A8D84B',
  '#3FB86B',
  '#2EC4B6',
  '#3FA9F5',
  '#4E6EF2',
  '#8E6BF2',
  '#D96BD4',
  '#F26D9C',
  '#8B5E3C',
  '#3B3144',
  '#FFFFFF',
] as const;
