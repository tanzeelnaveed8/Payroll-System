import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  updateLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  bulkApproveLeaveRequests,
  bulkRejectLeaveRequests,
  getAllLeaveBalances,
  getEmployeeLeaveBalance,
  getYearSpecificBalance,
  getEmployeeLeaveRequests,
  getUniqueDepartments
} from '../controllers/leaveController.js';
import {
  validateCreateLeaveRequest,
  validateUpdateLeaveRequest,
  validateApproveRejectLeaveRequest,
  validateRejectLeaveRequest,
  validateBulkApproveReject,
  validateBulkReject,
  validateLeaveQuery,
  validateEmployeeId,
  validateYear,
  handleValidationErrors
} from '../validators/leaveValidator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Public routes (for all authenticated users)
router.get('/requests', validateLeaveQuery, handleValidationErrors, getLeaveRequests);
router.get('/requests/:id', getLeaveRequestById);
router.get('/requests/employee/:employeeId', validateEmployeeId, handleValidationErrors, getEmployeeLeaveRequests);
router.get('/departments', getUniqueDepartments);

// Employee routes
router.post('/requests', validateCreateLeaveRequest, handleValidationErrors, createLeaveRequest);
router.put('/requests/:id', validateUpdateLeaveRequest, handleValidationErrors, updateLeaveRequest);

// Manager/Admin routes for approvals
router.post('/requests/:id/approve', authorize('manager', 'admin'), validateApproveRejectLeaveRequest, handleValidationErrors, approveLeaveRequest);
router.post('/requests/:id/reject', authorize('manager', 'admin'), validateRejectLeaveRequest, handleValidationErrors, rejectLeaveRequest);
router.post('/requests/bulk/approve', authorize('manager', 'admin'), validateBulkApproveReject, handleValidationErrors, bulkApproveLeaveRequests);
router.post('/requests/bulk/reject', authorize('manager', 'admin'), validateBulkReject, handleValidationErrors, bulkRejectLeaveRequests);

// Balance routes
router.get('/balances', authorize('admin'), getAllLeaveBalances);
router.get('/balances/:employeeId', validateEmployeeId, handleValidationErrors, getEmployeeLeaveBalance);
router.get('/balances/:employeeId/:year', validateEmployeeId, validateYear, handleValidationErrors, getYearSpecificBalance);

export default router;

