import { param, query, validationResult } from 'express-validator';
import { InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

export const validateNotificationId = [
  param('id')
    .notEmpty()
    .withMessage('Notification ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid notification ID format');
      }
      return true;
    })
];

export const validateGetNotifications = [
  query('read')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Read filter must be true or false'),

  query('type')
    .optional()
    .isIn([
      'payroll_processed',
      'leave_approved',
      'leave_rejected',
      'timesheet_approved',
      'timesheet_rejected',
      'pay_stub_available',
      'task_assigned',
      'task_completed',
      'performance_update',
      'system_alert',
      'approval_required',
      'deadline_reminder'
    ])
    .withMessage('Invalid notification type'),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.param || err.path || err.location,
      message: err.msg,
    }));
    return next(new InvalidInputError('Validation failed', errorMessages));
  }
  next();
};

