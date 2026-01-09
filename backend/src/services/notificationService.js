import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { ResourceNotFoundError, InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

export const createNotification = async (notificationData) => {
  const {
    userId,
    type,
    title,
    message,
    relatedEntityType,
    relatedEntityId,
    priority = 'medium',
    actionUrl,
    actionLabel,
    expiresAt
  } = notificationData;

  if (!userId || !type || !title || !message) {
    throw new InvalidInputError('User ID, type, title, and message are required');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ResourceNotFoundError('User');
  }

  const notification = new Notification({
    userId,
    type,
    title,
    message,
    relatedEntityType,
    relatedEntityId: relatedEntityId ? new mongoose.Types.ObjectId(relatedEntityId) : undefined,
    priority,
    actionUrl,
    actionLabel,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    read: false
  });

  await notification.save();

  // Send email and push notifications (mock for now)
  await sendEmailNotification(notification);
  await sendPushNotification(notification);

  return notification.toObject();
};

export const sendEmailNotification = async (notification) => {
  // Mock email sending - in production, integrate with email service (SendGrid, AWS SES, etc.)
  try {
    const user = await User.findById(notification.userId).select('email name');
    if (!user || !user.email) {
      return;
    }

    // Mock: Log email notification
    console.log(`[Email Notification] To: ${user.email}, Subject: ${notification.title}, Message: ${notification.message}`);

    // Update notification
    notification.emailSent = true;
    notification.emailSentAt = new Date();
    await notification.save();
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

export const sendPushNotification = async (notification) => {
  // Mock push notification - in production, integrate with FCM, APNS, etc.
  try {
    const user = await User.findById(notification.userId).select('name');
    if (!user) {
      return;
    }

    // Mock: Log push notification
    console.log(`[Push Notification] To: ${user.name}, Title: ${notification.title}, Message: ${notification.message}`);

    // Update notification
    notification.pushSent = true;
    notification.pushSentAt = new Date();
    await notification.save();
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

export const getNotifications = async (userId, filters = {}) => {
  const {
    read,
    type,
    priority,
    page = 1,
    limit = 20
  } = filters;

  const query = { userId: new mongoose.Types.ObjectId(userId) };

  if (read !== undefined) {
    query.read = read === 'true' || read === true;
  }

  if (type) {
    query.type = type;
  }

  if (priority) {
    query.priority = priority;
  }

  // Exclude expired notifications
  query.$or = [
    { expiresAt: { $exists: false } },
    { expiresAt: null },
    { expiresAt: { $gt: new Date() } }
  ];

  const skip = (page - 1) * limit;

  const { optimizedFind, optimizedCount } = await import('../utils/queryOptimizer.js');
  
  const [notifications, total] = await Promise.all([
    optimizedFind(Notification, query, {
      sort: { createdAt: -1 },
      skip,
      limit,
      lean: true
    }),
    optimizedCount(Notification, query)
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    userId: new mongoose.Types.ObjectId(userId)
  });

  if (!notification) {
    throw new ResourceNotFoundError('Notification');
  }

  if (!notification.read) {
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification.toObject();
};

export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    {
      userId: new mongoose.Types.ObjectId(userId),
      read: false
    },
    {
      $set: {
        read: true,
        readAt: new Date()
      }
    }
  );

  return { updatedCount: result.modifiedCount };
};

export const deleteNotification = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    userId: new mongoose.Types.ObjectId(userId)
  });

  if (!notification) {
    throw new ResourceNotFoundError('Notification');
  }

  await Notification.deleteOne({ _id: notificationId });

  return { message: 'Notification deleted successfully' };
};

export const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    read: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });

  return { unreadCount: count };
};

export const deleteExpiredNotifications = async () => {
  const result = await Notification.deleteMany({
    expiresAt: { $lt: new Date() }
  });

  return { deletedCount: result.deletedCount };
};

