export const APP_TAB = {
  BREATH: 'breath',
  WATER: 'water',
} as const;

export type AppTab = (typeof APP_TAB)[keyof typeof APP_TAB];

export const PLATFORM_OS = {
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
} as const;

export type PlatformOS = (typeof PLATFORM_OS)[keyof typeof PLATFORM_OS];

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

export const REVENUECAT_KEYS = {
  APPLE: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'appl_demo_key_pause_sip_shipathon',
  GOOGLE: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || 'goog_demo_key_pause_sip_shipathon',
  PRO_ENTITLEMENT_ID: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || 'pro_access',
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
  ONESIGNAL_APP_ID: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || 'pause-sip-onesignal-app-id-demo',
  REMINDER_TAG_KEY: 'desk_reminder_interval',
  DEFAULT_INTERVAL_MINUTES: 45,
  DEBUG_LOG_LEVEL_VERBOSE: 6,
} as const;

export const AUDIO_SYNTHESIS_CONSTANTS = {
  MASTER_GAIN_DEFAULT: 0.25,
  CUSTOM_AUDIO_VOLUME: 0.55,
  SAMPLE_RATE_BUFFER_4SEC: 4,
  SAMPLE_RATE_BUFFER_3SEC: 3,
  WATERFALL_ROAR_FREQ: 650,
  WATERFALL_SPRAY_FREQ: 3200,
  WATERFALL_RUMBLE_FREQ: 52,
  RAIN_LOWPASS_FREQ: 1100,
  OCEAN_LOWPASS_FREQ: 500,
  FIREPLACE_LOWPASS_FREQ: 350,
  FIREPLACE_HIGHPASS_FREQ: 2200,
  BREEZE_BANDPASS_FREQ: 400,
  COSMIC_SOLFEGGIO_FREQ: 528,
  COSMIC_THETA_FREQ: 532,
  ALPHA_BASE_FREQ: 216,
  ALPHA_BEAT_FREQ: 226,
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
  isCustom?: boolean;
}

export interface CustomSoundItem {
  id: string;
  name: string;
  uri: string;
  isCustom: true;
}

export const STORAGE_KEYS = {
  CUSTOM_BREATH_PATTERNS: '@pause_sip_custom_breath_patterns',
  CUSTOM_SOUNDS: '@pause_sip_custom_sounds',
  WATER_LOGS: '@pause_sip_water_logs',
  DESK_SETTINGS: '@pause_sip_desk_settings',
  USER_STREAK: '@pause_sip_user_streak',
} as const;

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

export const BREATH_PRESETS: BreathPattern[] = [
  {
    id: 'box',
    name: 'Box 4-4-4-4',
    description: 'Equal ratio reset for deep focus',
    inhaleDurationSec: 4,
    holdInDurationSec: 4,
    exhaleDurationSec: 4,
    holdOutDurationSec: 4,
    phases: [],
  },
  {
    id: 'sleep_478',
    name: '4-7-8 Relax',
    description: 'Calms nervous system for deep rest',
    inhaleDurationSec: 4,
    holdInDurationSec: 7,
    exhaleDurationSec: 8,
    holdOutDurationSec: 0,
    phases: [],
  },
  {
    id: 'physio_sigh',
    name: 'Sigh 2-1-6',
    description: 'Stanford fast stress reduction sigh',
    inhaleDurationSec: 2,
    holdInDurationSec: 1,
    exhaleDurationSec: 6,
    holdOutDurationSec: 0,
    phases: [],
  },
  {
    id: 'anxiety_711',
    name: '7-11 Anti-Anxiety',
    description: 'Slower exhale triggers deep vagal calm',
    inhaleDurationSec: 7,
    holdInDurationSec: 0,
    exhaleDurationSec: 11,
    holdOutDurationSec: 0,
    phases: [],
  },
  {
    id: 'coherence_55',
    name: '5-5 Coherence',
    description: 'Balances heart rate & breathing',
    inhaleDurationSec: 5,
    holdInDurationSec: 0,
    exhaleDurationSec: 5,
    holdOutDurationSec: 0,
    phases: [],
  },
  {
    id: 'quick_boost',
    name: '2-0-2 Energy',
    description: 'Rapid desk boost for alertness',
    inhaleDurationSec: 2,
    holdInDurationSec: 0,
    exhaleDurationSec: 2,
    holdOutDurationSec: 0,
    phases: [],
  },
];

export const SOUNDSCAPES = {
  OFF: 'off',
  WATERFALL: 'waterfall',
  RAIN: 'rain',
  OCEAN: 'ocean',
  FIREPLACE: 'fireplace',
  BREEZE: 'breeze',
  COSMIC: 'cosmic',
  ALPHA: 'alpha',
} as const;

export type SoundscapeType = (typeof SOUNDSCAPES)[keyof typeof SOUNDSCAPES];

export interface SoundscapeItem {
  id: SoundscapeType;
  name: string;
  category: 'water' | 'nature' | 'cozy' | 'focus';
}

export const SOUNDSCAPE_LIST: SoundscapeItem[] = [
  { id: SOUNDSCAPES.WATERFALL, name: 'Waterfall', category: 'water' },
  { id: SOUNDSCAPES.RAIN, name: 'Rainfall', category: 'water' },
  { id: SOUNDSCAPES.OCEAN, name: 'Ocean Surf', category: 'water' },
  { id: SOUNDSCAPES.FIREPLACE, name: 'Cozy Fire', category: 'cozy' },
  { id: SOUNDSCAPES.BREEZE, name: 'Forest Wind', category: 'nature' },
  { id: SOUNDSCAPES.COSMIC, name: '528Hz Miracle', category: 'focus' },
  { id: SOUNDSCAPES.ALPHA, name: '432Hz Alpha', category: 'focus' },
];

