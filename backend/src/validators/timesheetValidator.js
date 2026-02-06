import { body, query, param, validationResult } from 'express-validator';
import Timesheet from '../models/Timesheet.js';
import PayrollPeriod from '../models/PayrollPeriod.js';
import { InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

export const validateCreateTimesheet = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (date > today) {
        throw new Error('Cannot create timesheet for future dates');
      }
      return true;
    }),
  body('hours')
    .notEmpty()
    .withMessage('Hours are required')
    .isFloat({ min: 0, max: 24 })
    .withMessage('Hours must be between 0 and 24')
    .custom((value) => {
      if (value < 0 || value > 24) {
        throw new Error('Hours must be between 0 and 24');
      }
      return true;
    }),
  body('clockIn')
    .optional()
    .isString()
    .withMessage('Clock in time must be a valid string')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Clock in time must be in HH:MM format'),
  body('clockOut')
    .optional()
    .isString()
    .withMessage('Clock out time must be a valid string')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Clock out time must be in HH:MM format'),
  body('payrollPeriodId')
    .optional()
    .custom(async (value) => {
      if (value) {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid payroll period ID');
        }
        const period = await PayrollPeriod.findById(value);
        if (!period) {
          throw new Error('Payroll period not found');
        }
      }
      return true;
    }),
  body('comments')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Comments must be less than 500 characters'),
];

export const validateUpdateTimesheet = [
  param('id')
    .notEmpty()
    .withMessage('Timesheet ID is required')
    .custom(async (value, { req }) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid timesheet ID');
      }
      const timesheet = await Timesheet.findById(value);
      if (!timesheet) {
        throw new Error('Timesheet not found');
      }
      // Employee can only update draft timesheets
      if (req.user.role === 'employee' && timesheet.status !== 'draft') {
        throw new Error('You can only update draft timesheets');
      }
      // Employee can only update their own timesheets
      if (req.user.role === 'employee' && timesheet.employeeId.toString() !== req.user._id.toString()) {
        throw new Error('You can only update your own timesheets');
      }
      return true;
    }),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (date > today) {
        throw new Error('Cannot create timesheet for future dates');
      }
      return true;
    }),
  body('hours')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Hours must be between 0 and 24')
    .custom((value) => {
      if (value < 0 || value > 24) {
        throw new Error('Hours must be between 0 and 24');
      }
      return true;
    }),
  body('clockIn')
    .optional()
    .isString()
    .withMessage('Clock in time must be a valid string')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Clock in time must be in HH:MM format'),
  body('clockOut')
    .optional()
    .isString()
    .withMessage('Clock out time must be a valid string')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Clock out time must be in HH:MM format'),
  body('comments')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Comments must be less than 500 characters'),
];

export const validateSubmitTimesheet = [
  param('id')
    .notEmpty()
    .withMessage('Timesheet ID is required')
    .custom(async (value, { req }) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid timesheet ID');
      }
      const timesheet = await Timesheet.findById(value);
      if (!timesheet) {
        throw new Error('Timesheet not found');
      }
      if (timesheet.employeeId.toString() !== req.user._id.toString()) {
        throw new Error('You can only submit your own timesheets');
      }
      if (timesheet.status !== 'draft') {
        throw new Error('Only draft timesheets can be submitted');
      }
      return true;
    }),
];

export const validateApproveTimesheet = [
  param('id')
    .notEmpty()
    .withMessage('Timesheet ID is required')
    .custom(async (value, { req }) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid timesheet ID');
      }
      const timesheet = await Timesheet.findById(value).populate('employeeId');
      if (!timesheet) {
        throw new Error('Timesheet not found');
      }
      if (timesheet.status !== 'submitted') {
        throw new Error('Only submitted timesheets can be approved');
      }
      // Check permissions
      if (req.user.role === 'employee') {
        throw new Error('You do not have permission to approve timesheets');
      }
      if (req.user.role === 'manager') {
        const employee = timesheet.employeeId;
        const isManager = employee.managerId?.toString() === req.user._id.toString() || 
                         employee.reportsTo?.toString() === req.user._id.toString();
        if (!isManager) {
          throw new Error('You can only approve timesheets for your direct reports');
        }
      }
      return true;
    }),
  body('comments')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Comments must be less than 500 characters'),
];

export const validateRejectTimesheet = [
  param('id')
    .notEmpty()
    .withMessage('Timesheet ID is required')
    .custom(async (value, { req }) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid timesheet ID');
      }
      const timesheet = await Timesheet.findById(value).populate('employeeId');
      if (!timesheet) {
        throw new Error('Timesheet not found');
      }
      if (timesheet.status !== 'submitted') {
        throw new Error('Only submitted timesheets can be rejected');
      }
      // Check permissions
      if (req.user.role === 'employee') {
        throw new Error('You do not have permission to reject timesheets');
      }
      if (req.user.role === 'manager') {
        const employee = timesheet.employeeId;
        const isManager = employee.managerId?.toString() === req.user._id.toString() || 
                         employee.reportsTo?.toString() === req.user._id.toString();
        if (!isManager) {
          throw new Error('You can only reject timesheets for your direct reports');
        }
      }
      return true;
    }),
  body('reason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason must be between 5 and 500 characters'),
];

export const validateBulkApprove = [
  body('timesheetIds')
    .notEmpty()
    .withMessage('Timesheet IDs are required')
    .isArray()
    .withMessage('Timesheet IDs must be an array')
    .custom((value) => {
      if (value.length === 0) {
        throw new Error('At least one timesheet ID is required');
      }
      if (value.length > 100) {
        throw new Error('Cannot approve more than 100 timesheets at once');
      }
      value.forEach((id) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid timesheet ID: ${id}`);
        }
      });
      return true;
    }),
  body('comments')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Comments must be less than 500 characters'),
];

export const validateBulkReject = [
  body('timesheetIds')
    .notEmpty()
    .withMessage('Timesheet IDs are required')
    .isArray()
    .withMessage('Timesheet IDs must be an array')
    .custom((value) => {
      if (value.length === 0) {
        throw new Error('At least one timesheet ID is required');
      }
      if (value.length > 100) {
        throw new Error('Cannot reject more than 100 timesheets at once');
      }
      value.forEach((id) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid timesheet ID: ${id}`);
        }
      });
      return true;
    }),
  body('reason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason must be between 5 and 500 characters'),
];

export const validateGetTimesheets = [
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
    .isIn(['draft', 'submitted', 'approved', 'rejected'])
    .withMessage('Status must be one of: draft, submitted, approved, rejected'),
  query('employeeName')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Employee name must be less than 100 characters'),
  query('department')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
  query('role')
    .optional()
    .isIn(['admin', 'manager', 'employee', 'dept_lead'])
    .withMessage('Role must be one of: admin, manager, employee, or dept_lead'),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.param || 'unknown',
      message: err.msg || 'Validation failed',
    }));
    
    const fieldMessages = errorMessages.map(e => {
      if (!e.field || e.field === 'unknown') {
        return e.message;
      }
      const fieldName = e.field === 'date' ? 'Date' :
                       e.field === 'hours' ? 'Hours' :
                       e.field === 'clockIn' ? 'Clock in time' :
                       e.field === 'clockOut' ? 'Clock out time' :
                       e.field === 'payrollPeriodId' ? 'Payroll period' :
                       e.field === 'reason' ? 'Rejection reason' :
                       e.field === 'comments' ? 'Comments' :
                       e.field.charAt(0).toUpperCase() + e.field.slice(1);
      return `${fieldName}: ${e.message}`;
    }).join('. ');
    
    return next(new InvalidInputError(`Please correct the following: ${fieldMessages}`, errorMessages));
  }
  next();
};

