import rateLimit from 'express-rate-limit';

// General API rate limiter
// Excludes auth routes which have their own rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per 15 minutes (increased from 100)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for auth routes (they have their own limiter)
  // Note: req.path is relative to the mount point, so '/api/auth' becomes '/auth'
  skip: (req) => {
    return req.path.startsWith('/auth') || req.originalUrl.startsWith('/api/auth');
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60), // Retry after 15 minutes in seconds
    });
  },
});

// Rate limiter for authentication endpoints
// More lenient to allow legitimate users while still preventing brute force attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 15, // More lenient in development (50 vs 15)
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests - only failed attempts count
  skipFailedRequests: false, // Count failed attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(429).json({
      success: false,
      message: isDevelopment 
        ? 'Rate limit reached. In development mode, limits are more lenient. Please wait a moment and try again.'
        : 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
      retryAfter: Math.ceil(15 * 60), // Retry after 15 minutes in seconds
    });
  },
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many file uploads from this IP, please try again later.',
    });
  },
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again after 1 hour.',
    });
  },
});

// API key generation rate limiter
export const apiKeyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Limit each IP to 5 API key generations per day
  message: 'Too many API key generation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

