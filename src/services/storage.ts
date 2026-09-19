import AsyncStorage from '@react-native-async-storage/async-storage';
import { WaterLogEntry } from '@/types/water';
import { BreathSessionLog } from '@/types/breath';
import { UserProfileSettings, UserStreak } from '@/types/user';
import { HYDRATION_CONSTANTS, BREATH_PHASE, NOTIFICATION_CONSTANTS } from '@/types';

const STORAGE_KEYS = {
  WATER_LOGS: '@pause_sip/water_logs',
  BREATH_LOGS: '@pause_sip/breath_logs',
  USER_SETTINGS: '@pause_sip/user_settings',
  USER_STREAK: '@pause_sip/user_streak',
  ENTITLEMENT: '@pause_sip/entitlement',
} as const;

const WORK_HOURS = {
  START_HOUR: 9,
  END_HOUR: 18,
  INITIAL_STREAK_COUNT: 1,
} as const;

export const DEFAULT_USER_SETTINGS: UserProfileSettings = {
  dailyWaterTargetMl: HYDRATION_CONSTANTS.DEFAULT_DAILY_TARGET_ML,
  unitSystem: 'ml',
  deskReminders: {
    enabled: true,
    intervalMinutes: NOTIFICATION_CONSTANTS.DEFAULT_INTERVAL_MINUTES,
    startHour: WORK_HOURS.START_HOUR,
    endHour: WORK_HOURS.END_HOUR,
    hapticFeedback: true,
    soundEnabled: true,
  },
  breathingDefaultPattern: BREATH_PHASE.HOLD_IN,
  hasSeenOnboarding: false,
};

export const DEFAULT_USER_STREAK: UserStreak = {
  currentStreakDays: WORK_HOURS.INITIAL_STREAK_COUNT,
  bestStreakDays: WORK_HOURS.INITIAL_STREAK_COUNT,
  lastActiveDate: new Date().toISOString().split('T')[0],
};

export class StorageService {
  /** Save water intake logs */
  static async saveWaterLogs(logs: WaterLogEntry[]): Promise<void> {
    try {
      const payload = JSON.stringify(logs);
      await AsyncStorage.setItem(STORAGE_KEYS.WATER_LOGS, payload);
    } catch (error) {
      console.error('[StorageService] Error saving water logs:', error);
    }
  }

  /** Load water intake logs */
  static async getWaterLogs(): Promise<WaterLogEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WATER_LOGS);
      const parsedLogs: WaterLogEntry[] = data ? JSON.parse(data) : [];
      return parsedLogs;
    } catch (error) {
      console.error('[StorageService] Error reading water logs:', error);
      return [];
    }
  }

  /** Save breathing session history */
  static async saveBreathLogs(logs: BreathSessionLog[]): Promise<void> {
    try {
      const payload = JSON.stringify(logs);
      await AsyncStorage.setItem(STORAGE_KEYS.BREATH_LOGS, payload);
    } catch (error) {
      console.error('[StorageService] Error saving breath logs:', error);
    }
  }

  /** Load breathing session history */
  static async getBreathLogs(): Promise<BreathSessionLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BREATH_LOGS);
      const parsedLogs: BreathSessionLog[] = data ? JSON.parse(data) : [];
      return parsedLogs;
    } catch (error) {
      console.error('[StorageService] Error reading breath logs:', error);
      return [];
    }
  }

  /** Save user profile settings */
  static async saveUserSettings(settings: UserProfileSettings): Promise<void> {
    try {
      const payload = JSON.stringify(settings);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, payload);
    } catch (error) {
      console.error('[StorageService] Error saving settings:', error);
    }
  }

  /** Load user profile settings */
  static async getUserSettings(): Promise<UserProfileSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      const parsedSettings: UserProfileSettings = data ? JSON.parse(data) : DEFAULT_USER_SETTINGS;
      return parsedSettings;
    } catch (error) {
      console.error('[StorageService] Error reading settings:', error);
      return DEFAULT_USER_SETTINGS;
    }
  }

  /** Save user streak data */
  static async saveUserStreak(streak: UserStreak): Promise<void> {
    try {
      const payload = JSON.stringify(streak);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_STREAK, payload);
    } catch (error) {
      console.error('[StorageService] Error saving streak:', error);
    }
  }

  /** Load user streak data */
  static async getUserStreak(): Promise<UserStreak> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_STREAK);
      const parsedStreak: UserStreak = data ? JSON.parse(data) : DEFAULT_USER_STREAK;
      return parsedStreak;
    } catch (error) {
      console.error('[StorageService] Error reading streak:', error);
      return DEFAULT_USER_STREAK;
    }
  }

  /** Clear all local data (Reset) */
  static async clearAllData(): Promise<void> {
    try {
      const keysToClear = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keysToClear);
    } catch (error) {
      console.error('[StorageService] Error clearing storage:', error);
    }
  }
}
