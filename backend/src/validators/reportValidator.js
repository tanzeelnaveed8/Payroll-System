import { body, query, param, validationResult } from 'express-validator';
import { InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

export const validateGetReports = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['payroll', 'attendance', 'leave', 'department', 'employee', 'financial']).withMessage('Invalid report type'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format'),
  query('departmentId').optional().custom((value) => {
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid departmentId format');
    }
    return true;
  }),
  query('createdBy').optional().custom((value) => {
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid createdBy format');
    }
    return true;
  }),
];

export const validateGenerateReport = [
  body('type')
    .notEmpty()
    .withMessage('Report type is required')
    .isIn(['payroll', 'attendance', 'leave', 'department', 'employee', 'financial'])
    .withMessage('Invalid report type'),
  body('dateFrom')
    .notEmpty()
    .withMessage('Date from is required')
    .isISO8601()
    .withMessage('Invalid dateFrom format'),
  body('dateTo')
    .notEmpty()
    .withMessage('Date to is required')
    .isISO8601()
    .withMessage('Invalid dateTo format')
    .custom((value, { req }) => {
      if (req.body.dateFrom && new Date(value) < new Date(req.body.dateFrom)) {
        throw new Error('Date to must be after date from');
      }
      return true;
    }),
  body('departmentId').optional().custom((value) => {
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid departmentId format');
    }
    return true;
  }),
  body('employeeId').optional().custom((value, { req }) => {
    if (req.body.type === 'employee' && !value) {
      throw new Error('Employee ID is required for employee reports');
    }
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid employeeId format');
    }
    return true;
  }),
  body('expiresInDays').optional().isInt({ min: 1, max: 365 }).withMessage('Expires in days must be between 1 and 365'),
];

export const validateReportId = [
  param('id')
    .notEmpty()
    .withMessage('Report ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid report ID format');
      }
      return true;
    }),
];

export const validateDateRange = [
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format'),
  query('departmentId').optional().custom((value) => {
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid departmentId format');
    }
    return true;
  }),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.param || err.path,
      message: err.msg,
    }));
    return next(new InvalidInputError('Validation failed', errorMessages));
  }
  next();
};

