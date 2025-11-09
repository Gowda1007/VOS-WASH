import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type {
  NotificationAdapter,
  NotificationOptions,
  ScheduledNotificationOptions,
  NotificationResult,
} from '../core/adapters/notificationAdapter';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NativeNotificationAdapter implements NotificationAdapter {
  async requestPermissions(): Promise<boolean> {
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

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }
}
