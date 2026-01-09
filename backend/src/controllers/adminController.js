import { getDashboardData } from '../services/adminService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { logUserAction } from '../utils/auditLogger.js';

/**
 * GET /api/admin/dashboard
 * Get admin dashboard data
 * Access: Admin only
 */
export const getDashboard = async (req, res, next) => {
  try {
    const data = await getDashboardData();
    
    // Log admin action
    await logUserAction(req.user._id, 'view_admin_dashboard', {
      timestamp: new Date()
    });

    return sendSuccess(res, 200, 'Dashboard data retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

