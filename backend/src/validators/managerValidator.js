import { param, query, body, validationResult } from 'express-validator';
import { InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

export const validateTeamMemberId = [
  param('id')
    .notEmpty()
    .withMessage('Team member ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid team member ID format');
      }
      return true;
    })
];

export const validatePerformanceUpdateId = [
  param('id')
    .notEmpty()
    .withMessage('Performance update ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid performance update ID format');
      }
      return true;
    })
];

export const validateCreatePerformanceUpdate = [
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid employee ID format');
      }
      return true;
    }),

  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),

  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('summary')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Summary is required and must be between 1 and 2000 characters'),

  body('achievements')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Achievements must be less than 2000 characters'),

  body('issues')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Issues must be less than 2000 characters'),

  body('blockers')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Blockers must be less than 2000 characters'),

  body('nextDayFocus')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Next day focus must be less than 2000 characters')
];

export const validateUpdatePerformanceUpdate = [
  param('id')
    .notEmpty()
    .withMessage('Performance update ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid performance update ID format');
      }
      return true;
    }),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('summary')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Summary must be between 1 and 2000 characters'),

  body('achievements')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Achievements must be less than 2000 characters'),

  body('issues')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Issues must be less than 2000 characters'),

  body('blockers')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Blockers must be less than 2000 characters'),

  body('nextDayFocus')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Next day focus must be less than 2000 characters')
];

export const validatePerformanceUpdateFilters = [
  query('employeeId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid employee ID format');
      }
      return true;
    }),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),

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

