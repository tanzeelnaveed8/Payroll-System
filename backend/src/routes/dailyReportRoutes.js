import express from 'express';
import {
  createDailyReport,
  getMyDailyReports,
  getDepartmentReports,
  getReportById,
  reviewReport,
  getReportStats
} from '../controllers/dailyReportController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Employee routes
router.post('/', authorize('employee'), createDailyReport);
router.get('/employee', authorize('employee'), getMyDailyReports);

// Dept_lead routes
router.get('/department', authorize('dept_lead'), getDepartmentReports);
router.get('/department/stats', authorize('dept_lead'), getReportStats);
router.post('/:id/review', authorize('dept_lead'), reviewReport);

// Shared routes (employee, dept_lead, manager, admin)
router.get('/:id', authorize('employee', 'dept_lead', 'manager', 'admin'), getReportById);

export default router;
