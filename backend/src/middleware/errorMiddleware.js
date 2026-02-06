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

const sendErrorDev = (err, res, req) => {
  // Skip logging for missing profile images (expected 404s)
  const isMissingProfileImage = req?.path?.startsWith('/uploads/profiles') && 
                                 err.statusCode === 404 &&
                                 err.message?.includes("Can't find");
  
  if (!isMissingProfileImage) {
    console.error('Error Details:', {
      message: err.message,
      statusCode: err.statusCode,
      name: err.name,
      stack: err.stack,
    });
  }
  
  return sendError(res, err.statusCode, err.message, {
    errors: err.errors || null,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err,
      validationErrors: err.errors || null,
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
  
  // Skip error handling for missing profile images (expected 404s, handled gracefully)
  const isMissingProfileImage = req?.path?.startsWith('/uploads/profiles') && 
                                 err.statusCode === 404 &&
                                 (err.message?.includes("Can't find") || err.message?.includes('IMAGE_NOT_FOUND'));
  
  if (isMissingProfileImage) {
    return res.status(404).json({ 
      status: 'error',
      message: 'Profile image not found',
      code: 'IMAGE_NOT_FOUND'
    });
  }
  
  // Handle MongoDB connection errors professionally
  if (err.name === 'MongoServerSelectionError' || 
      err.name === 'MongoNetworkError' ||
      err.name === 'MongoTimeoutError' ||
      err.message?.includes('MongoServerSelectionError')) {
    err.statusCode = 503; // Service Unavailable
    err.isOperational = true;
    if (process.env.NODE_ENV === 'production') {
      err.message = 'Database service is temporarily unavailable. Please try again later or contact support if the issue persists.';
    } else {
      err.message = `Database connection error: ${err.message}`;
    }
  }
  
  // Handle DNS resolution errors
  if (err.message?.includes('ENOTFOUND') || 
      err.message?.includes('getaddrinfo') ||
      err.message?.includes('DNS resolution failed')) {
    err.statusCode = 503;
    err.isOperational = true;
    if (process.env.NODE_ENV === 'production') {
      err.message = 'Database service is temporarily unavailable. Please check your network connection and try again later.';
    } else {
      err.message = `DNS resolution failed: ${err.message}`;
      // Log detailed DNS error in development
      console.error('DNS Resolution Error Details:', {
        message: err.message,
        code: err.code,
        hostname: err.hostname || 'unknown',
        stack: err.stack?.split('\n').slice(0, 10).join('\n')
      });
    }
  }
  
  // Handle MongoDB operation timeouts
  if (err.message?.includes('operation timed out') || 
      err.message?.includes('server selection timed out')) {
    err.statusCode = 503;
    err.isOperational = true;
    if (process.env.NODE_ENV === 'production') {
      err.message = 'Database operation timed out. Please try again later.';
    } else {
      err.message = `Database operation timeout: ${err.message}`;
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, res, req);
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
  // Skip error logging for missing profile images (handled by middleware)
  if (req.path.startsWith('/uploads/profiles') && req.get('X-Missing-File')) {
    return res.status(404).json({ 
      status: 'error',
      message: 'Profile image not found',
      code: 'IMAGE_NOT_FOUND'
    });
  }
  
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

