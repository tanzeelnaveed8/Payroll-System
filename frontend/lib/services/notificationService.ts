import {
  notificationsApi,
  type Notification,
} from '@/lib/api/notifications';

const mapId = (notification: Notification): Notification => {
  if (notification._id && !notification.id) {
    return { ...notification, id: notification._id };
  }
  return notification;
};

export const notificationService = {
  async getNotifications(params?: {
    read?: boolean | string;
    type?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<{ notifications: Notification[]; pagination: any }> {
    const response = await notificationsApi.getNotifications(params);
    if (response.success && response.data) {
      return {
        notifications: response.data.map(mapId),
        pagination: response.pagination,
      };
    }
    return { notifications: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await notificationsApi.getUnreadCount();
      if (response.success && response.data) {
        return response.data.unreadCount;
      }
      return 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await notificationsApi.markAsRead(id);
    if (response.success && response.data?.notification) {
      return mapId(response.data.notification);
    }
    throw new Error(response.message || 'Failed to mark notification as read');
  },

  async markAllAsRead(): Promise<number> {
    const response = await notificationsApi.markAllAsRead();
    if (response.success && response.data) {
      return response.data.updatedCount;
    }
    throw new Error(response.message || 'Failed to mark all notifications as read');
  },

  async deleteNotification(id: string): Promise<void> {
    const response = await notificationsApi.deleteNotification(id);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete notification');
    }
  },
};

export type { Notification };

