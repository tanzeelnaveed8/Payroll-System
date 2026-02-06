import { body, query, param, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

export const validateCreateTask = [
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid employee ID format');
      }
      const employee = await User.findById(value);
      if (!employee) {
        throw new Error('Employee not found');
      }
      return true;
    }),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('priority')
    .notEmpty()
    .withMessage('Priority is required')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .custom((value) => {
      // Accept both ISO8601 datetime strings and date-only strings (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
      if (!dateRegex.test(value)) {
        throw new Error('Please provide a valid due date in YYYY-MM-DD format');
      }
      const dueDate = new Date(value);
      if (isNaN(dueDate.getTime())) {
        throw new Error('Please provide a valid due date');
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        throw new Error('Due date cannot be in the past');
      }
      return true;
    }),
  body('estimatedHours')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true;
      }
      const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Estimated hours must be a positive number');
      }
      return true;
    }),
  body('tags')
    .optional({ checkFalsy: true })
    .isArray()
    .withMessage('Tags must be an array'),
  body('category')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  body('attachments')
    .optional({ checkFalsy: true })
    .isArray()
    .withMessage('Attachments must be an array'),
];

export const validateUpdateTask = [
  param('id')
    .notEmpty()
    .withMessage('Task ID is required')
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid task ID format');
      }
      const task = await Task.findById(value);
      if (!task) {
        throw new Error('Task not found');
      }
      return true;
    }),
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid due date')
    .custom((value) => {
      const dueDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        throw new Error('Due date cannot be in the past');
      }
      return true;
    }),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
  body('actualHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual hours must be a positive number'),
  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('category')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
];

export const validateUpdateTaskStatus = [
  param('id')
    .notEmpty()
    .withMessage('Task ID is required')
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid task ID format');
      }
      const task = await Task.findById(value);
      if (!task) {
        throw new Error('Task not found');
      }
      return true;
    }),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Status must be pending, in-progress, completed, or cancelled'),
];

export const validateGetTasks = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isString()
    .withMessage('Sort must be a string'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  query('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  query('employeeId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid employee ID format');
      }
      return true;
    }),
  query('assignedBy')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid assigned by ID format');
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

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((e) => e.msg);
    // Log validation errors for debugging
    console.error('[Task Validation] Validation failed:', {
      errors: errorMessages,
      body: {
        employeeId: req.body.employeeId,
        title: req.body.title,
        priority: req.body.priority,
        dueDate: req.body.dueDate,
        description: req.body.description ? 'provided' : 'not provided',
        estimatedHours: req.body.estimatedHours,
      },
      timestamp: new Date().toISOString(),
    });
    return next(new InvalidInputError('Validation failed', errorMessages));
  }
  next();
};

