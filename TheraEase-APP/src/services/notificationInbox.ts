import { api } from './api';
import type { NotificationInboxItem } from '@/types';

interface NotificationInboxResponse {
  unread_count: number;
  items: NotificationInboxItem[];
}

export async function getNotificationInbox(limit = 30) {
  return api.get<NotificationInboxResponse>(`/notifications?limit=${limit}`);
}

export async function markNotificationAsRead(id: string) {
  return api.put<NotificationInboxItem>(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead() {
  return api.put<{ success: boolean }>('/notifications/read-all');
}

export async function previewSystemNotifications(keys?: string[]) {
  return api.post<{ sentCount: number; notifications: string[] }>('/notifications/preview', {
    keys,
  });
}
