import { body, query, param, validationResult } from 'express-validator';
import Department from '../models/Department.js';
import User from '../models/User.js';
import { InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

export const validateCreateDepartment = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Department name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Department name must be between 2 and 100 characters')
    .custom(async (value) => {
      const department = await Department.findOne({ name: value });
      if (department) {
        throw new Error('A department with this name already exists');
      }
    }),
  body('code')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Department code must be less than 20 characters')
    .custom(async (value) => {
      if (value) {
        const department = await Department.findOne({ code: value.toUpperCase() });
        if (department) {
          throw new Error('A department with this code already exists');
        }
      }
    }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('managerId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid manager ID format');
      }
      return true;
    })
    .custom(async (value) => {
      if (value) {
        const user = await User.findById(value);
        if (!user) {
          throw new Error('Manager not found');
        }
        if (user.role !== 'manager' && user.role !== 'admin') {
          throw new Error('Manager must have manager or admin role');
        }
      }
    }),
  body('parentDepartmentId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid parent department ID format');
      }
      return true;
    })
    .custom(async (value) => {
      if (value) {
        const department = await Department.findById(value);
        if (!department) {
          throw new Error('Parent department not found');
        }
      }
    }),
  body('annualBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Annual budget must be a positive number'),
  body('monthlyBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly budget must be a positive number'),
  body('costCenter')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Cost center must be less than 50 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Timezone must be less than 50 characters'),
  body('workingDays')
    .optional()
    .isArray()
    .withMessage('Working days must be an array'),
  body('workingDays.*')
    .optional()
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Each working day must be a valid day of the week'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
];

export const validateUpdateDepartment = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid department ID format');
      }
      return true;
    }),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department name must be between 2 and 100 characters')
    .custom(async (value, { req }) => {
      if (value) {
        const department = await Department.findOne({ name: value });
        if (department && department._id.toString() !== req.params.id) {
          throw new Error('A department with this name already exists');
        }
      }
    }),
  body('code')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Department code must be less than 20 characters')
    .custom(async (value, { req }) => {
      if (value) {
        const department = await Department.findOne({ code: value.toUpperCase() });
        if (department && department._id.toString() !== req.params.id) {
          throw new Error('A department with this code already exists');
        }
      }
    }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('managerId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid manager ID format');
      }
      return true;
    })
    .custom(async (value) => {
      if (value) {
        const user = await User.findById(value);
        if (!user) {
          throw new Error('Manager not found');
        }
        if (user.role !== 'manager' && user.role !== 'admin') {
          throw new Error('Manager must have manager or admin role');
        }
      }
    }),
  body('parentDepartmentId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid parent department ID format');
      }
      return true;
    })
    .custom(async (value, { req }) => {
      if (value) {
        if (value === req.params.id) {
          throw new Error('Department cannot be its own parent');
        }
        const department = await Department.findById(value);
        if (!department) {
          throw new Error('Parent department not found');
        }
      }
    }),
  body('annualBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Annual budget must be a positive number'),
  body('monthlyBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly budget must be a positive number'),
  body('costCenter')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Cost center must be less than 50 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Timezone must be less than 50 characters'),
  body('workingDays')
    .optional()
    .isArray()
    .withMessage('Working days must be an array'),
  body('workingDays.*')
    .optional()
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Each working day must be a valid day of the week'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
];

export const validateDepartmentId = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid department ID format');
      }
      return true;
    }),
];

export const validateDepartmentQuery = [
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
    .isIn(['active', 'inactive'])
    .withMessage('Status filter must be active or inactive'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters'),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    }));
    
    const fieldMessages = errorMessages.map(e => {
      const fieldName = e.field.charAt(0).toUpperCase() + e.field.slice(1);
      return `${fieldName}: ${e.message}`;
    }).join('. ');
    
    return next(new InvalidInputError(`Please correct the following: ${fieldMessages}`, errorMessages));
  }
  next();
};

