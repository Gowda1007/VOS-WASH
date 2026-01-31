// Notification Adapter Interface for platform-agnostic notifications
// Web: Browser Notification API
// React Native: expo-notifications or react-native-push-notification

export interface NotificationOptions {
    title: string;
    body: string;
    data?: Record<string, any>;     // Custom data payload
    sound?: boolean;                // Play notification sound
    badge?: number;                 // Badge count (iOS/Android)
    channelId?: string;             // Android notification channel
}

export interface ScheduledNotificationOptions extends NotificationOptions {
    trigger: {
        seconds?: number;           // Fire after X seconds
        date?: Date;                // Fire at specific date/time
        repeats?: boolean;          // Repeat notification
    };
}

export interface NotificationResult {
    success: boolean;
    notificationId?: string;        // ID for cancelling later
    error?: string;
}

export interface NotificationAdapter {
    /**
     * Request notification permissions
     * @returns True if permission granted
     */
    requestPermissions(): Promise<boolean>;

    /**
     * Show immediate notification
     * @param options Notification options
     * @returns Notification result
     */
    showNotification(options: NotificationOptions): Promise<NotificationResult>;

    /**
     * Schedule notification for later
     * @param options Scheduled notification options
     * @returns Notification result with ID
     */
    scheduleNotification(options: ScheduledNotificationOptions): Promise<NotificationResult>;

    /**
     * Schedules daily motivational notifications (morning and evening).
     * @param apiService API service for fetching metrics
     * @param rawMaterialService Raw material service for fetching stock data
     */
    scheduleDailyMotivationalNotifications(apiService: any, rawMaterialService: any): Promise<void>;

    /**
     * Cancel scheduled notification
     * @param notificationId Notification ID to cancel
     */
    cancelNotification(notificationId: string): Promise<void>;

    /**
     * Cancel all scheduled notifications
     */
    cancelAllNotifications(): Promise<void>;

    /**
     * Check if notifications are enabled
     */
    areNotificationsEnabled(): Promise<boolean>;
}
