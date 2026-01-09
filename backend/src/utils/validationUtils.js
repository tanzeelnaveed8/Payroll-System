import mongoose from 'mongoose';

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    throw new Error(`${fieldName} is required`);
  }
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ${fieldName} format`);
  }
  return true;
};

export const validateRequired = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${fieldName} is required`);
  }
  return true;
};

export const validateStringLength = (value, min, max, fieldName) => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.length < min) {
    throw new Error(`${fieldName} must be at least ${min} characters`);
  }
  if (max && value.length > max) {
    throw new Error(`${fieldName} must be at most ${max} characters`);
  }
  return true;
};

export const validateNumber = (value, min, max, fieldName) => {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a number`);
  }
  if (min !== undefined && num < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }
  if (max !== undefined && num > max) {
    throw new Error(`${fieldName} must be at most ${max}`);
  }
  return true;
};

export const validateEnum = (value, allowedValues, fieldName) => {
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
  return true;
};

export const validateDate = (value, fieldName) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName} date format`);
  }
  return true;
};

export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim();
  }
  return input;
};

export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  return true;
};


