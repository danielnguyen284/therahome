import * as Notifications from "expo-notifications";
import { api } from "./api";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import AsyncStorage from '@react-native-async-storage/async-storage';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

interface NotificationTemplate {
  key: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  is_active: boolean;
}

export async function registerForPushNotifications() {
  if (isExpoGo) {
    console.log(
      "Push notifications not available in Expo Go. Use a development build.",
    );
    return null;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission denied");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    await api.post("/notification-token", {
      token,
      platform: Platform.OS,
    });

    return token;
  } catch (error) {
    console.error("Register push notifications error:", error);
    return null;
  }
}

export async function rescheduleSmartNotifications(user: any, _isUnlocked: boolean) {
  try {
    if (user?.notifications_enabled === false) {
      await AsyncStorage.setItem('notificationsEnabled', 'false');
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    const enabled = await AsyncStorage.getItem('notificationsEnabled');
    if (enabled === 'false') {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    await registerForPushNotifications();
    console.log('Notifications are now server-driven and dispatched from backend.');
  } catch (error) {
    console.error("Notification sync error:", error);
  }
}

export async function triggerTestNotification() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Thông Báo 🚀",
        body: "Hoạt động hiển thị thông báo đã thành công!",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
        repeats: false,
      },
    });
    console.log("Test notification scheduled immediately.");
  } catch (e) {
    console.error(e);
  }
}

export async function triggerLocalTemplatePreviewNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('Ứng dụng chưa được cấp quyền thông báo');
  }

  const templates = await api.get<NotificationTemplate[]>('/notification-templates');
  const activeTemplates = (templates || []).filter((template) => template.is_active);

  if (activeTemplates.length === 0) {
    throw new Error('Hiện chưa có message active nào để demo');
  }

  for (const [index, template] of activeTemplates.entries()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: template.title,
        body: template.body,
        sound: true,
        data: {
          notification_key: template.key,
          preview_mode: 'local',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2 + index * 3,
        repeats: false,
      },
    });
  }

  return {
    count: activeTemplates.length,
    keys: activeTemplates.map((template) => template.key),
  };
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleDailyReminder(_hour = 8, _minute = 0) {
  // Deprecated: backend now decides when to send notifications.
}

export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
