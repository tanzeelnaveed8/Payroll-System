import express from 'express';
import {
  getDashboard,
  getTeam,
  getTeamMember,
  getPendingApprovalsCount,
  getPendingTimesheetsList,
  getPendingLeaveRequestsList,
  getPerformanceUpdatesList,
  createPerformanceUpdateEndpoint,
  getPerformanceUpdate,
  updatePerformanceUpdateEndpoint
} from '../controllers/managerController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeManagerOrAdmin } from '../middleware/authorize.js';
import {
  validateTeamMemberId,
  validatePerformanceUpdateId,
  validateCreatePerformanceUpdate,
  validateUpdatePerformanceUpdate,
  validatePerformanceUpdateFilters,
  handleValidationErrors
} from '../validators/managerValidator.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeManagerOrAdmin());

router.get('/dashboard', getDashboard);
router.get('/team', getTeam);
router.get('/team/:id', validateTeamMemberId, handleValidationErrors, getTeamMember);
router.get('/pending-approvals', getPendingApprovalsCount);
router.get('/timesheets/pending', getPendingTimesheetsList);
router.get('/leave-requests/pending', getPendingLeaveRequestsList);
router.get('/performance-updates', validatePerformanceUpdateFilters, handleValidationErrors, getPerformanceUpdatesList);
router.post('/performance-updates', validateCreatePerformanceUpdate, handleValidationErrors, createPerformanceUpdateEndpoint);
router.get('/performance-updates/:id', validatePerformanceUpdateId, handleValidationErrors, getPerformanceUpdate);
router.put('/performance-updates/:id', validateUpdatePerformanceUpdate, handleValidationErrors, updatePerformanceUpdateEndpoint);

export default router;

