import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getTimesheets,
  getTimesheetById,
  createTimesheet,
  updateTimesheet,
  submitTimesheetForApproval,
  approveTimesheetEntry,
  rejectTimesheetEntry,
  bulkApproveTimesheets,
  bulkRejectTimesheets,
  getEmployeeTimesheets,
  getEmployeePeriodTimesheet,
  getUniqueDepartments,
  getUniqueRoles,
} from '../controllers/timesheetController.js';
import {
  validateCreateTimesheet,
  validateUpdateTimesheet,
  validateSubmitTimesheet,
  validateApproveTimesheet,
  validateRejectTimesheet,
  validateBulkApprove,
  validateBulkReject,
  validateGetTimesheets,
  handleValidationErrors,
} from '../validators/timesheetValidator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// IMPORTANT: Specific routes must be defined BEFORE parameterized routes (/:id)
// Otherwise Express will match /departments and /roles as :id parameters

// List timesheets (role-based filtering in controller)
router.get('/', validateGetTimesheets, handleValidationErrors, getTimesheets);

// Filter options (must be before /:id)
router.get('/departments', getUniqueDepartments);
router.get('/roles', getUniqueRoles);

// Bulk operations (must be before /:id)
router.post('/bulk/approve', authorize('manager', 'admin'), validateBulkApprove, handleValidationErrors, bulkApproveTimesheets);
router.post('/bulk/reject', authorize('manager', 'admin'), validateBulkReject, handleValidationErrors, bulkRejectTimesheets);

// Employee-specific routes (must be before /:id)
router.get('/employee/:employeeId', getEmployeeTimesheets);
router.get('/employee/:employeeId/period/:periodId', getEmployeePeriodTimesheet);

// Create timesheet
router.post('/', validateCreateTimesheet, handleValidationErrors, createTimesheet);

// Parameterized routes (must be last)
router.get('/:id', getTimesheetById);
router.put('/:id', validateUpdateTimesheet, handleValidationErrors, updateTimesheet);
router.post('/:id/submit', validateSubmitTimesheet, handleValidationErrors, submitTimesheetForApproval);
router.post('/:id/approve', authorize('manager', 'admin'), validateApproveTimesheet, handleValidationErrors, approveTimesheetEntry);
router.post('/:id/reject', authorize('manager', 'admin'), validateRejectTimesheet, handleValidationErrors, rejectTimesheetEntry);

export default router;

