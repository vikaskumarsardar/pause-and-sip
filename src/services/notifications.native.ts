import { NOTIFICATION_CONSTANTS } from '@/types';
import { OneSignal } from 'react-native-onesignal';

export class NotificationService {
  private static isInitialized: boolean = false;

  /** Initialize native OneSignal Push Notification SDK */
  static async initOneSignal(): Promise<void> {
    if (NotificationService.isInitialized) return;

    try {
      if (OneSignal.Debug) {
        OneSignal.Debug.setLogLevel(NOTIFICATION_CONSTANTS.DEBUG_LOG_LEVEL_VERBOSE);
      }
      OneSignal.initialize(NOTIFICATION_CONSTANTS.ONESIGNAL_APP_ID);

      // Prompt for Push Notification Permission
      await OneSignal.Notifications.requestPermission(true);
      NotificationService.isInitialized = true;
    } catch (error) {
      console.warn('[NotificationService Native] OneSignal setup skipped:', error);
    }
  }

  /** Schedule recurring gentle desk break reminders via native OneSignal */
  static async scheduleDeskReminder(
    intervalMinutes: number = NOTIFICATION_CONSTANTS.DEFAULT_INTERVAL_MINUTES
  ): Promise<boolean> {
    try {
      const hasPermission = await OneSignal.Notifications.hasPermission();
      if (!hasPermission) {
        await OneSignal.Notifications.requestPermission(true);
      }
      const intervalString = intervalMinutes.toString();
      OneSignal.User.addTag(NOTIFICATION_CONSTANTS.REMINDER_TAG_KEY, intervalString);
      return true;
    } catch (error) {
      console.warn('[NotificationService Native] Error scheduling desk reminder:', error);
      return false;
    }
  }

  /** Opt out or disable desk break reminders via native OneSignal */
  static async disableDeskReminders(): Promise<void> {
    try {
      OneSignal.User.removeTag(NOTIFICATION_CONSTANTS.REMINDER_TAG_KEY);
    } catch (error) {
      console.warn('[NotificationService Native] Error disabling reminders:', error);
    }
  }
}
