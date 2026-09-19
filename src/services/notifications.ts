import { Platform } from 'react-native';

const ONESIGNAL_APP_ID = 'pause-sip-onesignal-app-id-demo';

let OneSignal: any = null;
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    const mod = require('react-native-onesignal');
    OneSignal = mod.OneSignal || mod.default || mod;
  } catch {
    console.warn('[NotificationService] Native OneSignal module unavailable');
  }
}

export class NotificationService {
  private static isInitialized: boolean = false;

  /** Initialize OneSignal Push Notification SDK */
  static async initOneSignal(): Promise<void> {
    if (NotificationService.isInitialized) return;

    try {
      if ((Platform.OS === 'ios' || Platform.OS === 'android') && OneSignal) {
        if (OneSignal.Debug) {
          OneSignal.Debug.setLogLevel(6);
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
  static async scheduleDeskReminder(intervalMinutes: number = 45): Promise<boolean> {
    try {
      if ((Platform.OS === 'ios' || Platform.OS === 'android') && OneSignal) {
        const permission = await OneSignal.Notifications.hasPermission();
        if (!permission) {
          await OneSignal.Notifications.requestPermission(true);
        }
        OneSignal.User.addTag('desk_reminder_interval', intervalMinutes.toString());
        return true;
      } else {
        console.log(`[NotificationService Dev Adapter] Scheduled desk reminder every ${intervalMinutes} minutes: "Time for a micro-break: Take 3 deep breaths and a sip of water".`);
        return true;
      }
    } catch (error) {
      console.warn('[NotificationService] Error scheduling desk reminder:', error);
      return false;
    }
  }

  /** Opt out or disable desk break reminders */
  static async disableDeskReminders(): Promise<void> {
    try {
      if ((Platform.OS === 'ios' || Platform.OS === 'android') && OneSignal) {
        OneSignal.User.removeTag('desk_reminder_interval');
      }
    } catch (error) {
      console.warn('[NotificationService] Error disabling reminders:', error);
    }
  }
}
