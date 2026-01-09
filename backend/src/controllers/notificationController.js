import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from '../services/notificationService.js';
import { sendSuccess, sendPaginated } from '../utils/responseHandler.js';
import { createPagination } from '../utils/responseHandler.js';
import { logUserAction } from '../utils/auditLogger.js';

export const getNotificationsList = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { read, type, priority, page = 1, limit = 20 } = req.query;
    
    const pagination = createPagination(page, limit);
    const result = await getNotifications(userId, {
      read,
      type,
      priority,
      page: pagination.page,
      limit: pagination.limit
    });

    return sendPaginated(res, 'Notifications retrieved successfully', result.notifications, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    
    const notification = await markAsRead(userId, id);
    
    logUserAction(req, 'update', 'Notification', id, {
      action: 'mark_as_read'
    });

    return sendSuccess(res, 200, 'Notification marked as read', { notification });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const result = await markAllAsRead(userId);
    
    logUserAction(req, 'update', 'Notification', null, {
      action: 'mark_all_as_read',
      count: result.updatedCount
    });

    return sendSuccess(res, 200, 'All notifications marked as read', result);
  } catch (error) {
    next(error);
  }
};

export const deleteNotificationById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    
    const result = await deleteNotification(userId, id);
    
    logUserAction(req, 'delete', 'Notification', id, {
      action: 'delete_notification'
    });

    return sendSuccess(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

export const getUnreadCountEndpoint = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const result = await getUnreadCount(userId);
    return sendSuccess(res, 200, 'Unread count retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

