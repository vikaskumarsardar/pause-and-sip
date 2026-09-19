import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BreathPattern,
  CustomSoundItem,
  STORAGE_KEYS,
  WaterLog,
  HYDRATION_CONSTANTS,
  NOTIFICATION_CONSTANTS,
} from '@/types';
import { UserProfileSettings, UserStreak } from '@/types/user';

export class StorageService {
  /** Load custom user-created breathing patterns */
  static async getCustomPatterns(): Promise<BreathPattern[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_BREATH_PATTERNS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[StorageService] Error loading custom patterns:', error);
      return [];
    }
  }

  /** Save a new or edited custom breathing pattern */
  static async saveCustomPattern(
    pattern: Omit<BreathPattern, 'id'> & { id?: string }
  ): Promise<BreathPattern[]> {
    try {
      const existing = await StorageService.getCustomPatterns();
      const newId = pattern.id || `custom_${Date.now()}`;
      const newPattern: BreathPattern = {
        ...pattern,
        id: newId,
        isCustom: true,
        phases: [],
      };

      const existingIndex = existing.findIndex((p) => p.id === newId);
      let updated: BreathPattern[];

      if (existingIndex >= 0) {
        updated = [...existing];
        updated[existingIndex] = newPattern;
      } else {
        updated = [newPattern, ...existing];
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.CUSTOM_BREATH_PATTERNS,
        JSON.stringify(updated)
      );

      return updated;
    } catch (error) {
      console.warn('[StorageService] Error saving custom pattern:', error);
      return [];
    }
  }

  /** Load custom user audio sound FX */
  static async getCustomSounds(): Promise<CustomSoundItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_SOUNDS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[StorageService] Error loading custom sounds:', error);
      return [];
    }
  }

  /** Save a custom user audio sound FX */
  static async saveCustomSound(
    sound: Omit<CustomSoundItem, 'id' | 'isCustom'> & { id?: string }
  ): Promise<CustomSoundItem[]> {
    try {
      const existing = await StorageService.getCustomSounds();
      const newId = sound.id || `sound_${Date.now()}`;
      const newSound: CustomSoundItem = {
        ...sound,
        id: newId,
        isCustom: true,
      };

      const updated = [newSound, ...existing.filter((s) => s.id !== newId)];
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_SOUNDS, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.warn('[StorageService] Error saving custom sound:', error);
      return [];
    }
  }

  /** Delete a custom user audio sound FX */
  static async deleteCustomSound(soundId: string): Promise<CustomSoundItem[]> {
    try {
      const existing = await StorageService.getCustomSounds();
      const updated = existing.filter((s) => s.id !== soundId);
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_SOUNDS, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.warn('[StorageService] Error deleting custom sound:', error);
      return [];
    }
  }

  /** Delete a custom breathing pattern by ID */
  static async deleteCustomPattern(patternId: string): Promise<BreathPattern[]> {
    try {
      const existing = await StorageService.getCustomPatterns();
      const updated = existing.filter((p) => p.id !== patternId);

      await AsyncStorage.setItem(
        STORAGE_KEYS.CUSTOM_BREATH_PATTERNS,
        JSON.stringify(updated)
      );

      return updated;
    } catch (error) {
      console.warn('[StorageService] Error deleting custom pattern:', error);
      return [];
    }
  }

  /** Load desk user settings */
  static async getUserSettings(): Promise<UserProfileSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DESK_SETTINGS);
      if (data) return JSON.parse(data);
    } catch (error) {
      console.warn('[StorageService] Error loading user settings:', error);
    }
    return {
      dailyWaterTargetMl: HYDRATION_CONSTANTS.DEFAULT_DAILY_TARGET_ML,
      unitSystem: 'ml',
      deskReminders: {
        enabled: true,
        intervalMinutes: NOTIFICATION_CONSTANTS.DEFAULT_INTERVAL_MINUTES,
        startHour: 9,
        endHour: 18,
        hapticFeedback: true,
        soundEnabled: true,
      },
      breathingDefaultPattern: 'box',
      hasSeenOnboarding: true,
    };
  }

  /** Load user streak */
  static async getUserStreak(): Promise<UserStreak> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_STREAK);
      if (data) return JSON.parse(data);
    } catch (error) {
      console.warn('[StorageService] Error loading user streak:', error);
    }
    return {
      currentStreakDays: 1,
      bestStreakDays: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
    };
  }

  /** Load water logs */
  static async getWaterLogs(): Promise<WaterLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WATER_LOGS);
      if (data) {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.warn('[StorageService] Error loading water logs:', error);
    }
    return [];
  }

  /** Save water logs */
  static async saveWaterLogs(logs: WaterLog[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.warn('[StorageService] Error saving water logs:', error);
    }
  }
}
