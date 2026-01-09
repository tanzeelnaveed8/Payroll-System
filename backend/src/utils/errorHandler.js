export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InvalidInputError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.name = 'InvalidInputError';
    this.errors = errors;
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'ResourceNotFoundError';
  }
}

export class AuthenticationFailedError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationFailedError';
  }
}

export class AccessDeniedError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AccessDeniedError';
  }
}

export class DuplicateResourceError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'DuplicateResourceError';
  }
}

// Keep old names for backward compatibility but mark as deprecated
export class ValidationError extends InvalidInputError {
  constructor(message, errors = []) {
    super(message, errors);
    this.name = 'InvalidInputError';
  }
}

export class NotFoundError extends ResourceNotFoundError {
  constructor(resource = 'Resource') {
    super(resource);
    this.name = 'ResourceNotFoundError';
  }
}

export class UnauthorizedError extends AuthenticationFailedError {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationFailedError';
  }
}

export class ForbiddenError extends AccessDeniedError {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

export class ConflictError extends DuplicateResourceError {
  constructor(message = 'Resource already exists') {
    super(message);
    this.name = 'DuplicateResourceError';
  }
}

export const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new InvalidInputError(message);
};

export const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)[0];
  const message = `This ${value} is already registered. Please use a different value.`;
  return new DuplicateResourceError(message);
};

export const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Please check your input: ${errors.join('. ')}`;
  return new InvalidInputError(message, errors);
};

export const handleJWTError = () => {
  return new AuthenticationFailedError('Your session is invalid. Please log in again.');
};

export const handleJWTExpiredError = () => {
  return new AuthenticationFailedError('Your session has expired. Please log in again.');
};

