import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getReports,
  getReportById,
  generateReportEndpoint,
  getReportPDF,
  getReportExcel,
  getPayrollSummary,
  getAttendanceOverview,
  getLeaveAnalytics,
  getDepartmentCosts,
} from '../controllers/reportController.js';
import {
  validateGetReports,
  validateGenerateReport,
  validateReportId,
  validateDateRange,
  handleValidationErrors,
} from '../validators/reportValidator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Quick report endpoints (no stored reports, just data)
router.get(
  '/payroll-summary',
  authorize('admin', 'manager'),
  validateDateRange,
  handleValidationErrors,
  getPayrollSummary
);

router.get(
  '/attendance-overview',
  authorize('admin', 'manager'),
  validateDateRange,
  handleValidationErrors,
  getAttendanceOverview
);

router.get(
  '/leave-analytics',
  authorize('admin', 'manager'),
  validateDateRange,
  handleValidationErrors,
  getLeaveAnalytics
);

router.get(
  '/department-costs',
  authorize('admin', 'manager'),
  validateDateRange,
  handleValidationErrors,
  getDepartmentCosts
);

// Report generation and management
router.post(
  '/generate',
  authorize('admin', 'manager'),
  validateGenerateReport,
  handleValidationErrors,
  generateReportEndpoint
);

// List and view reports
router.get(
  '/',
  authorize('admin', 'manager'),
  validateGetReports,
  handleValidationErrors,
  getReports
);

router.get(
  '/:id',
  authorize('admin', 'manager'),
  validateReportId,
  handleValidationErrors,
  getReportById
);

// File downloads with cache headers
router.get(
  '/:id/pdf',
  authorize('admin', 'manager'),
  validateReportId,
  handleValidationErrors,
  getReportPDF
);

router.get(
  '/:id/excel',
  authorize('admin', 'manager'),
  validateReportId,
  handleValidationErrors,
  getReportExcel
);

export default router;
