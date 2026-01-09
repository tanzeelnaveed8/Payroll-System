import express from 'express';
import {
  getNotificationsList,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationById,
  getUnreadCountEndpoint
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import {
  validateNotificationId,
  validateGetNotifications,
  handleValidationErrors
} from '../validators/notificationValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', validateGetNotifications, handleValidationErrors, getNotificationsList);
router.get('/unread-count', getUnreadCountEndpoint);
router.put('/:id/read', validateNotificationId, handleValidationErrors, markNotificationAsRead);
router.put('/read-all', markAllNotificationsAsRead);
router.delete('/:id', validateNotificationId, handleValidationErrors, deleteNotificationById);

export default router;

