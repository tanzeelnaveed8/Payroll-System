import {
  AppError,
  InvalidInputError,
  AuthenticationFailedError,
  handleCastErrorDB,
  handleDuplicateFieldsDB,
  handleValidationErrorDB,
  handleJWTError,
  handleJWTExpiredError,
} from '../utils/errorHandler.js';
import { sendError } from '../utils/responseHandler.js';

const sendErrorDev = (err, res) => {
  console.error('Error Details:', {
    message: err.message,
    statusCode: err.statusCode,
    name: err.name,
    stack: err.stack,
  });
  
  return sendError(res, err.statusCode, err.message, {
    errors: err.errors || null,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err,
    }),
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    // Preserve validation errors array for InvalidInputError
    const errors = err.errors || (err.name === 'InvalidInputError' ? [] : null);
    return sendError(res, err.statusCode, err.message, errors);
  }
  
  console.error('ERROR 💥', err);
  return sendError(res, 500, 'Something went wrong!');
};

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, res);
  }
  
  let error = { ...err };
  error.message = err.message;
  // Preserve errors array for InvalidInputError
  if (err.errors) {
    error.errors = err.errors;
  }
  
  if (err.name === 'CastError') error = handleCastErrorDB(error);
  if (err.code === 11000) error = handleDuplicateFieldsDB(error);
  // Only handle mongoose ValidationError, not InvalidInputError (which already has formatted errors)
  if (err.name === 'ValidationError' && !err.errors) error = handleValidationErrorDB(error);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  
  return sendErrorProd(error, res);
};

export const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

