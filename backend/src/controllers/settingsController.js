import Setting from '../models/Setting.js';
import {
  getSettings,
  updateSettings,
  getTimezoneList,
} from '../services/settingsService.js';
import {
  ResourceNotFoundError,
  InvalidInputError,
} from '../utils/errorHandler.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { logUserAction } from '../utils/auditLogger.js';

/**
 * GET /api/settings - Get all settings
 */
export const getAllSettings = async (req, res, next) => {
  try {
    const settings = await getSettings();
    
    // Skip audit logging for GET requests - 'read' is not a valid action enum
    // Only log create, update, delete, approve, reject, login, logout, export

    return sendSuccess(res, 200, 'Settings retrieved successfully', { settings });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/settings/:type - Get settings by type
 */
export const getSettingsByType = async (req, res, next) => {
  try {
    const { type } = req.params;

    if (!['company', 'payroll', 'attendance', 'leave'].includes(type)) {
      return next(new InvalidInputError('Invalid settings type'));
    }

    const settings = await getSettings(type);

    // Skip audit logging for GET requests - 'read' is not a valid action enum

    return sendSuccess(res, 200, 'Settings retrieved successfully', {
      type,
      settings: type === 'leave' ? { leavePolicies: Array.isArray(settings) ? settings : (settings?.leavePolicies || []) } : settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/settings/company - Update company settings
 */
export const updateCompanySettings = async (req, res, next) => {
  try {
    const companyData = req.body;
    
    const settings = await updateSettings('company', companyData, req.user._id);

    logUserAction(req, 'update', 'Settings', settings._id, {
      action: 'update_company_settings',
      type: 'company',
    });

    const populatedSettings = await Setting.findById(settings._id)
      .populate('updatedBy', 'name email')
      .lean()
      .exec();

    return sendSuccess(res, 200, 'Company settings updated successfully', {
      settings: populatedSettings.company,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/settings/payroll - Update payroll settings
 */
export const updatePayrollSettings = async (req, res, next) => {
  try {
    const payrollData = req.body;
    
    const settings = await updateSettings('payroll', payrollData, req.user._id);

    logUserAction(req, 'update', 'Settings', settings._id, {
      action: 'update_payroll_settings',
      type: 'payroll',
    });

    const populatedSettings = await Setting.findById(settings._id)
      .populate('updatedBy', 'name email')
      .lean()
      .exec();

    return sendSuccess(res, 200, 'Payroll settings updated successfully', {
      settings: populatedSettings.payroll,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/settings/attendance - Update attendance rules
 */
export const updateAttendanceSettings = async (req, res, next) => {
  try {
    const attendanceData = req.body;
    
    const settings = await updateSettings('attendance', attendanceData, req.user._id);

    logUserAction(req, 'update', 'Settings', settings._id, {
      action: 'update_attendance_settings',
      type: 'attendance',
    });

    const populatedSettings = await Setting.findById(settings._id)
      .populate('updatedBy', 'name email')
      .lean()
      .exec();

    return sendSuccess(res, 200, 'Attendance settings updated successfully', {
      settings: populatedSettings.attendance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/settings/leave-policies - Update leave policies
 */
export const updateLeavePolicies = async (req, res, next) => {
  try {
    const { leavePolicies } = req.body;

    if (!Array.isArray(leavePolicies)) {
      return next(new InvalidInputError('Leave policies must be an array'));
    }

    const settings = await updateSettings('leave', { leavePolicies }, req.user._id);

    logUserAction(req, 'update', 'Settings', settings._id, {
      action: 'update_leave_policies',
      type: 'leave',
      policyCount: leavePolicies.length,
    });

    const populatedSettings = await Setting.findById(settings._id)
      .populate('updatedBy', 'name email')
      .lean()
      .exec();

    return sendSuccess(res, 200, 'Leave policies updated successfully', {
      leavePolicies: populatedSettings.leavePolicies || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/settings/timezones - Get timezone list
 */
export const getTimezones = async (req, res, next) => {
  try {
    const timezones = getTimezoneList();

    return sendSuccess(res, 200, 'Timezones retrieved successfully', { timezones });
  } catch (error) {
    next(error);
  }
};

