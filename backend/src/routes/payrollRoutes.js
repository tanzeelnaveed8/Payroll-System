import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getPayrollPeriods,
  getPayrollPeriodById,
  createPayrollPeriod,
  updatePayrollPeriod,
  processPayroll,
  approvePayroll,
  getCurrentPeriod,
  getNextPayDate,
  getPaystubs,
  getPaystubById,
  getPaystubPDF,
  getEmployeePaystubs,
  calculatePayroll,
} from '../controllers/payrollController.js';
import {
  validateCreatePeriod,
  validateUpdatePeriod,
  validateProcessPayroll,
  validateApprovePayroll,
  validatePeriodId,
  validatePaystubId,
  validateEmployeeId,
  validateCalculatePayroll,
  validatePayrollQuery,
  handleValidationErrors,
} from '../validators/payrollValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/periods', validatePayrollQuery, handleValidationErrors, getPayrollPeriods);
router.get('/periods/current', getCurrentPeriod);
router.get('/periods/:id', validatePeriodId, handleValidationErrors, getPayrollPeriodById);
router.post('/periods', authorize('admin'), validateCreatePeriod, handleValidationErrors, createPayrollPeriod);
router.put('/periods/:id', authorize('admin'), validateUpdatePeriod, handleValidationErrors, updatePayrollPeriod);
router.post('/periods/:id/process', authorize('admin'), validateProcessPayroll, handleValidationErrors, processPayroll);
router.post('/periods/:id/approve', authorize('admin'), validateApprovePayroll, handleValidationErrors, approvePayroll);

router.get('/next-date', getNextPayDate);

router.get('/paystubs', getPaystubs);
router.get('/paystubs/:id', validatePaystubId, handleValidationErrors, getPaystubById);
router.get('/paystubs/:id/pdf', validatePaystubId, handleValidationErrors, getPaystubPDF);
router.get('/paystubs/employee/:employeeId', validateEmployeeId, handleValidationErrors, getEmployeePaystubs);

router.post('/calculate', authorize('admin'), validateCalculatePayroll, handleValidationErrors, calculatePayroll);

export default router;

