import express from 'express';
import {
  getDashboard,
  getCurrentTimesheetEndpoint,
  submitTimesheetEndpoint,
  getPaystubsList,
  getPaystub,
  getLeaveBalanceEndpoint,
  getLeaveRequestsList,
  createLeaveRequestEndpoint
} from '../controllers/employeeController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  validatePaystubId,
  validateSubmitTimesheet,
  validateCreateLeaveRequest,
  validateGetPaystubs,
  validateGetLeaveRequests,
  handleValidationErrors
} from '../validators/employeeValidator.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('employee'));

router.get('/dashboard', getDashboard);
router.get('/timesheet/current', getCurrentTimesheetEndpoint);
router.post('/timesheet/submit', validateSubmitTimesheet, handleValidationErrors, submitTimesheetEndpoint);
router.get('/paystubs', validateGetPaystubs, handleValidationErrors, getPaystubsList);
router.get('/paystubs/:id', validatePaystubId, handleValidationErrors, getPaystub);
router.get('/leave/balance', getLeaveBalanceEndpoint);
router.get('/leave/requests', validateGetLeaveRequests, handleValidationErrors, getLeaveRequestsList);
router.post('/leave/requests', validateCreateLeaveRequest, handleValidationErrors, createLeaveRequestEndpoint);

export default router;

