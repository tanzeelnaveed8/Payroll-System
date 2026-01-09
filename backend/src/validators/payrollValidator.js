import { body, param, query, validationResult } from 'express-validator';
import PayrollPeriod from '../models/PayrollPeriod.js';
import { InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

export const validateCreatePeriod = [
  body('periodStart')
    .notEmpty()
    .withMessage('Period start date is required')
    .isISO8601()
    .withMessage('Invalid period start date format'),
  body('periodEnd')
    .notEmpty()
    .withMessage('Period end date is required')
    .isISO8601()
    .withMessage('Invalid period end date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.periodStart)) {
        throw new Error('Period end date must be after period start date');
      }
      return true;
    }),
  body('payDate')
    .notEmpty()
    .withMessage('Pay date is required')
    .isISO8601()
    .withMessage('Invalid pay date format'),
  body('departmentId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid department ID format');
      }
      return true;
    }),
];

export const validateUpdatePeriod = [
  param('id')
    .notEmpty()
    .withMessage('Period ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid period ID format');
      }
      return true;
    }),
  body('periodStart')
    .optional()
    .isISO8601()
    .withMessage('Invalid period start date format'),
  body('periodEnd')
    .optional()
    .isISO8601()
    .withMessage('Invalid period end date format'),
  body('payDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid pay date format'),
  body('status')
    .optional()
    .isIn(['draft', 'processing', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
];

export const validateProcessPayroll = [
  param('id')
    .notEmpty()
    .withMessage('Period ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid period ID format');
      }
      return true;
    }),
];

export const validateApprovePayroll = [
  param('id')
    .notEmpty()
    .withMessage('Period ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid period ID format');
      }
      return true;
    }),
];

export const validatePeriodId = [
  param('id')
    .notEmpty()
    .withMessage('Period ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid period ID format');
      }
      return true;
    }),
];

export const validatePaystubId = [
  param('id')
    .notEmpty()
    .withMessage('Paystub ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid paystub ID format');
      }
      return true;
    }),
];

export const validateEmployeeId = [
  param('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid employee ID format');
      }
      return true;
    }),
];

export const validateCalculatePayroll = [
  body('periodId')
    .notEmpty()
    .withMessage('Period ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid period ID format');
      }
      return true;
    }),
];

export const validatePayrollQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['draft', 'processing', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  query('departmentId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid department ID format');
      }
      return true;
    }),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new InvalidInputError('Validation failed', errors.array().map(e => e.msg)));
  }
  next();
};

