import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PLATFORM_OS } from '@/types';

const isHapticsSupported = Platform.OS === PLATFORM_OS.IOS || Platform.OS === PLATFORM_OS.ANDROID;

export class HapticService {
  /** Light impact for subtle button presses & toggles */
  static async lightTouch(): Promise<void> {
    if (!isHapticsSupported) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Graceful fallback for devices without haptic motor
    }
  }

  /** Medium impact for logging water or switching modes */
  static async mediumTouch(): Promise<void> {
    if (!isHapticsSupported) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Graceful fallback
    }
  }

  /** Heavy impact for milestone completions */
  static async heavyTouch(): Promise<void> {
    if (!isHapticsSupported) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Graceful fallback
    }
  }

  /** Selection tick for sliders or scroll selectors */
  static async selection(): Promise<void> {
    if (!isHapticsSupported) return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // Graceful fallback
    }
  }

  /** Success notification haptic */
  static async success(): Promise<void> {
    if (!isHapticsSupported) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Graceful fallback
    }
  }

  /** Warning notification haptic */
  static async warning(): Promise<void> {
    if (!isHapticsSupported) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Graceful fallback
    }
  }

  /** Breathing Inhale guide haptic */
  static async breathInhalePulse(): Promise<void> {
    if (!isHapticsSupported) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Graceful fallback
    }
  }

  /** Breathing Exhale guide haptic */
  static async breathExhalePulse(): Promise<void> {
    if (!isHapticsSupported) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    } catch {
      // Graceful fallback
    }
  }
}
