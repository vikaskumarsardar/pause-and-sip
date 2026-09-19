import { Platform } from 'react-native';
import { NOTIFICATION_CONSTANTS } from '@/types';

const ONESIGNAL_APP_ID = 'pause-sip-onesignal-app-id-demo';
const REMINDER_TAG_KEY = 'desk_reminder_interval';

const PLATFORM_OS = {
  IOS: 'ios',
  ANDROID: 'android',
} as const;

let OneSignal: any = null;
const isSupportedNativePlatform = Platform.OS === PLATFORM_OS.IOS || Platform.OS === PLATFORM_OS.ANDROID;

if (isSupportedNativePlatform) {
  try {
    const nativeModule = require('react-native-onesignal');
    OneSignal = nativeModule.OneSignal || nativeModule.default || nativeModule;
  } catch {
    console.warn('[NotificationService] Native OneSignal module unavailable');
  }
}

export class NotificationService {
  private static isInitialized: boolean = false;

  /** Initialize OneSignal Push Notification SDK */
  static async initOneSignal(): Promise<void> {
    if (NotificationService.isInitialized) return;

    const canInitializeOneSignal = isSupportedNativePlatform && OneSignal !== null;

    try {
      if (canInitializeOneSignal) {
        if (OneSignal.Debug) {
          OneSignal.Debug.setLogLevel(NOTIFICATION_CONSTANTS.DEBUG_LOG_LEVEL_VERBOSE);
        }
        OneSignal.initialize(ONESIGNAL_APP_ID);

        // Prompt for Push Notification Permission
        await OneSignal.Notifications.requestPermission(true);
        NotificationService.isInitialized = true;
      } else {
        console.warn('[NotificationService] Web/Unsupported platform. Using dev notification adapter.');
      }
    } catch (error) {
      console.warn('[NotificationService] OneSignal setup skipped:', error);
    }
  }

  /** Schedule recurring gentle desk breaking reminders */
  static async scheduleDeskReminder(
    intervalMinutes: number = NOTIFICATION_CONSTANTS.DEFAULT_INTERVAL_MINUTES
  ): Promise<boolean> {
    const canScheduleNativeNotification = isSupportedNativePlatform && OneSignal !== null;

    try {
      if (canScheduleNativeNotification) {
        const hasPermission = await OneSignal.Notifications.hasPermission();
        if (!hasPermission) {
          await OneSignal.Notifications.requestPermission(true);
        }
        const intervalString = intervalMinutes.toString();
        OneSignal.User.addTag(REMINDER_TAG_KEY, intervalString);
        return true;
      } else {
        console.log(
          `[NotificationService Dev Adapter] Scheduled desk reminder every ${intervalMinutes} minutes: "Time for a micro-break: Take 3 deep breaths and a sip of water".`
        );
        return true;
      }
    } catch (error) {
      console.warn('[NotificationService] Error scheduling desk reminder:', error);
      return false;
    }
  }

  /** Opt out or disable desk break reminders */
  static async disableDeskReminders(): Promise<void> {
    const canDisableNativeNotification = isSupportedNativePlatform && OneSignal !== null;

    try {
      if (canDisableNativeNotification) {
        OneSignal.User.removeTag(REMINDER_TAG_KEY);
      }
    } catch (error) {
      console.warn('[NotificationService] Error disabling reminders:', error);
    }
  }
}
