import { apiClient } from './client';

export interface Notification {
  _id: string;
  id?: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  read: boolean;
  readAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  emailSent: boolean;
  emailSentAt?: string;
  pushSent: boolean;
  pushSentAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const notificationsApi = {
  async getNotifications(params?: {
    read?: boolean | string;
    type?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Notification>> {
    const query = new URLSearchParams();
    if (params?.read !== undefined) query.append('read', params.read.toString());
    if (params?.type) query.append('type', params.type);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    return apiClient.get<PaginatedResponse<Notification>>(`/notifications${queryString ? `?${queryString}` : ''}`);
  },

  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    return apiClient.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
  },

  async markAsRead(id: string): Promise<ApiResponse<{ notification: Notification }>> {
    return apiClient.put<ApiResponse<{ notification: Notification }>>(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<ApiResponse<{ updatedCount: number }>> {
    return apiClient.put<ApiResponse<{ updatedCount: number }>>('/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<ApiResponse<null>>(`/notifications/${id}`);
  },
};

