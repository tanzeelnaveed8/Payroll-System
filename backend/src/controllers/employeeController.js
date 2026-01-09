import {
  getDashboardData,
  getCurrentTimesheet,
  submitTimesheet,
  getPaystubs,
  getPaystubById,
  getLeaveBalance,
  getLeaveRequests,
  createLeaveRequest
} from '../services/employeeService.js';
import { sendSuccess, sendPaginated } from '../utils/responseHandler.js';
import { createPagination } from '../utils/responseHandler.js';
import { logUserAction } from '../utils/auditLogger.js';

export const getDashboard = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const data = await getDashboardData(employeeId);
    return sendSuccess(res, 200, 'Dashboard data retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getCurrentTimesheetEndpoint = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const data = await getCurrentTimesheet(employeeId);
    return sendSuccess(res, 200, 'Current timesheet retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const submitTimesheetEndpoint = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const { timesheetIds } = req.body;
    const result = await submitTimesheet(employeeId, timesheetIds);
    
    logUserAction(req, 'update', 'Timesheet', timesheetIds, {
      action: 'submit_timesheet',
      count: result.submittedCount
    });

    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const getPaystubsList = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const pagination = createPagination(page, limit);
    const result = await getPaystubs(employeeId, pagination);
    return sendPaginated(res, 'Paystubs retrieved successfully', result.paystubs, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getPaystub = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const { id } = req.params;
    const paystub = await getPaystubById(employeeId, id);
    return sendSuccess(res, 200, 'Paystub retrieved successfully', { paystub });
  } catch (error) {
    next(error);
  }
};

export const getLeaveBalanceEndpoint = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const balance = await getLeaveBalance(employeeId);
    return sendSuccess(res, 200, 'Leave balance retrieved successfully', balance);
  } catch (error) {
    next(error);
  }
};

export const getLeaveRequestsList = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const pagination = createPagination(page, limit);
    const result = await getLeaveRequests(employeeId, pagination);
    return sendPaginated(res, 'Leave requests retrieved successfully', result.leaveRequests, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const createLeaveRequestEndpoint = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const leaveData = req.body;
    const leaveRequest = await createLeaveRequest(employeeId, leaveData);
    
    logUserAction(req, 'create', 'LeaveRequest', leaveRequest._id, {
      action: 'create_leave_request',
      leaveType: leaveRequest.leaveType,
      totalDays: leaveRequest.totalDays
    });

    return sendSuccess(res, 201, 'Leave request created successfully', { leaveRequest });
  } catch (error) {
    next(error);
  }
};

