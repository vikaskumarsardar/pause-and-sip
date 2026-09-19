import { NOTIFICATION_CONSTANTS } from '@/types';

export class NotificationService {
  private static isInitialized: boolean = false;

  static getIsInitialized(): boolean {
    return NotificationService.isInitialized;
  }

  /** Web mock adapter for OneSignal push notification initialization */
  static async initOneSignal(): Promise<void> {
    console.log('[NotificationService Web] Web notification adapter initialized.');
    NotificationService.isInitialized = true;
  }

  /** Web mock adapter for scheduling desk break reminders */
  static async scheduleDeskReminder(
    intervalMinutes: number = NOTIFICATION_CONSTANTS.DEFAULT_INTERVAL_MINUTES
  ): Promise<boolean> {
    console.log(
      `[NotificationService Web] Scheduled desk reminder every ${intervalMinutes} minutes: "Time for a micro-break: Take 3 deep breaths and a sip of water".`
    );
    return true;
  }

  /** Web mock adapter for disabling desk break reminders */
  static async disableDeskReminders(): Promise<void> {
    console.log('[NotificationService Web] Desk reminders disabled.');
  }
}
