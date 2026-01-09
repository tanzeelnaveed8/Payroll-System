import Timesheet from '../models/Timesheet.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import PayrollPeriod from '../models/PayrollPeriod.js';
import { 
  ResourceNotFoundError, 
  InvalidInputError, 
  AccessDeniedError 
} from '../utils/errorHandler.js';
import { sendSuccess, sendPaginated } from '../utils/responseHandler.js';
import { buildQuery, buildSort, buildPagination, addSearchToQuery } from '../utils/queryBuilder.js';
import { logUserAction } from '../utils/auditLogger.js';
import {
  calculateHours,
  validateTimesheet,
  submitTimesheet,
  approveTimesheet,
  rejectTimesheet,
  denormalizeEmployeeInfo
} from '../services/timesheetService.js';
import mongoose from 'mongoose';

/**
 * GET /api/timesheets - List timesheets with filters
 */
export const getTimesheets = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'date', 
      order = 'desc', 
      search,
      employeeName,
      department,
      role,
      dateFrom,
      dateTo,
      status,
      employeeId
    } = req.query;
    
    const pagination = buildPagination(page, limit);
    const sortObj = buildSort(sort, order);
    
    let query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (role) query.role = role;
    if (department) query.department = department;
    if (employeeName) query.employeeName = { $regex: employeeName, $options: 'i' };
    if (employeeId) query.employeeId = new mongoose.Types.ObjectId(employeeId);
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.date.$lte = endDate;
      }
    }
    
    // Role-based access control
    if (req.user.role === 'employee') {
      // Employees can only see their own timesheets
      query.employeeId = req.user._id;
    } else if (req.user.role === 'manager') {
      // Managers can see their direct reports' timesheets
      // This includes submitted timesheets that need approval
      const directReports = await User.find({
        $or: [
          { managerId: req.user._id },
          { reportsTo: req.user._id }
        ],
        status: { $in: ['active', 'on-leave'] } // Only active employees
      }).select('_id');
      const reportIds = directReports.map(u => u._id);
      reportIds.push(req.user._id); // Include their own
      query.employeeId = { $in: reportIds };
    }
    // Admin can see all timesheets (no filter needed)
    
    // Add search
    if (search) {
      addSearchToQuery(query, search, ['employeeName', 'department', 'comments']);
    }
    
    const [timesheets, total] = await Promise.all([
      Timesheet.find(query)
        .populate('employeeId', 'name email employeeId')
        .populate('payrollPeriodId', 'periodStart periodEnd')
        .populate('approvedBy', 'name email')
        .populate('rejectedBy', 'name email')
        .sort(sortObj)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Timesheet.countDocuments(query),
    ]);
    
    return sendPaginated(res, 'Timesheets retrieved successfully', timesheets, {
      ...pagination,
      total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/timesheets/:id - Get timesheet by ID
 */
export const getTimesheetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new InvalidInputError('Invalid timesheet ID format'));
    }
    
    const timesheet = await Timesheet.findById(id)
      .populate('employeeId', 'name email employeeId department')
      .populate('payrollPeriodId', 'periodStart periodEnd payDate')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .lean();
    
    if (!timesheet) {
      return next(new ResourceNotFoundError('Timesheet'));
    }
    
    // Role-based access control
    if (req.user.role === 'employee' && timesheet.employeeId._id.toString() !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own timesheets'));
    }
    
    if (req.user.role === 'manager') {
      const employee = await User.findById(timesheet.employeeId._id);
      const isManager = employee.managerId?.toString() === req.user._id.toString() || 
                       employee.reportsTo?.toString() === req.user._id.toString();
      if (!isManager && timesheet.employeeId._id.toString() !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only view timesheets for your direct reports'));
      }
    }
    
    return sendSuccess(res, 200, 'Timesheet retrieved successfully', { timesheet });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/timesheets - Create timesheet entry
 */
export const createTimesheet = async (req, res, next) => {
  try {
    const { date, hours, clockIn, clockOut, payrollPeriodId, comments } = req.body;
    
    // Only employees can create their own timesheets
    if (req.user.role !== 'employee') {
      return next(new AccessDeniedError('Only employees can create timesheets'));
    }
    
    const employee = await User.findById(req.user._id);
    if (!employee) {
      return next(new ResourceNotFoundError('Employee'));
    }
    
    // Validate required fields
    if (!date) {
      return next(new InvalidInputError('Date is required'));
    }
    if (hours === undefined || hours === null) {
      return next(new InvalidInputError('Hours are required'));
    }
    
    // Parse and normalize date
    const timesheetDate = new Date(date);
    if (isNaN(timesheetDate.getTime())) {
      return next(new InvalidInputError('Invalid date format'));
    }
    
    // Normalize date to start of day
    timesheetDate.setHours(0, 0, 0, 0);
    
    // Get day of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[timesheetDate.getDay()];
    
    const timesheetData = {
      employeeId: req.user._id,
      date: timesheetDate,
      day,
      hours: parseFloat(hours) || 0,
      clockIn: clockIn || undefined,
      clockOut: clockOut || undefined,
      payrollPeriodId: payrollPeriodId ? new mongoose.Types.ObjectId(payrollPeriodId) : undefined,
      status: 'draft',
      comments: comments || undefined,
    };
    
    // Validate timesheet business rules
    await validateTimesheet(timesheetData, employee);
    
    // Calculate hours (no exclude ID for new timesheet)
    const calculatedHours = await calculateHours(employee, hours, timesheetDate);
    timesheetData.regularHours = calculatedHours.regularHours;
    timesheetData.overtimeHours = calculatedHours.overtimeHours;
    
    // Denormalize employee info
    timesheetData.employeeName = employee.name;
    timesheetData.department = employee.department || (employee.departmentId?.name || '');
    timesheetData.role = employee.role;
    
    const timesheet = await Timesheet.create(timesheetData);
    
    await logUserAction(req, 'create', 'timesheet', timesheet._id, null, 'Created timesheet entry');
    
    return sendSuccess(res, 201, 'Timesheet created successfully', { timesheet });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/timesheets/:id - Update timesheet
 */
export const updateTimesheet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, hours, clockIn, clockOut, comments } = req.body;
    
    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return next(new ResourceNotFoundError('Timesheet'));
    }
    
    // Role-based access control
    if (req.user.role === 'employee') {
      if (timesheet.employeeId.toString() !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only update your own timesheets'));
      }
      if (timesheet.status !== 'draft') {
        return next(new InvalidInputError('You can only update draft timesheets'));
      }
    } else if (req.user.role === 'manager') {
      // Managers can update submitted timesheets for approval/rejection
      if (timesheet.status === 'approved' || timesheet.status === 'rejected') {
        return next(new InvalidInputError('Cannot update approved or rejected timesheets'));
      }
      const employee = await User.findById(timesheet.employeeId);
      const isManager = employee.managerId?.toString() === req.user._id.toString() || 
                       employee.reportsTo?.toString() === req.user._id.toString();
      if (!isManager) {
        return next(new AccessDeniedError('You can only update timesheets for your direct reports'));
      }
    }
    
    const employee = await User.findById(timesheet.employeeId);
    
    // Update fields
    if (date !== undefined) {
      const timesheetDate = new Date(date);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      timesheet.date = timesheetDate;
      timesheet.day = days[timesheetDate.getDay()];
    }
    if (hours !== undefined) {
      timesheet.hours = hours;
      // Recalculate hours (exclude current timesheet ID)
      const calculatedHours = await calculateHours(employee, hours, timesheet.date, timesheet._id);
      timesheet.regularHours = calculatedHours.regularHours;
      timesheet.overtimeHours = calculatedHours.overtimeHours;
    }
    if (clockIn !== undefined) timesheet.clockIn = clockIn;
    if (clockOut !== undefined) timesheet.clockOut = clockOut;
    if (comments !== undefined) timesheet.comments = comments;
    
    // Validate updated timesheet
    await validateTimesheet(timesheet, employee);
    
    // Update denormalized info if needed
    await denormalizeEmployeeInfo(timesheet);
    
    await timesheet.save();
    
    await logUserAction(req, 'update', 'timesheet', timesheet._id, { updated: Object.keys(req.body) }, 'Updated timesheet');
    
    return sendSuccess(res, 200, 'Timesheet updated successfully', { timesheet });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/timesheets/:id/submit - Submit timesheet for approval
 */
export const submitTimesheetForApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const employee = await User.findById(req.user._id);
    if (!employee) {
      return next(new ResourceNotFoundError('Employee'));
    }
    
    const timesheet = await submitTimesheet(id, employee);
    
    await logUserAction(req, 'submit', 'timesheet', timesheet._id, null, 'Submitted timesheet for approval');
    
    return sendSuccess(res, 200, 'Timesheet submitted successfully', { timesheet });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/timesheets/:id/approve - Approve timesheet
 */
export const approveTimesheetEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    
    const timesheet = await approveTimesheet(id, req.user, comments);
    
    await logUserAction(req, 'approve', 'timesheet', timesheet._id, null, 'Approved timesheet');
    
    return sendSuccess(res, 200, 'Timesheet approved successfully', { timesheet });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/timesheets/:id/reject - Reject timesheet
 */
export const rejectTimesheetEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return next(new InvalidInputError('Rejection reason is required'));
    }
    
    const timesheet = await rejectTimesheet(id, req.user, reason);
    
    await logUserAction(req, 'reject', 'timesheet', timesheet._id, { reason }, 'Rejected timesheet');
    
    return sendSuccess(res, 200, 'Timesheet rejected successfully', { timesheet });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/timesheets/bulk/approve - Bulk approve timesheets
 */
export const bulkApproveTimesheets = async (req, res, next) => {
  try {
    const { timesheetIds, comments } = req.body;
    
    if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return next(new InvalidInputError('Timesheet IDs are required'));
    }
    
    const timesheets = await Timesheet.find({
      _id: { $in: timesheetIds },
      status: 'submitted'
    }).populate('employeeId');
    
    if (timesheets.length === 0) {
      return next(new InvalidInputError('No submitted timesheets found'));
    }
    
    const approved = [];
    const failed = [];
    
    for (const timesheet of timesheets) {
      try {
        const employee = timesheet.employeeId;
        const isManager = req.user.role === 'manager' && 
          (employee.managerId?.toString() === req.user._id.toString() || 
           employee.reportsTo?.toString() === req.user._id.toString());
        const isAdmin = req.user.role === 'admin';
        
        if (isManager || isAdmin) {
          await approveTimesheet(timesheet._id.toString(), req.user, comments);
          approved.push(timesheet._id);
        } else {
          failed.push({ id: timesheet._id, reason: 'No permission' });
        }
      } catch (error) {
        failed.push({ id: timesheet._id, reason: error.message });
      }
    }
    
    await logUserAction(req, 'bulk_approve', 'timesheet', null, { count: approved.length }, `Bulk approved ${approved.length} timesheets`);
    
    return sendSuccess(res, 200, 'Bulk approval completed', { 
      approved: approved.length,
      failed: failed.length,
      approvedIds: approved,
      failedDetails: failed
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/timesheets/bulk/reject - Bulk reject timesheets
 */
export const bulkRejectTimesheets = async (req, res, next) => {
  try {
    const { timesheetIds, reason } = req.body;
    
    if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return next(new InvalidInputError('Timesheet IDs are required'));
    }
    
    if (!reason || reason.trim().length === 0) {
      return next(new InvalidInputError('Rejection reason is required'));
    }
    
    const timesheets = await Timesheet.find({
      _id: { $in: timesheetIds },
      status: 'submitted'
    }).populate('employeeId');
    
    if (timesheets.length === 0) {
      return next(new InvalidInputError('No submitted timesheets found'));
    }
    
    const rejected = [];
    const failed = [];
    
    for (const timesheet of timesheets) {
      try {
        const employee = timesheet.employeeId;
        const isManager = req.user.role === 'manager' && 
          (employee.managerId?.toString() === req.user._id.toString() || 
           employee.reportsTo?.toString() === req.user._id.toString());
        const isAdmin = req.user.role === 'admin';
        
        if (isManager || isAdmin) {
          await rejectTimesheet(timesheet._id.toString(), req.user, reason);
          rejected.push(timesheet._id);
        } else {
          failed.push({ id: timesheet._id, reason: 'No permission' });
        }
      } catch (error) {
        failed.push({ id: timesheet._id, reason: error.message });
      }
    }
    
    await logUserAction(req, 'bulk_reject', 'timesheet', null, { count: rejected.length, reason }, `Bulk rejected ${rejected.length} timesheets`);
    
    return sendSuccess(res, 200, 'Bulk rejection completed', { 
      rejected: rejected.length,
      failed: failed.length,
      rejectedIds: rejected,
      failedDetails: failed
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/timesheets/employee/:employeeId - Get employee's timesheets
 */
export const getEmployeeTimesheets = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 10, sort = 'date', order = 'desc', dateFrom, dateTo, status } = req.query;
    
    // Role-based access control
    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own timesheets'));
    }
    
    if (req.user.role === 'manager') {
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const isManager = employee.managerId?.toString() === req.user._id.toString() || 
                       employee.reportsTo?.toString() === req.user._id.toString();
      if (!isManager && employeeId !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only view timesheets for your direct reports'));
      }
    }
    
    const pagination = buildPagination(page, limit);
    const sortObj = buildSort(sort, order);
    
    const query = { employeeId: new mongoose.Types.ObjectId(employeeId) };
    
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.date.$lte = endDate;
      }
    }
    
    const [timesheets, total] = await Promise.all([
      Timesheet.find(query)
        .populate('payrollPeriodId', 'periodStart periodEnd payDate')
        .populate('approvedBy', 'name email')
        .populate('rejectedBy', 'name email')
        .sort(sortObj)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Timesheet.countDocuments(query),
    ]);
    
    return sendPaginated(res, 'Employee timesheets retrieved successfully', timesheets, {
      ...pagination,
      total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/timesheets/employee/:employeeId/period/:periodId - Get period timesheet
 */
export const getEmployeePeriodTimesheet = async (req, res, next) => {
  try {
    const { employeeId, periodId } = req.params;
    
    // Role-based access control
    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own timesheets'));
    }
    
    if (req.user.role === 'manager') {
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const isManager = employee.managerId?.toString() === req.user._id.toString() || 
                       employee.reportsTo?.toString() === req.user._id.toString();
      if (!isManager && employeeId !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only view timesheets for your direct reports'));
      }
    }
    
    const period = await PayrollPeriod.findById(periodId);
    if (!period) {
      return next(new ResourceNotFoundError('Payroll period'));
    }
    
    const timesheets = await Timesheet.find({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      payrollPeriodId: new mongoose.Types.ObjectId(periodId)
    })
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .sort({ date: 1 })
      .lean();
    
    return sendSuccess(res, 200, 'Period timesheets retrieved successfully', { 
      period,
      timesheets 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/timesheets/departments - Get unique departments
 */
export const getUniqueDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ status: 'active' })
      .select('name')
      .sort({ name: 1 })
      .lean();
    
    const departmentNames = departments.map(d => d.name).filter(Boolean);
    
    return sendSuccess(res, 200, 'Departments retrieved successfully', { departments: departmentNames });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/timesheets/roles - Get unique roles
 */
export const getUniqueRoles = async (req, res, next) => {
  try {
    const roles = ['admin', 'manager', 'employee'];
    
    return sendSuccess(res, 200, 'Roles retrieved successfully', { roles });
  } catch (error) {
    next(error);
  }
};

