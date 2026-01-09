import { param, query, body, validationResult } from 'express-validator';
import { InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

export const validatePaystubId = [
  param('id')
    .notEmpty()
    .withMessage('Paystub ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid paystub ID format');
      }
      return true;
    })
];

export const validateSubmitTimesheet = [
  body('timesheetIds')
    .notEmpty()
    .withMessage('Timesheet IDs are required')
    .isArray({ min: 1 })
    .withMessage('At least one timesheet ID is required')
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error('Timesheet IDs must be a non-empty array');
      }
      value.forEach((id) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('Invalid timesheet ID format');
        }
      });
      return true;
    })
];

export const validateCreateLeaveRequest = [
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('leaveType')
    .notEmpty()
    .withMessage('Leave type is required')
    .isIn(['paid', 'unpaid', 'sick', 'annual', 'casual', 'maternity', 'paternity'])
    .withMessage('Invalid leave type'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Reason must be less than 1000 characters')
];

export const validateGetPaystubs = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const validateGetLeaveRequests = [
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

