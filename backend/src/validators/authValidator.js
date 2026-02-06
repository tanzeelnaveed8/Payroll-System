import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { InvalidInputError } from '../utils/errorHandler.js';

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const validateRegister = [
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
        throw new Error('This email address is already registered. Please use a different email address.');
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
    .isIn(['admin', 'manager', 'employee', 'dept_lead'])
    .withMessage('Please select a valid role (Administrator, Manager, Employee, or Department Lead)'),
  body('employeeId')
    .optional()
    .trim()
    .custom(async (value) => {
      if (value) {
        const user = await User.findOne({ employeeId: value });
        if (user) {
          throw new Error('This employee ID is already in use. Please use a different employee ID.');
        }
      }
    }),
];

export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

export const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
];

export const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.param || 'unknown',
      message: err.msg || 'Validation failed',
    }));
    
    // Create user-friendly error message
    const fieldMessages = errorMessages.map(e => {
      if (!e.field || e.field === 'unknown') {
        return e.message;
      }
      const fieldName = e.field === 'email' ? 'Email address' : 
                       e.field === 'password' ? 'Password' : 
                       e.field === 'name' ? 'Full name' :
                       e.field === 'role' ? 'Role' :
                       e.field.charAt(0).toUpperCase() + e.field.slice(1);
      return `${fieldName}: ${e.message}`;
    }).join('. ');
    
    return next(new InvalidInputError(`Please correct the following: ${fieldMessages}`, errorMessages));
  }
  next();
};

