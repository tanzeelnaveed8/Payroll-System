import Timesheet from '../models/Timesheet.js';
import User from '../models/User.js';
import PayrollPeriod from '../models/PayrollPeriod.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import { ResourceNotFoundError, InvalidInputError } from '../utils/errorHandler.js';

/**
 * Calculate regular vs overtime hours based on settings
 */
export const calculateHours = async (employee, hours, date, excludeTimesheetId = null) => {
  const settings = await Setting.findOne({ type: 'attendance' });
  const weeklyThreshold = settings?.attendance?.weeklyWorkingHours || 40;
  const dailyThreshold = settings?.attendance?.dailyWorkingHours || 8;
  
  // Get employee's timesheets for the week containing this date
  const timesheetDate = date instanceof Date ? date : new Date(date);
  const weekStart = new Date(timesheetDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  // Build query to get all timesheets for this week (excluding current entry if updating)
  const query = {
    employeeId: employee._id,
    date: { $gte: weekStart, $lte: weekEnd },
    status: { $in: ['approved', 'submitted'] }
  };
  
  if (excludeTimesheetId) {
    query._id = { $ne: excludeTimesheetId };
  }
  
  const weekTimesheets = await Timesheet.find(query);
  
  // Calculate total hours for the week
  const totalWeekHours = weekTimesheets.reduce((sum, ts) => sum + (ts.hours || 0), 0);
  
  const currentWeekHours = totalWeekHours + hours;
  
  let regularHours = hours;
  let overtimeHours = 0;
  
  // Check if weekly threshold exceeded
  if (currentWeekHours > weeklyThreshold) {
    const excessHours = currentWeekHours - weeklyThreshold;
    if (totalWeekHours < weeklyThreshold) {
      // Some regular, some overtime
      regularHours = weeklyThreshold - totalWeekHours;
      overtimeHours = hours - regularHours;
    } else {
      // All overtime
      regularHours = 0;
      overtimeHours = hours;
    }
  } else {
    // Check daily threshold
    if (hours > dailyThreshold) {
      regularHours = dailyThreshold;
      overtimeHours = hours - dailyThreshold;
    }
  }
  
  return {
    regularHours: Math.max(0, regularHours),
    overtimeHours: Math.max(0, overtimeHours)
  };
};

/**
 * Validate timesheet business rules
 */
export const validateTimesheet = async (timesheetData, employee) => {
  const errors = [];
  
  // Validate hours (0-24)
  if (timesheetData.hours === undefined || timesheetData.hours === null) {
    errors.push('Hours are required');
  } else if (isNaN(timesheetData.hours)) {
    errors.push('Hours must be a valid number');
  } else if (timesheetData.hours < 0 || timesheetData.hours > 24) {
    errors.push('Hours must be between 0 and 24');
  }
  
  // Validate date
  if (!timesheetData.date) {
    errors.push('Date is required');
  } else {
    const timesheetDate = new Date(timesheetData.date);
    
    // Check if date is valid
    if (isNaN(timesheetDate.getTime())) {
      errors.push('Invalid date format');
    } else {
      // Normalize date to start of day for comparison
      const normalizedDate = new Date(timesheetDate);
      normalizedDate.setHours(0, 0, 0, 0);
      
      // Validate date is not in the future
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (normalizedDate > today) {
        errors.push('Cannot create timesheet for future dates');
      }
      
      // Check for duplicate timesheet for same employee and date
      // Use date range query to match any time on that day
      const startOfDay = new Date(normalizedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(normalizedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const existing = await Timesheet.findOne({
        employeeId: employee._id,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        _id: { $ne: timesheetData._id || null }
      });
      
      if (existing) {
        errors.push(`Timesheet already exists for ${normalizedDate.toLocaleDateString()}`);
      }
      
      // Validate payroll period if provided
      if (timesheetData.payrollPeriodId) {
        const period = await PayrollPeriod.findById(timesheetData.payrollPeriodId);
        if (!period) {
          errors.push('Invalid payroll period');
        } else {
          const periodStart = new Date(period.periodStart);
          periodStart.setHours(0, 0, 0, 0);
          const periodEnd = new Date(period.periodEnd);
          periodEnd.setHours(23, 59, 59, 999);
          
          if (normalizedDate < periodStart || normalizedDate > periodEnd) {
            errors.push(`Timesheet date must be within the payroll period (${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()})`);
          }
        }
      }
    }
  }
  
  if (errors.length > 0) {
    const errorMessage = errors.length === 1 
      ? errors[0] 
      : `Validation failed: ${errors.join('; ')}`;
    throw new InvalidInputError(errorMessage, errors);
  }
  
  return true;
};

/**
 * Submit timesheet for approval
 */
export const submitTimesheet = async (timesheetId, employee) => {
  const timesheet = await Timesheet.findById(timesheetId);
  
  if (!timesheet) {
    throw new ResourceNotFoundError('Timesheet not found');
  }
  
  if (timesheet.employeeId.toString() !== employee._id.toString()) {
    throw new InvalidInputError('You can only submit your own timesheets');
  }
  
  if (timesheet.status !== 'draft') {
    throw new InvalidInputError(`Cannot submit timesheet with status: ${timesheet.status}`);
  }
  
  // Calculate hours before submission
  const calculatedHours = await calculateHours(employee, timesheet.hours, timesheet.date);
  timesheet.regularHours = calculatedHours.regularHours;
  timesheet.overtimeHours = calculatedHours.overtimeHours;
  timesheet.status = 'submitted';
  timesheet.submittedAt = new Date();
  
  await timesheet.save();
  
  // Create notification for manager (if exists)
  const manager = await User.findById(employee.managerId || employee.reportsTo);
  if (manager) {
    await Notification.create({
      userId: manager._id,
      type: 'approval_required',
      title: 'Timesheet Submission',
      message: `${employee.name} has submitted a timesheet for ${new Date(timesheet.date).toLocaleDateString()}`,
      relatedEntityType: 'timesheet',
      relatedEntityId: timesheet._id,
      priority: 'medium',
      actionUrl: `/manager/approvals`,
      actionLabel: 'Review Timesheet'
    });
  }
  
  // Also notify all admins about the submission
  const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');
  for (const admin of admins) {
    await Notification.create({
      userId: admin._id,
      type: 'approval_required',
      title: 'Timesheet Submission',
      message: `${employee.name} has submitted a timesheet for ${new Date(timesheet.date).toLocaleDateString()}`,
      relatedEntityType: 'timesheet',
      relatedEntityId: timesheet._id,
      priority: 'medium',
      actionUrl: `/admin/timesheets`,
      actionLabel: 'Review Timesheet'
    });
  }
  
  // Notify department lead if employee has one
  const deptLead = await User.findOne({ 
    role: 'dept_lead', 
    department: employee.department,
    status: 'active' 
  }).select('_id');
  if (deptLead && deptLead._id.toString() !== manager?._id?.toString()) {
    await Notification.create({
      userId: deptLead._id,
      type: 'approval_required',
      title: 'Timesheet Submission',
      message: `${employee.name} has submitted a timesheet for ${new Date(timesheet.date).toLocaleDateString()}`,
      relatedEntityType: 'timesheet',
      relatedEntityId: timesheet._id,
      priority: 'medium',
      actionUrl: `/dept_lead/timesheets`,
      actionLabel: 'Review Timesheet'
    });
  }
  
  return timesheet;
};

/**
 * Approve timesheet
 */
export const approveTimesheet = async (timesheetId, approver, comments) => {
  const timesheet = await Timesheet.findById(timesheetId).populate('employeeId');
  
  if (!timesheet) {
    throw new ResourceNotFoundError('Timesheet not found');
  }
  
  if (timesheet.status !== 'submitted') {
    throw new InvalidInputError(`Cannot approve timesheet with status: ${timesheet.status}`);
  }
  
  // Verify approver has permission
  const employee = timesheet.employeeId;
  const isManager = approver.role === 'manager';
  const isAdmin = approver.role === 'admin';
  const isDeptLead = approver.role === 'dept_lead';
  
  if (!isManager && !isAdmin && !isDeptLead) {
    throw new InvalidInputError('You do not have permission to approve this timesheet');
  }
  
  // For dept_lead, verify the employee is in their department
  if (isDeptLead) {
    const deptLead = await User.findById(approver._id).select('department departmentId').lean();
    if (!deptLead) {
      throw new InvalidInputError('Department lead not found');
    }
    
    const employeeUser = await User.findById(employee._id).select('department departmentId').lean();
    if (!employeeUser) {
      throw new InvalidInputError('Employee not found');
    }
    
    // Check if employee is in dept_lead's department
    const sameDepartment = 
      (deptLead.departmentId && employeeUser.departmentId && 
       deptLead.departmentId.toString() === employeeUser.departmentId.toString()) ||
      (deptLead.department && employeeUser.department && 
       deptLead.department === employeeUser.department);
    
    if (!sameDepartment) {
      throw new InvalidInputError('You can only approve timesheets for employees in your department');
    }
  }
  
  // Recalculate hours to ensure accuracy
  const calculatedHours = await calculateHours(employee, timesheet.hours, timesheet.date);
  timesheet.regularHours = calculatedHours.regularHours;
  timesheet.overtimeHours = calculatedHours.overtimeHours;
  timesheet.status = 'approved';
  timesheet.approvedBy = approver._id;
  timesheet.approvedAt = new Date();
  if (comments) {
    timesheet.comments = comments;
  }
  
  await timesheet.save();
  
  // Create notification for employee
  await Notification.create({
    userId: employee._id,
    type: 'timesheet_approved',
    title: 'Timesheet Approved',
    message: `Your timesheet for ${new Date(timesheet.date).toLocaleDateString()} has been approved`,
    relatedEntityType: 'timesheet',
    relatedEntityId: timesheet._id,
    priority: 'low',
    actionUrl: `/employee/timesheets/${timesheet._id}`,
    actionLabel: 'View Timesheet'
  });
  
  return timesheet;
};

/**
 * Reject timesheet with reason
 */
export const rejectTimesheet = async (timesheetId, rejector, reason) => {
  const timesheet = await Timesheet.findById(timesheetId).populate('employeeId');
  
  if (!timesheet) {
    throw new ResourceNotFoundError('Timesheet not found');
  }
  
  if (timesheet.status !== 'submitted') {
    throw new InvalidInputError(`Cannot reject timesheet with status: ${timesheet.status}`);
  }
  
  // Verify rejector has permission
  const employee = timesheet.employeeId;
  const isManager = rejector.role === 'manager';
  const isAdmin = rejector.role === 'admin';
  const isDeptLead = rejector.role === 'dept_lead';
  
  if (!isManager && !isAdmin && !isDeptLead) {
    throw new InvalidInputError('You do not have permission to reject this timesheet');
  }
  
  // For dept_lead, verify the employee is in their department
  if (isDeptLead) {
    const deptLead = await User.findById(rejector._id).select('department departmentId').lean();
    if (!deptLead) {
      throw new InvalidInputError('Department lead not found');
    }
    
    const employeeUser = await User.findById(employee._id).select('department departmentId').lean();
    if (!employeeUser) {
      throw new InvalidInputError('Employee not found');
    }
    
    // Check if employee is in dept_lead's department
    const sameDepartment = 
      (deptLead.departmentId && employeeUser.departmentId && 
       deptLead.departmentId.toString() === employeeUser.departmentId.toString()) ||
      (deptLead.department && employeeUser.department && 
       deptLead.department === employeeUser.department);
    
    if (!sameDepartment) {
      throw new InvalidInputError('You can only reject timesheets for employees in your department');
    }
  }
  
  if (!reason || reason.trim().length === 0) {
    throw new InvalidInputError('Rejection reason is required');
  }
  
  timesheet.status = 'rejected';
  timesheet.rejectedBy = rejector._id;
  timesheet.rejectedAt = new Date();
  timesheet.comments = reason;
  
  await timesheet.save();
  
  // Create notification for employee
  await Notification.create({
    userId: employee._id,
    type: 'timesheet_rejected',
    title: 'Timesheet Rejected',
    message: `Your timesheet for ${new Date(timesheet.date).toLocaleDateString()} has been rejected. Reason: ${reason}`,
    relatedEntityType: 'timesheet',
    relatedEntityId: timesheet._id,
    priority: 'high',
    actionUrl: `/employee/timesheets/${timesheet._id}`,
    actionLabel: 'View Timesheet'
  });
  
  return timesheet;
};

/**
 * Denormalize employee info into timesheet
 */
export const denormalizeEmployeeInfo = async (timesheet) => {
  const employee = await User.findById(timesheet.employeeId).populate('departmentId');
  
  if (employee) {
    timesheet.employeeName = employee.name;
    timesheet.department = employee.department || (employee.departmentId?.name || '');
    timesheet.role = employee.role;
    await timesheet.save();
  }
  
  return timesheet;
};

