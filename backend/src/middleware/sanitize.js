import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import mongoose from 'mongoose';

/**
 * Sanitize MongoDB operator injection
 * Prevents operators like $gt, $ne, $where from being injected
 */
export const sanitizeMongo = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[Security] Sanitized MongoDB operator in ${key} for request ${req.method} ${req.path}`);
  },
});

/**
 * XSS Prevention
 * Cleans user input from malicious scripts
 */
export const sanitizeXSS = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObjectForXSS(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObjectForXSS(req.query);
  }

  next();
};

// Helper to sanitize objects recursively
const sanitizeObjectForXSS = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectForXSS(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObjectForXSS(value);
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    return xss(obj);
  }
  
  return obj;
};

/**
 * Custom input sanitization
 * Removes or escapes potentially dangerous characters
 */
export const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove null bytes
    str = str.replace(/\0/g, '');
    
    // Remove control characters except newlines and tabs
    str = str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    
    // Trim whitespace
    str = str.trim();
    
    return str;
  };

  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key
        const cleanKey = sanitizeString(key);
        // Sanitize value
        sanitized[cleanKey] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Validate ObjectId format to prevent injection
 */
export const validateObjectId = (req, res, next) => {
  const validateId = (id) => {
    if (!id) return true;
    if (typeof id !== 'string') return false;
    return mongoose.Types.ObjectId.isValid(id) && id.length === 24;
  };

  // Validate params
  for (const [key, value] of Object.entries(req.params)) {
    if (key.toLowerCase().includes('id') && value) {
      if (!validateId(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${key} format`,
        });
      }
    }
  }

  // Validate query IDs
  for (const [key, value] of Object.entries(req.query)) {
    if (key.toLowerCase().includes('id') && value) {
      if (Array.isArray(value)) {
        for (const id of value) {
          if (!validateId(id)) {
            return res.status(400).json({
              success: false,
              message: `Invalid ${key} format`,
            });
          }
        }
      } else if (!validateId(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${key} format`,
        });
      }
    }
  }

  next();
};

