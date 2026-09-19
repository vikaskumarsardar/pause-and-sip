import { COLORS } from './colors';
import { SPACING, RADIUS, HARDWARE } from './spacing';
import { TYPOGRAPHY } from './typography';

export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  radius: RADIUS,
  hardware: HARDWARE,
  typography: TYPOGRAPHY,
} as const;

export type Theme = typeof THEME;
export { COLORS, SPACING, RADIUS, HARDWARE, TYPOGRAPHY };
