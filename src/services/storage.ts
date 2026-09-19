import AsyncStorage from '@react-native-async-storage/async-storage';
import { WaterLogEntry } from '../types/water';
import { BreathSessionLog } from '../types/breath';
import { UserProfileSettings, UserStreak } from '../types/user';

const STORAGE_KEYS = {
  WATER_LOGS: '@pause_sip/water_logs',
  BREATH_LOGS: '@pause_sip/breath_logs',
  USER_SETTINGS: '@pause_sip/user_settings',
  USER_STREAK: '@pause_sip/user_streak',
  ENTITLEMENT: '@pause_sip/entitlement',
} as const;

export const DEFAULT_USER_SETTINGS: UserProfileSettings = {
  dailyWaterTargetMl: 2500,
  unitSystem: 'ml',
  deskReminders: {
    enabled: true,
    intervalMinutes: 45,
    startHour: 9,
    endHour: 18,
    hapticFeedback: true,
    soundEnabled: true,
  },
  breathingDefaultPattern: 'box',
  hasSeenOnboarding: false,
};

export const DEFAULT_USER_STREAK: UserStreak = {
  currentStreakDays: 1,
  bestStreakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
};

export class StorageService {
  /** Save water intake logs */
  static async saveWaterLogs(logs: WaterLogEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('[StorageService] Error saving water logs:', error);
    }
  }

  /** Load water intake logs */
  static async getWaterLogs(): Promise<WaterLogEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WATER_LOGS);
      return data ? (JSON.parse(data) as WaterLogEntry[]) : [];
    } catch (error) {
      console.error('[StorageService] Error reading water logs:', error);
      return [];
    }
  }

  /** Save breathing session history */
  static async saveBreathLogs(logs: BreathSessionLog[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BREATH_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('[StorageService] Error saving breath logs:', error);
    }
  }

  /** Load breathing session history */
  static async getBreathLogs(): Promise<BreathSessionLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BREATH_LOGS);
      return data ? (JSON.parse(data) as BreathSessionLog[]) : [];
    } catch (error) {
      console.error('[StorageService] Error reading breath logs:', error);
      return [];
    }
  }

  /** Save user profile settings */
  static async saveUserSettings(settings: UserProfileSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('[StorageService] Error saving settings:', error);
    }
  }

  /** Load user profile settings */
  static async getUserSettings(): Promise<UserProfileSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return data ? (JSON.parse(data) as UserProfileSettings) : DEFAULT_USER_SETTINGS;
    } catch (error) {
      console.error('[StorageService] Error reading settings:', error);
      return DEFAULT_USER_SETTINGS;
    }
  }

  /** Save user streak data */
  static async saveUserStreak(streak: UserStreak): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_STREAK, JSON.stringify(streak));
    } catch (error) {
      console.error('[StorageService] Error saving streak:', error);
    }
  }

  /** Load user streak data */
  static async getUserStreak(): Promise<UserStreak> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_STREAK);
      return data ? (JSON.parse(data) as UserStreak) : DEFAULT_USER_STREAK;
    } catch (error) {
      console.error('[StorageService] Error reading streak:', error);
      return DEFAULT_USER_STREAK;
    }
  }

  /** Clear all local data (Reset) */
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('[StorageService] Error clearing storage:', error);
    }
  }
}
