import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { http } from './http';

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  alertId?: string;
  reportId?: string;
  incidentId?: string;
}

export async function fetchNotifications(): Promise<{ items: AppNotification[]; unread: number }> {
  const response = await http.get('/notifications');
  return { items: response.data.data ?? [], unread: response.data.unread ?? 0 };
}

export async function markAllNotificationsRead() {
  await http.patch('/notifications/read-all');
}

/** Unread count for the bell, refreshed whenever the screen comes into focus. */
export function useUnreadCount() {
  const [unread, setUnread] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchNotifications()
        .then((r) => active && setUnread(r.unread))
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []),
  );
  return unread;
}
