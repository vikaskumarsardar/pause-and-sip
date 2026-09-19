import { UnitSystem } from './water';

export interface UserStreak {
  currentStreakDays: number;
  bestStreakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export interface ReminderSchedule {
  enabled: boolean;
  intervalMinutes: number; // e.g. every 45 or 60 min
  startHour: number;       // e.g. 9 (9 AM)
  endHour: number;         // e.g. 18 (6 PM)
  hapticFeedback: boolean;
  soundEnabled: boolean;
}

export interface UserProfileSettings {
  dailyWaterTargetMl: number;
  unitSystem: UnitSystem;
  deskReminders: ReminderSchedule;
  breathingDefaultPattern: string;
  hasSeenOnboarding: boolean;
}

export interface AppStateData {
  userSettings: UserProfileSettings;
  streak: UserStreak;
}
