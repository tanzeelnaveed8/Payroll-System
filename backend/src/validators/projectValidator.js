import { body, param, query, validationResult } from 'express-validator';
import { InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

export const validateProjectId = [
  param('id')
    .notEmpty()
    .withMessage('Project ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid project ID format');
      }
      return true;
    }),
];

export const validateCreateProject = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Project name is required and must be between 1 and 200 characters'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),

  body('owner')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Owner name must be less than 200 characters'),

  body('ownerId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid owner ID format');
      }
      return true;
    }),

  body('status')
    .notEmpty()
    .isIn(['draft', 'connected', 'pending', 'archived'])
    .withMessage('Status must be one of: draft, connected, pending, archived'),

  body('connection')
    .optional()
    .custom((value) => {
      if (value && typeof value !== 'object') {
        throw new Error('Connection must be an object');
      }
      return true;
    }),

  body('connection.baseUrl')
    .optional()
    .custom((value, { req }) => {
      if (req.body?.connection && req.body.connection.baseUrl) {
        try {
          new URL(value);
          return true;
        } catch {
          throw new Error('Base URL must be a valid URL');
        }
      }
      return true;
    }),

  body('connection.authType')
    .optional()
    .if(body('connection').exists())
    .isIn(['api-key', 'token', 'oauth'])
    .withMessage('Auth type must be one of: api-key, token, oauth'),

  body('connection.apiKey')
    .optional()
    .if(body('connection.authType').equals('api-key'))
    .notEmpty()
    .trim()
    .withMessage('API key is required when auth type is api-key'),

  body('connection.token')
    .optional()
    .custom((value, { req }) => {
      const authType = req.body?.connection?.authType;
      if (authType === 'token' || authType === 'oauth') {
        if (!value || !value.trim()) {
          throw new Error('Token is required when auth type is token or oauth');
        }
      }
      return true;
    }),

  body('connection.tokenExpiresAt')
    .optional()
    .if(body('connection.tokenExpiresAt').exists())
    .isISO8601()
    .withMessage('Token expiration must be a valid date'),

  body('kpi')
    .optional()
    .custom((value) => {
      if (value && typeof value !== 'object') {
        throw new Error('KPI must be an object');
      }
      return true;
    }),

  body('kpi.users')
    .optional()
    .if(body('kpi').exists())
    .isInt({ min: 0 })
    .withMessage('Users must be a non-negative integer'),

  body('kpi.revenue')
    .optional()
    .if(body('kpi').exists())
    .isFloat({ min: 0 })
    .withMessage('Revenue must be a non-negative number'),

  body('kpi.activity')
    .optional()
    .if(body('kpi').exists())
    .isFloat({ min: 0 })
    .withMessage('Activity must be a non-negative number'),

  body('kpi.growth')
    .optional()
    .if(body('kpi').exists())
    .isFloat()
    .withMessage('Growth must be a number'),
];

export const validateUpdateProject = [
  param('id')
    .notEmpty()
    .withMessage('Project ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid project ID format');
      }
      return true;
    }),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Project name must be between 1 and 200 characters'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),

  body('owner')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Owner name must be less than 200 characters'),

  body('ownerId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid owner ID format');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['draft', 'connected', 'pending', 'archived'])
    .withMessage('Status must be one of: draft, connected, pending, archived'),

  body('connection')
    .optional()
    .custom((value) => {
      if (value && typeof value !== 'object') {
        throw new Error('Connection must be an object');
      }
      return true;
    }),

  body('connection.baseUrl')
    .optional()
    .custom((value, { req }) => {
      if (req.body?.connection && req.body.connection.baseUrl) {
        try {
          new URL(value);
          return true;
        } catch {
          throw new Error('Base URL must be a valid URL');
        }
      }
      return true;
    }),

  body('connection.authType')
    .optional()
    .if(body('connection').exists())
    .isIn(['api-key', 'token', 'oauth'])
    .withMessage('Auth type must be one of: api-key, token, oauth'),

  body('connection.apiKey')
    .optional()
    .if(body('connection.authType').equals('api-key'))
    .notEmpty()
    .trim()
    .withMessage('API key is required when auth type is api-key'),

  body('connection.token')
    .optional()
    .custom((value, { req }) => {
      const authType = req.body?.connection?.authType;
      if (authType === 'token' || authType === 'oauth') {
        if (!value || !value.trim()) {
          throw new Error('Token is required when auth type is token or oauth');
        }
      }
      return true;
    }),

  body('kpi')
    .optional()
    .custom((value) => {
      if (value && typeof value !== 'object') {
        throw new Error('KPI must be an object');
      }
      return true;
    }),

  body('kpi.users')
    .optional()
    .if(body('kpi').exists())
    .isInt({ min: 0 })
    .withMessage('Users must be a non-negative integer'),

  body('kpi.revenue')
    .optional()
    .if(body('kpi').exists())
    .isFloat({ min: 0 })
    .withMessage('Revenue must be a non-negative number'),

  body('kpi.activity')
    .optional()
    .if(body('kpi').exists())
    .isFloat({ min: 0 })
    .withMessage('Activity must be a non-negative number'),

  body('kpi.growth')
    .optional()
    .if(body('kpi').exists())
    .isFloat()
    .withMessage('Growth must be a number'),
];

export const validateConnectionTest = [
  param('id')
    .notEmpty()
    .withMessage('Project ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid project ID format');
      }
      return true;
    }),

  body('connection')
    .optional()
    .custom((value) => {
      if (value && typeof value !== 'object') {
        throw new Error('Connection must be an object');
      }
      return true;
    }),

  body('connection.baseUrl')
    .optional()
    .custom((value, { req }) => {
      if (req.body?.connection && req.body.connection.baseUrl) {
        try {
          new URL(value);
          return true;
        } catch {
          throw new Error('Base URL must be a valid URL');
        }
      }
      return true;
    }),

  body('connection.authType')
    .optional()
    .if(body('connection').exists())
    .isIn(['api-key', 'token', 'oauth'])
    .withMessage('Auth type must be one of: api-key, token, oauth'),

  body('connection.apiKey')
    .optional()
    .if(body('connection.authType').equals('api-key'))
    .notEmpty()
    .trim()
    .withMessage('API key is required when auth type is api-key'),

  body('connection.token')
    .optional()
    .custom((value, { req }) => {
      const authType = req.body?.connection?.authType;
      if (authType === 'token' || authType === 'oauth') {
        if (!value || !value.trim()) {
          throw new Error('Token is required when auth type is token or oauth');
        }
      }
      return true;
    }),
];

export const validateListProjects = [
  query('status')
    .optional()
    .isIn(['draft', 'connected', 'pending', 'archived'])
    .withMessage('Status must be one of: draft, connected, pending, archived'),

  query('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query must be less than 200 characters'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.param || err.path || err.location,
      message: err.msg,
    }));
    console.error('Validation errors:', JSON.stringify(errorMessages, null, 2));
    return next(new InvalidInputError('Validation failed', errorMessages));
  }
  next();
};

