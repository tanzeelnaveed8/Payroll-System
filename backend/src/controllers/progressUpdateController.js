import {
  createOrUpdateProgressUpdate,
  getDeptLeadProgressUpdates,
  getProgressUpdatesForManager,
  getProgressUpdateById,
  acknowledgeProgressUpdate
} from '../services/progressUpdateService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { logUserAction } from '../utils/auditLogger.js';

/**
 * POST /api/progress-updates
 * Create or update a progress update (dept_lead)
 */
export const createProgressUpdate = async (req, res, next) => {
  try {
    const deptLeadId = req.user._id;
    const update = await createOrUpdateProgressUpdate(deptLeadId, req.body);
    
    await logUserAction(deptLeadId, 'create_progress_update', {
      updateId: update._id,
      periodStart: update.periodStart,
      periodEnd: update.periodEnd
    });

    return sendSuccess(res, 201, 'Progress update created successfully', update);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/progress-updates/dept-lead
 * Get progress updates for the logged-in dept_lead
 */
export const getMyProgressUpdates = async (req, res, next) => {
  try {
    const deptLeadId = req.user._id;
    const updates = await getDeptLeadProgressUpdates(deptLeadId, req.query);
    return sendSuccess(res, 200, 'Progress updates retrieved successfully', { updates });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/progress-updates
 * Get progress updates visible to manager/admin
 */
export const getProgressUpdates = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const updates = await getProgressUpdatesForManager(userId, userRole, req.query);
    return sendSuccess(res, 200, 'Progress updates retrieved successfully', { updates });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/progress-updates/:id
 * Get a specific progress update
 */
export const getUpdateById = async (req, res, next) => {
  try {
    const updateId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;
    const update = await getProgressUpdateById(updateId, userId, userRole);
    return sendSuccess(res, 200, 'Progress update retrieved successfully', update);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/progress-updates/:id/acknowledge
 * Acknowledge a progress update (manager/admin)
 */
export const acknowledgeUpdate = async (req, res, next) => {
  try {
    const updateId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;
    const update = await acknowledgeProgressUpdate(updateId, userId, userRole, req.body);
    
    await logUserAction(userId, 'acknowledge_progress_update', {
      updateId: update._id,
      deptLeadId: update.deptLeadId
    });

    return sendSuccess(res, 200, 'Progress update acknowledged successfully', update);
  } catch (error) {
    next(error);
  }
};
