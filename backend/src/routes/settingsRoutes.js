import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { cacheMiddleware } from '../utils/cache.js';
import {
  getAllSettings,
  getSettingsByType,
  updateCompanySettings,
  updatePayrollSettings,
  updateAttendanceSettings,
  updateLeavePolicies,
  getTimezones,
} from '../controllers/settingsController.js';
import {
  validateGetSettings,
  validateCompanySettings,
  validatePayrollSettings,
  validateAttendanceSettings,
  validateLeavePolicies,
  handleValidationErrors,
} from '../validators/settingsValidator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get timezones (available to all authenticated users)
router.get('/timezones', getTimezones);

// Admin-only routes (with caching)
router.get(
  '/',
  authorize('admin'),
  cacheMiddleware(300), // Cache for 5 minutes
  getAllSettings
);

router.get(
  '/:type',
  authorize('admin'),
  validateGetSettings,
  handleValidationErrors,
  cacheMiddleware(300), // Cache for 5 minutes
  getSettingsByType
);

router.put(
  '/company',
  authorize('admin'),
  validateCompanySettings,
  handleValidationErrors,
  updateCompanySettings
);

router.put(
  '/payroll',
  authorize('admin'),
  validatePayrollSettings,
  handleValidationErrors,
  updatePayrollSettings
);

router.put(
  '/attendance',
  authorize('admin'),
  validateAttendanceSettings,
  handleValidationErrors,
  updateAttendanceSettings
);

router.put(
  '/leave-policies',
  authorize('admin'),
  validateLeavePolicies,
  handleValidationErrors,
  updateLeavePolicies
);

export default router;

