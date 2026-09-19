export const APP_TAB = {
  BREATH: 'breath',
  WATER: 'water',
} as const;

export type AppTab = (typeof APP_TAB)[keyof typeof APP_TAB];

export const BREATH_PHASE = {
  INHALE: 'inhale',
  HOLD_IN: 'holdIn',
  EXHALE: 'exhale',
  HOLD_OUT: 'holdOut',
} as const;

export type BreathPhase = (typeof BREATH_PHASE)[keyof typeof BREATH_PHASE];

export const PAYWALL_PLAN = {
  MONTHLY: 'monthly',
  LIFETIME: 'lifetime',
} as const;

export type PaywallPlan = (typeof PAYWALL_PLAN)[keyof typeof PAYWALL_PLAN];

export const PACKAGE_ID = {
  MONTHLY_PRO: 'monthly_pro',
  LIFETIME_PRO: 'lifetime_pro',
  RC_MONTHLY: '$rc_monthly',
  RC_LIFETIME: '$rc_lifetime',
} as const;

export const HYDRATION_CONSTANTS = {
  DEFAULT_DAILY_TARGET_ML: 2500,
  PRESET_GLASS_ML: 250,
  PRESET_BOTTLE_ML: 500,
  PERCENT_MAX: 100,
  PERCENT_MULTIPLIER: 100,
} as const;

export const BREATHING_CONSTANTS = {
  DEFAULT_PHASE_DURATION_SEC: 4,
  DEFAULT_TOTAL_CYCLES: 4,
  ORB_MIN_SCALE: 0.45,
  ORB_MAX_SCALE: 1.0,
  ORB_PULSE_SCALE: 1.03,
  ORB_REST_SCALE: 0.42,
  OPACITY_FULL: 0.95,
  OPACITY_MID: 0.85,
  OPACITY_LOW: 0.25,
  OPACITY_MIN: 0.15,
  TIMER_INTERVAL_MS: 1000,
  AURA_ROTATION_MS: 16000,
} as const;

export const NOTIFICATION_CONSTANTS = {
  DEFAULT_INTERVAL_MINUTES: 45,
  DEBUG_LOG_LEVEL_VERBOSE: 6,
} as const;

export interface BreathPhaseConfig {
  phase: BreathPhase;
  durationSeconds: number;
  label: string;
  color: string;
}

export interface BreathPattern {
  id: string;
  name: string;
  description: string;
  inhaleDurationSec: number;
  holdInDurationSec: number;
  exhaleDurationSec: number;
  holdOutDurationSec: number;
  phases: BreathPhaseConfig[];
}

export interface WaterLog {
  id: string;
  timestamp: number;
  amountMl: number;
  presetLabel: string;
}

export interface UserStreak {
  currentStreakDays: number;
  bestStreakDays: number;
  lastActiveDate: string;
}

export interface DeskSettings {
  dailyWaterTargetMl: number;
  unitSystem: 'ml' | 'oz';
  reminderIntervalMinutes: number;
  breathingPatternId: string;
}

export interface SubscriptionOffering {
  id: string;
  identifier: string;
  title: string;
  description: string;
  priceString: string;
  period: PaywallPlan;
  isBestValue?: boolean;
}
