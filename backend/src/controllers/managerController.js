import {
  getDashboardData,
  getDirectReports,
  getTeamMemberDetails,
  getPendingApprovals,
  getPendingTimesheets,
  getPendingLeaveRequests,
  getPerformanceUpdates,
  createPerformanceUpdate,
  getPerformanceUpdateById,
  updatePerformanceUpdate,
  getTeamPerformance
} from '../services/managerService.js';
import { sendSuccess, sendPaginated } from '../utils/responseHandler.js';
import { createPagination } from '../utils/responseHandler.js';
import { logUserAction } from '../utils/auditLogger.js';

export const getDashboard = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const data = await getDashboardData(managerId);
    return sendSuccess(res, 200, 'Dashboard data retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getTeam = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const team = await getDirectReports(managerId);
    return sendSuccess(res, 200, 'Team retrieved successfully', { team });
  } catch (error) {
    next(error);
  }
};

export const getTeamMember = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const { id } = req.params;
    const member = await getTeamMemberDetails(managerId, id);
    return sendSuccess(res, 200, 'Team member retrieved successfully', { member });
  } catch (error) {
    next(error);
  }
};

export const getPendingApprovalsCount = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const data = await getPendingApprovals(managerId);
    return sendSuccess(res, 200, 'Pending approvals retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getPendingTimesheetsList = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const pagination = createPagination(page, limit);
    const result = await getPendingTimesheets(managerId, pagination);
    return sendPaginated(res, 'Pending timesheets retrieved successfully', result.timesheets, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getPendingLeaveRequestsList = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const pagination = createPagination(page, limit);
    const result = await getPendingLeaveRequests(managerId, pagination);
    return sendPaginated(res, 'Pending leave requests retrieved successfully', result.leaveRequests, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getPerformanceUpdatesList = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const { employeeId, startDate, endDate, page = 1, limit = 10 } = req.query;
    const filters = { employeeId, startDate, endDate };
    const pagination = createPagination(page, limit);
    const result = await getPerformanceUpdates(managerId, filters, pagination);
    return sendPaginated(res, 'Performance updates retrieved successfully', result.updates, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const createPerformanceUpdateEndpoint = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const updateData = req.body;
    const update = await createPerformanceUpdate(managerId, updateData);
    
    logUserAction(req, 'create', 'PerformanceUpdate', update._id, {
      action: 'create_performance_update',
      employeeId: update.employeeId
    });

    return sendSuccess(res, 201, 'Performance update created successfully', { update });
  } catch (error) {
    next(error);
  }
};

export const getPerformanceUpdate = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const { id } = req.params;
    const update = await getPerformanceUpdateById(managerId, id);
    return sendSuccess(res, 200, 'Performance update retrieved successfully', { update });
  } catch (error) {
    next(error);
  }
};

export const updatePerformanceUpdateEndpoint = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const { id } = req.params;
    const updateData = req.body;
    const update = await updatePerformanceUpdate(managerId, id, updateData);
    
    logUserAction(req, 'update', 'PerformanceUpdate', id, {
      action: 'update_performance_update'
    });

    return sendSuccess(res, 200, 'Performance update updated successfully', { update });
  } catch (error) {
    next(error);
  }
};

