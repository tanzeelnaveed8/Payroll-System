import { param, query, body, validationResult } from 'express-validator';
import { InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

export const validateFileId = [
  param('id')
    .notEmpty()
    .withMessage('File ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid file ID format');
      }
      return true;
    })
];

export const validateUploadFile = [
  body('entityType')
    .notEmpty()
    .withMessage('Entity type is required')
    .isIn([
      'paystub',
      'employee_document',
      'leave_attachment',
      'timesheet_attachment',
      'profile_photo',
      'company_logo',
      'report',
      'task_attachment'
    ])
    .withMessage('Invalid entity type'),

  body('entityId')
    .notEmpty()
    .withMessage('Entity ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid entity ID format');
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),

  body('isPublic')
    .optional()
    .isIn(['true', 'false', true, false])
    .withMessage('isPublic must be true or false')
];

export const validateGetFilesByEntity = [
  query('entityType')
    .notEmpty()
    .withMessage('Entity type is required')
    .isIn([
      'paystub',
      'employee_document',
      'leave_attachment',
      'timesheet_attachment',
      'profile_photo',
      'company_logo',
      'report',
      'task_attachment'
    ])
    .withMessage('Invalid entity type'),

  query('entityId')
    .notEmpty()
    .withMessage('Entity ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid entity ID format');
      }
      return true;
    })
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

