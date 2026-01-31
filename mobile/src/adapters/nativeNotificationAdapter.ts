import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications'; // Direct import instead of lazy loading
import * as Application from 'expo-application';
import type {
  NotificationAdapter,
  NotificationOptions,
  ScheduledNotificationOptions,
  NotificationResult,
} from '../core/adapters/notificationAdapter';
import { getMotivationalNotificationContent } from '../core/utils/motivationalNotificationUtils';
import { getAppMetrics } from '../core/utils/appMetricsFetcher';
import type { ApiService } from '../core/services/apiService';
import type { RawMaterialService } from '../core/services/rawMaterialService';

const isExpoGo = Application.applicationName === 'Expo Go';

// Notifications is now directly imported, no need for async loading wrapper
function ensureNotificationsLoaded() {
  if (isExpoGo) {
    // Silently skip in Expo Go - warnings already suppressed
    return false;
  }
  if (!Notifications) {
    console.error("Expo Notifications module not loaded.");
    return false;
  }
  return true;
}

// Configure notification handler once globally, outside of the class/wrapper
if (!isExpoGo && Notifications?.setNotificationHandler) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export class NativeNotificationAdapter implements NotificationAdapter {
  async requestPermissions(): Promise<boolean> {
    if (isExpoGo) return true; // Skip in Expo Go (not supported)
    await ensureNotificationsLoaded();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return finalStatus === 'granted';
  }

  async showNotification(options: NotificationOptions): Promise<NotificationResult> {
    try {
      if (isExpoGo) {
        // In Expo Go, skip OS notifications but report success (UI uses Toasts too)
        return { success: true } as NotificationResult;
      }
      await ensureNotificationsLoaded();
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: options.data,
          sound: options.sound !== false,
          badge: options.badge,
        },
        trigger: null, // Immediate
      });

      return {
        success: true,
        notificationId: id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Notification failed',
      };
    }
  }

  async scheduleNotification(options: ScheduledNotificationOptions): Promise<NotificationResult> {
    try {
      if (isExpoGo) {
        return { success: true } as NotificationResult;
      }
      await ensureNotificationsLoaded();
      let trigger: any;
      
      if (options.trigger.seconds) {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: options.trigger.seconds,
          repeats: options.trigger.repeats || false,
        };
      } else if (options.trigger.date) {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: options.trigger.date,
          repeats: options.trigger.repeats || false,
        };
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: options.data,
          sound: options.sound !== false,
          badge: options.badge,
        },
        trigger,
      });

      return {
        success: true,
        notificationId: id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Notification scheduling failed',
      };
    }
  }

  async scheduleDailyMotivationalNotifications(apiService: ApiService, rawMaterialService: RawMaterialService): Promise<void> {
    if (isExpoGo) return;
    await ensureNotificationsLoaded();

    // 1. Cancel all existing scheduled notifications to prevent duplicates
    // and ensure new random quotes are scheduled daily.
    await this.cancelAllNotifications();

    // Scheduling times: 7 AM and 7 PM, as requested by the user.
    const MORNING_HOUR = 7; // 7:00 AM
    const EVENING_HOUR = 19; // 7:00 PM

    // Note: Since Expo schedules notifications using fixed time/hour triggers with `repeats: true`,
    // we must ensure the `getMotivationalNotificationContent` function fetches a random quote
    // *every time it runs*. Since this function runs once during scheduling, the quotes will be fixed
    // for 24 hours until the app re-schedules. To get truly random daily quotes, the scheduling
    // should ideally happen via a daily background task, but we proceed with the current structure.
    
        // Fetch real-time metrics for dynamic content injection
        const metrics = await getAppMetrics(apiService, rawMaterialService);
        
        // 2. Schedule Morning Notification (7:00 AM daily)
        const morningContent = getMotivationalNotificationContent('morning', metrics);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: morningContent.title,
            body: morningContent.body,
            sound: true,
          },
          trigger: {
            hour: MORNING_HOUR,
            minute: 0,
            repeats: true, // Schedule daily
          } as Notifications.NotificationTriggerInput,
        });
    
        // 3. Schedule Evening Notification (7:00 PM daily)
        const eveningContent = getMotivationalNotificationContent('evening', metrics);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: eveningContent.title,
            body: eveningContent.body,
            sound: true,
          },
          trigger: {
            hour: EVENING_HOUR,
            minute: 0,
            repeats: true, // Schedule daily
          } as Notifications.NotificationTriggerInput,
        });
      }

  async cancelNotification(notificationId: string): Promise<void> {
    if (isExpoGo) return; await ensureNotificationsLoaded();
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    if (isExpoGo) return; await ensureNotificationsLoaded();
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async areNotificationsEnabled(): Promise<boolean> {
    if (isExpoGo) return false; await ensureNotificationsLoaded();
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }
}
