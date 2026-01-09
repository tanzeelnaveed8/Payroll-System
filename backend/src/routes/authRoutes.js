import express from 'express';
import {
  login,
  register,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';
import {
  validateLogin,
  validateRegister,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword,
  handleValidationErrors,
} from '../validators/authValidator.js';

const router = express.Router();

// Apply rate limiting to authentication endpoints
router.post('/login', authLimiter, validateLogin, handleValidationErrors, login);
router.post('/register', authLimiter, validateRegister, handleValidationErrors, register);
router.post('/refresh', authLimiter, validateRefreshToken, handleValidationErrors, refreshToken);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, handleValidationErrors, forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateResetPassword, handleValidationErrors, resetPassword);
router.get('/me', authenticate, getCurrentUser);

export default router;


