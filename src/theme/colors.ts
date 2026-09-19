export const COLORS = {
  // Backgrounds
  background: '#0B0F17', // Deep Slate Slate
  surface: '#161F2E',    // Card / Sheet Surface
  surfaceElevated: '#1E2B3E', // Elevated Card
  
  // Borders
  border: '#233044',     // 1px Border Color
  borderFocused: '#38BDF8', // Active Border

  // Accents
  water: '#38BDF8',      // Fluid Sky Blue
  waterGlow: 'rgba(56, 189, 248, 0.25)',
  inhale: '#10B981',     // Soft Emerald
  emerald: '#10B981',    // Emerald Accent
  inhaleGlow: 'rgba(16, 185, 129, 0.25)',
  exhale: '#818CF8',     // Gentle Periwinkle
  exhaleGlow: 'rgba(129, 140, 248, 0.25)',
  hold: '#F59E0B',       // Soft Amber
  holdGlow: 'rgba(245, 158, 11, 0.25)',

  // Typography
  title: '#F0F6FC',      // Primary Text
  body: '#8B949E',       // Secondary Text
  muted: '#484F58',      // Tertiary / Subdued Text

  // Feedback & Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  // Pro / RevenueCat Accent
  gold: '#FBBF24',
  goldGlow: 'rgba(251, 191, 36, 0.2)',
} as const;

export type ColorToken = keyof typeof COLORS;
