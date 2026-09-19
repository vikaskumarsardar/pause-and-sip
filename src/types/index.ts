export type BreathPhase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

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
