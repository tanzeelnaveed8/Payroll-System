import { body, query, param, validationResult } from 'express-validator';
import { InvalidInputError } from '../utils/errorHandler.js';

/**
 * Validation for creating a leave request
 */
export const validateCreateLeaveRequest = [
  body('leaveType')
    .notEmpty()
    .withMessage('Leave type is required')
    .isIn(['paid', 'unpaid', 'sick', 'annual', 'casual', 'maternity', 'paternity'])
    .withMessage('Invalid leave type'),
  
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.startDate);
      if (endDate < startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 1000 })
    .withMessage('Reason must not exceed 1000 characters'),
];

/**
 * Validation for updating a leave request
 */
export const validateUpdateLeaveRequest = [
  param('id')
    .notEmpty()
    .withMessage('Leave request ID is required')
    .isMongoId()
    .withMessage('Invalid leave request ID'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.startDate) {
        const endDate = new Date(value);
        const startDate = new Date(req.body.startDate);
        if (endDate < startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
  
  body('leaveType')
    .optional()
    .isIn(['paid', 'unpaid', 'sick', 'annual', 'casual', 'maternity', 'paternity'])
    .withMessage('Invalid leave type'),
  
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 1000 })
    .withMessage('Reason must not exceed 1000 characters'),
];

/**
 * Validation for approving/rejecting leave request
 */
export const validateApproveRejectLeaveRequest = [
  param('id')
    .notEmpty()
    .withMessage('Leave request ID is required')
    .isMongoId()
    .withMessage('Invalid leave request ID'),
  
  body('comments')
    .optional()
    .isString()
    .withMessage('Comments must be a string')
    .isLength({ max: 500 })
    .withMessage('Comments must not exceed 500 characters'),
];

/**
 * Validation for rejecting leave request (requires reason)
 */
export const validateRejectLeaveRequest = [
  param('id')
    .notEmpty()
    .withMessage('Leave request ID is required')
    .isMongoId()
    .withMessage('Invalid leave request ID'),
  
  body('comments')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isString()
    .withMessage('Comments must be a string')
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason must be between 5 and 500 characters'),
];

/**
 * Validation for bulk approve/reject
 */
export const validateBulkApproveReject = [
  body('requestIds')
    .notEmpty()
    .withMessage('Request IDs are required')
    .isArray()
    .withMessage('Request IDs must be an array')
    .custom((value) => {
      if (value.length === 0) {
        throw new Error('At least one request ID is required');
      }
      if (value.length > 100) {
        throw new Error('Cannot process more than 100 requests at once');
      }
      return true;
    })
    .custom(async (value) => {
      const mongoose = (await import('mongoose')).default;
      for (const id of value) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid request ID: ${id}`);
        }
      }
      return true;
    }),
  
  body('comments')
    .optional()
    .isString()
    .withMessage('Comments must be a string')
    .isLength({ max: 500 })
    .withMessage('Comments must not exceed 500 characters'),
];

/**
 * Validation for bulk reject (requires reason)
 */
export const validateBulkReject = [
  body('requestIds')
    .notEmpty()
    .withMessage('Request IDs are required')
    .isArray()
    .withMessage('Request IDs must be an array')
    .custom((value) => {
      if (value.length === 0) {
        throw new Error('At least one request ID is required');
      }
      return true;
    }),
  
  body('comments')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isString()
    .withMessage('Comments must be a string')
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason must be between 5 and 500 characters'),
];

/**
 * Validation for query parameters
 */
export const validateLeaveQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Invalid status'),
  
  query('leaveType')
    .optional()
    .isIn(['paid', 'unpaid', 'sick', 'annual', 'casual', 'maternity', 'paternity'])
    .withMessage('Invalid leave type'),
];

/**
 * Validation for employee ID parameter
 */
export const validateEmployeeId = [
  param('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isMongoId()
    .withMessage('Invalid employee ID'),
];

/**
 * Validation for year parameter
 */
export const validateYear = [
  param('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
];

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    }));
    const fieldMessages = errorMessages.map(e => {
      const fieldName = e.param ? e.param.charAt(0).toUpperCase() + e.param.slice(1) : 'Field';
      return `${fieldName}: ${e.msg}`;
    }).join('. ');
    return next(new InvalidInputError(`Please correct the following: ${fieldMessages}`, errorMessages));
  }
  next();
};

