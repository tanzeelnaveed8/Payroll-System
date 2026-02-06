import express from 'express';
import {
  createProgressUpdate,
  getMyProgressUpdates,
  getProgressUpdates,
  getUpdateById,
  acknowledgeUpdate
} from '../controllers/progressUpdateController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Dept_lead routes
router.post('/', authorize('dept_lead'), createProgressUpdate);
router.get('/dept-lead', authorize('dept_lead'), getMyProgressUpdates);

// Manager/Admin routes
router.get('/', authorize('admin', 'manager'), getProgressUpdates);
router.post('/:id/acknowledge', authorize('admin', 'manager'), acknowledgeUpdate);

// Shared routes
router.get('/:id', authorize('dept_lead', 'admin', 'manager'), getUpdateById);

export default router;
