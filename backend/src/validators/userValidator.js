import { body, query, param, validationResult } from 'express-validator';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

export const validateCreateUser = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .toLowerCase()
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error('An account with this email address already exists');
      }
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Role must be admin, manager, or employee'),
  body('employeeId')
    .optional()
    .trim()
    .custom(async (value) => {
      if (value) {
        const user = await User.findOne({ employeeId: value });
        if (user) {
          throw new Error('An account with this employee ID already exists');
        }
      }
    }),
  body('departmentId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid department ID format');
      }
      return true;
    })
    .custom(async (value) => {
      if (value) {
        const department = await Department.findById(value);
        if (!department) {
          throw new Error('Department not found');
        }
      }
    }),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name must be less than 100 characters'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position must be less than 100 characters'),
  body('employmentType')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'intern'])
    .withMessage('Employment type must be full-time, part-time, contract, or intern'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'on-leave', 'terminated'])
    .withMessage('Status must be active, inactive, on-leave, or terminated'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must be less than 20 characters'),
  body('baseSalary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base salary must be a positive number'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
];

export const validateUpdateUser = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format');
      }
      return true;
    }),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .toLowerCase()
    .custom(async (value, { req }) => {
      if (value) {
        const user = await User.findOne({ email: value });
        if (user && user._id.toString() !== req.params.id) {
          throw new Error('An account with this email address already exists');
        }
      }
    }),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Role must be admin, manager, or employee'),
  body('employeeId')
    .optional()
    .trim()
    .custom(async (value, { req }) => {
      if (value) {
        const user = await User.findOne({ employeeId: value });
        if (user && user._id.toString() !== req.params.id) {
          throw new Error('An account with this employee ID already exists');
        }
      }
    }),
  body('departmentId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid department ID format');
      }
      return true;
    })
    .custom(async (value) => {
      if (value) {
        const department = await Department.findById(value);
        if (!department) {
          throw new Error('Department not found');
        }
      }
    }),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name must be less than 100 characters'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position must be less than 100 characters'),
  body('employmentType')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'intern'])
    .withMessage('Employment type must be full-time, part-time, contract, or intern'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'on-leave', 'terminated'])
    .withMessage('Status must be active, inactive, on-leave, or terminated'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must be less than 20 characters'),
  body('baseSalary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base salary must be a positive number'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
];

export const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must be less than 20 characters'),
  body('photo')
    .optional()
    .isURL()
    .withMessage('Photo must be a valid URL'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address must be less than 200 characters'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must be less than 100 characters'),
  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Zip code must be less than 20 characters'),
  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be true or false'),
  body('preferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notification preference must be true or false'),
  body('preferences.notifications.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS notification preference must be true or false'),
  body('preferences.language')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Language code must be less than 10 characters'),
  body('preferences.timezone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Timezone must be less than 50 characters'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be light, dark, or auto'),
];

export const validateUserQuery = [
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
    .isIn(['name', 'email', 'role', 'department', 'status', 'createdAt', 'joinDate'])
    .withMessage('Sort field must be one of: name, email, role, department, status, createdAt, joinDate'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters'),
  query('role')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Role filter must be admin, manager, or employee'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'on-leave', 'terminated'])
    .withMessage('Status filter must be active, inactive, on-leave, or terminated'),
  query('employmentType')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'intern'])
    .withMessage('Employment type filter must be full-time, part-time, contract, or intern'),
  query('departmentId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid department ID format');
      }
      return true;
    }),
];

export const validateUserId = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format');
      }
      return true;
    }),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    }));
    
    const fieldMessages = errorMessages.map(e => {
      if (!e.field) {
        return e.message;
      }
      const fieldName = e.field === 'email' ? 'Email address' : 
                       e.field === 'password' ? 'Password' : 
                       e.field.charAt(0).toUpperCase() + e.field.slice(1);
      return `${fieldName}: ${e.message}`;
    }).join('. ');
    
    return next(new InvalidInputError(`Please correct the following: ${fieldMessages}`, errorMessages));
  }
  next();
};

