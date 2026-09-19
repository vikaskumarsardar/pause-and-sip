import { TextStyle } from 'react-native';
import { COLORS } from './colors';

export const TYPOGRAPHY: Record<string, TextStyle> = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.title,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.title,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.title,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.body,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.body,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.muted,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.title,
    letterSpacing: 0.1,
  },
  metricDisplay: {
    fontSize: 44,
    fontWeight: '700',
    color: COLORS.title,
    lineHeight: 52,
    letterSpacing: -1,
  },
};
