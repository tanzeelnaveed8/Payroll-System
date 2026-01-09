import express from 'express';
import { getDashboard } from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/admin/dashboard
 * Get admin dashboard data
 * Access: Admin only
 */
router.get('/dashboard', authorize('admin'), getDashboard);

export default router;

