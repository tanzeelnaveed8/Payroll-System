import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import User from '../models/User.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import { 
  ResourceNotFoundError, 
  InvalidInputError, 
  AccessDeniedError 
} from '../utils/errorHandler.js';
import { sendSuccess, sendPaginated } from '../utils/responseHandler.js';
import { buildSort, buildPagination, addSearchToQuery } from '../utils/queryBuilder.js';
import { logUserAction } from '../utils/auditLogger.js';
import {
  calculateTotalDays,
  getOrCreateLeaveBalance,
  calculateLeaveBalance,
  checkLeaveAvailability,
  updateLeaveBalance,
  revertLeaveBalance,
  checkOverlappingRequests
} from '../services/leaveBalanceService.js';
import mongoose from 'mongoose';

/**
 * Denormalize employee info into leave request
 */
const denormalizeEmployeeInfo = async (leaveRequest) => {
  const employee = await User.findById(leaveRequest.employeeId);
  if (employee) {
    leaveRequest.employeeName = employee.name;
    leaveRequest.employeeEmail = employee.email;
    leaveRequest.employeeDepartment = employee.department;
    leaveRequest.employeeRole = employee.role;
    await leaveRequest.save();
  }
  return leaveRequest;
};

/**
 * GET /api/leave/requests - List leave requests with filters
 */
export const getLeaveRequests = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'submittedDate', 
      order = 'desc',
      search,
      employeeName,
      department,
      leaveType,
      dateFrom,
      dateTo,
      status
    } = req.query;
    
    const pagination = buildPagination(page, limit);
    const sortObj = buildSort(sort, order);
    
    let query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (employeeName) query.employeeName = { $regex: employeeName, $options: 'i' };
    if (department) query.employeeDepartment = { $regex: department, $options: 'i' };
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.$or = [
        { startDate: { $gte: new Date(dateFrom || '1970-01-01'), $lte: new Date(dateTo || '2099-12-31') } },
        { endDate: { $gte: new Date(dateFrom || '1970-01-01'), $lte: new Date(dateTo || '2099-12-31') } }
      ];
    }
    
    // Role-based access control
    if (req.user.role === 'employee') {
      // Employees can only see their own requests
      query.employeeId = req.user._id;
    } else if (req.user.role === 'dept_lead') {
      // Dept leads can only see leave requests from their department employees
      try {
        const deptLead = await User.findById(req.user._id).select('department').lean();
        if (deptLead?.department) {
          // Get all employees in the same department
          const departmentEmployees = await User.find({
            department: deptLead.department,
            status: { $in: ['active', 'on-leave'] }
          }).select('_id').lean();
          
          const deptEmployeeIds = departmentEmployees.map(emp => emp._id);
          deptEmployeeIds.push(req.user._id); // Include dept_lead's own requests
          
          query.employeeId = { $in: deptEmployeeIds };
        } else {
          // If no department, only see own requests
          query.employeeId = req.user._id;
        }
      } catch (err) {
        console.error('[getLeaveRequests] Error fetching department employees for dept_lead:', err);
        query.employeeId = req.user._id; // Fallback to own requests
      }
    } else if (req.user.role === 'manager') {
      // Managers can see their direct reports' requests
      const directReports = await User.find({
        $or: [
          { managerId: req.user._id },
          { reportsTo: req.user._id }
        ],
        status: { $in: ['active', 'on-leave'] }
      }).select('_id');
      const reportIds = directReports.map(u => u._id);
      reportIds.push(req.user._id); // Include their own
      query.employeeId = { $in: reportIds };
    }
    // Admin can see all requests (no filter needed)
    
    // Add search
    if (search) {
      addSearchToQuery(query, search, ['employeeName', 'employeeDepartment', 'reason']);
    }
    
    const [requests, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate('employeeId', 'name email employeeId department')
        .populate('reviewedBy', 'name email')
        .sort(sortObj)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .exec(),
      LeaveRequest.countDocuments(query).exec()
    ]);
    
    return sendPaginated(res, 200, 'Leave requests retrieved successfully', requests || [], {
      page: pagination.page,
      limit: pagination.limit,
      total: total || 0,
      totalPages: Math.ceil((total || 0) / pagination.limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/leave/requests/:id - Get leave request by ID
 */
export const getLeaveRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new InvalidInputError('Invalid leave request ID format'));
    }
    
    const request = await LeaveRequest.findById(id)
      .populate('employeeId', 'name email employeeId department')
      .populate('reviewedBy', 'name email')
      .lean();
    
    if (!request) {
      return next(new ResourceNotFoundError('Leave request'));
    }
    
    // Role-based access control
    const employeeId = request.employeeId?._id || request.employeeId;
    const employeeIdStr = employeeId?.toString() || employeeId;
    
    if (req.user.role === 'employee' && employeeIdStr !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own leave requests'));
    }
    
    if (req.user.role === 'manager') {
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const isManager = employee.managerId?.toString() === req.user._id.toString() || 
                       employee.reportsTo?.toString() === req.user._id.toString();
      if (!isManager && employeeIdStr !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only view leave requests for your direct reports'));
      }
    } else if (req.user.role === 'dept_lead') {
      // Dept_lead can view leave requests for employees in their department
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const deptLead = await User.findById(req.user._id).select('department departmentId').lean();
      if (!deptLead) {
        return next(new ResourceNotFoundError('Department Lead'));
      }
      
      // Check if employee is in dept_lead's department
      const sameDepartment = 
        (deptLead.departmentId && employee.departmentId && 
         deptLead.departmentId.toString() === employee.departmentId.toString()) ||
        (deptLead.department && employee.department && 
         deptLead.department === employee.department);
      
      if (!sameDepartment && employeeIdStr !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only view leave requests for employees in your department'));
      }
    }
    
    return sendSuccess(res, 200, 'Leave request retrieved successfully', { request });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/leave/requests - Create leave request
 */
export const createLeaveRequest = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    
    const employee = await User.findById(req.user._id);
    if (!employee) {
      return next(new ResourceNotFoundError('Employee'));
    }
    
    // Get working days from settings
    const settings = await Setting.findOne({ type: 'company' });
    const workingDays = settings?.company?.workingDays || null;
    
    // Calculate total days
    const totalDays = calculateTotalDays(startDate, endDate, workingDays);
    
    if (totalDays <= 0) {
      return next(new InvalidInputError('Invalid date range: no working days in the selected period'));
    }
    
    // Check for overlapping requests
    const overlapping = await checkOverlappingRequests(req.user._id, startDate, endDate);
    if (overlapping.length > 0) {
      return next(new InvalidInputError('You have an overlapping leave request for this period'));
    }
    
    // Check leave availability
    const availability = await checkLeaveAvailability(req.user._id, leaveType, totalDays);
    if (!availability.available && leaveType !== 'unpaid') {
      return next(new InvalidInputError(
        `Insufficient leave balance. Available: ${availability.remaining} days, Requested: ${totalDays} days`
      ));
    }
    
    // Get current balance
    const year = new Date(startDate).getFullYear();
    const balance = await getOrCreateLeaveBalance(req.user._id, year);
    
    // Create leave request
    const leaveRequest = new LeaveRequest({
      employeeId: req.user._id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDays,
      reason,
      status: 'pending',
      submittedDate: new Date(),
      leaveBalanceBefore: {
        paid: balance.paid?.remaining || 0,
        unpaid: balance.unpaid?.remaining || 0,
        sick: balance.sick?.remaining || 0,
        annual: balance.annual?.remaining || 0
      }
    });
    
    await leaveRequest.save();
    await denormalizeEmployeeInfo(leaveRequest);
    
    // Create notification for manager (if exists)
    const manager = await User.findById(employee.managerId || employee.reportsTo);
    if (manager) {
      await Notification.create({
        userId: manager._id,
        type: 'leave_submitted',
        title: 'Leave Request Submitted',
        message: `${employee.name} has submitted a ${leaveType} leave request for ${totalDays} day(s)`,
        relatedEntityType: 'leave',
        relatedEntityId: leaveRequest._id,
        priority: 'medium',
        actionUrl: `/manager/approvals`,
        actionLabel: 'Review Leave Request'
      });
    }
    
    // Notify all admins
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        type: 'leave_submitted',
        title: 'Leave Request Submitted',
        message: `${employee.name} has submitted a ${leaveType} leave request for ${totalDays} day(s)`,
        relatedEntityType: 'leave',
        relatedEntityId: leaveRequest._id,
        priority: 'medium',
        actionUrl: `/admin/leave`,
        actionLabel: 'Review Leave Request'
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
        type: 'leave_submitted',
        title: 'Leave Request Submitted',
        message: `${employee.name} has submitted a ${leaveType} leave request for ${totalDays} day(s)`,
        relatedEntityType: 'leave',
        relatedEntityId: leaveRequest._id,
        priority: 'medium',
        actionUrl: `/dept_lead/leave`,
        actionLabel: 'Review Leave Request'
      });
    }
    
    logUserAction(req.user._id, 'create', 'LeaveRequest', leaveRequest._id, {
      leaveType,
      totalDays,
      startDate,
      endDate
    });
    
    return sendSuccess(res, 201, 'Leave request created successfully', { request: leaveRequest });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/leave/requests/:id - Update leave request
 */
export const updateLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, leaveType, reason } = req.body;
    
    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      return next(new ResourceNotFoundError('Leave request'));
    }
    
    // Role-based access control
    if (req.user.role === 'employee') {
      if (leaveRequest.employeeId.toString() !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only update your own leave requests'));
      }
      if (leaveRequest.status !== 'pending') {
        return next(new InvalidInputError('You can only update pending leave requests'));
      }
    } else if (req.user.role === 'manager') {
      const employee = await User.findById(leaveRequest.employeeId);
      const isManager = employee.managerId?.toString() === req.user._id.toString() || 
                       employee.reportsTo?.toString() === req.user._id.toString();
      if (!isManager && leaveRequest.employeeId.toString() !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only update leave requests for your direct reports'));
      }
      if (leaveRequest.status === 'approved' || leaveRequest.status === 'rejected') {
        return next(new InvalidInputError('Cannot update approved or rejected leave requests'));
      }
    }
    
    // Get working days from settings
    const settings = await Setting.findOne({ type: 'company' });
    const workingDays = settings?.company?.workingDays || null;
    
    // Update fields
    let totalDays = leaveRequest.totalDays;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : leaveRequest.startDate;
      const end = endDate ? new Date(endDate) : leaveRequest.endDate;
      totalDays = calculateTotalDays(start, end, workingDays);
      
      if (totalDays <= 0) {
        return next(new InvalidInputError('Invalid date range: no working days in the selected period'));
      }
      
      // Check for overlapping requests (excluding current)
      const overlapping = await checkOverlappingRequests(leaveRequest.employeeId, start, end, id);
      if (overlapping.length > 0) {
        return next(new InvalidInputError('You have an overlapping leave request for this period'));
      }
      
      if (startDate) leaveRequest.startDate = new Date(startDate);
      if (endDate) leaveRequest.endDate = new Date(endDate);
      leaveRequest.totalDays = totalDays;
    }
    
    if (leaveType) {
      // If leave type changed and request was approved, need to revert and re-check
      if (leaveRequest.status === 'approved' && leaveType !== leaveRequest.leaveType) {
        // Revert old balance
        await revertLeaveBalance(leaveRequest.employeeId, leaveRequest.leaveType, leaveRequest.totalDays);
        // Check new balance
        const availability = await checkLeaveAvailability(leaveRequest.employeeId, leaveType, totalDays);
        if (!availability.available && leaveType !== 'unpaid') {
          return next(new InvalidInputError(
            `Insufficient leave balance for ${leaveType} leave. Available: ${availability.remaining} days`
          ));
        }
      }
      leaveRequest.leaveType = leaveType;
    }
    
    if (reason !== undefined) leaveRequest.reason = reason;
    
    await leaveRequest.save();
    await denormalizeEmployeeInfo(leaveRequest);
    
    logUserAction(req.user._id, 'update', 'LeaveRequest', leaveRequest._id, {
      changes: req.body
    });
    
    return sendSuccess(res, 200, 'Leave request updated successfully', { request: leaveRequest });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/leave/requests/:id/approve - Approve leave request
 */
export const approveLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    
    const leaveRequest = await LeaveRequest.findById(id).populate('employeeId');
    if (!leaveRequest) {
      return next(new ResourceNotFoundError('Leave request'));
    }
    
    if (leaveRequest.status !== 'pending') {
      return next(new InvalidInputError(`Cannot approve leave request with status: ${leaveRequest.status}`));
    }
    
    // Verify approver has permission
    const employee = leaveRequest.employeeId;
    const isManager = req.user.role === 'manager';
    const isAdmin = req.user.role === 'admin';
    const isDeptLead = req.user.role === 'dept_lead';
    
    if (!isManager && !isAdmin && !isDeptLead) {
      return next(new AccessDeniedError('You do not have permission to approve this leave request'));
    }
    
    // For dept_lead, verify the employee is in their department
    if (isDeptLead) {
      const deptLead = await User.findById(req.user._id).select('department departmentId').lean();
      if (!deptLead) {
        return next(new AccessDeniedError('Department lead not found'));
      }
      
      const employeeUser = await User.findById(employee._id).select('department departmentId').lean();
      if (!employeeUser) {
        return next(new AccessDeniedError('Employee not found'));
      }
      
      // Check if employee is in dept_lead's department
      const sameDepartment = 
        (deptLead.departmentId && employeeUser.departmentId && 
         deptLead.departmentId.toString() === employeeUser.departmentId.toString()) ||
        (deptLead.department && employeeUser.department && 
         deptLead.department === employeeUser.department);
      
      if (!sameDepartment) {
        return next(new AccessDeniedError('You can only approve leave requests for employees in your department'));
      }
    }
    
    // Double-check availability (in case balance changed)
    const availability = await checkLeaveAvailability(
      leaveRequest.employeeId._id, 
      leaveRequest.leaveType, 
      leaveRequest.totalDays
    );
    if (!availability.available && leaveRequest.leaveType !== 'unpaid') {
      return next(new InvalidInputError(
        `Insufficient leave balance. Available: ${availability.remaining} days, Requested: ${leaveRequest.totalDays} days`
      ));
    }
    
    // Update leave balance
    const year = new Date(leaveRequest.startDate).getFullYear();
    const balance = await updateLeaveBalance(
      leaveRequest.employeeId._id, 
      leaveRequest.leaveType, 
      leaveRequest.totalDays,
      year
    );
    
    // Update leave request
    leaveRequest.status = 'approved';
    leaveRequest.reviewedBy = req.user._id;
    leaveRequest.reviewedDate = new Date();
    if (comments) leaveRequest.comments = comments;
    
    // Store balance after (calculate remaining = total - used)
    const calculateRemaining = (balanceObj) => {
      if (!balanceObj) return 0;
      const total = balanceObj.total || 0;
      const used = balanceObj.used || 0;
      return Math.max(0, total - used);
    };
    
    leaveRequest.leaveBalanceAfter = {
      paid: calculateRemaining(balance.paid),
      unpaid: calculateRemaining(balance.unpaid),
      sick: calculateRemaining(balance.sick),
      annual: calculateRemaining(balance.annual)
    };
    
    await leaveRequest.save();
    
    // Create notification for employee
    await Notification.create({
      userId: leaveRequest.employeeId._id,
      type: 'leave_approved',
      title: 'Leave Request Approved',
      message: `Your ${leaveRequest.leaveType} leave request for ${leaveRequest.totalDays} day(s) has been approved`,
      relatedEntityType: 'leave',
      relatedEntityId: leaveRequest._id,
      priority: 'low',
      actionUrl: `/employee/leave/${leaveRequest._id}`,
      actionLabel: 'View Leave Request'
    });
    
    logUserAction(req.user._id, 'approve', 'LeaveRequest', leaveRequest._id, {
      employeeId: leaveRequest.employeeId._id,
      leaveType: leaveRequest.leaveType,
      totalDays: leaveRequest.totalDays
    });
    
    return sendSuccess(res, 200, 'Leave request approved successfully', { request: leaveRequest });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/leave/requests/:id/reject - Reject leave request
 */
export const rejectLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    
    if (!comments || comments.trim().length === 0) {
      return next(new InvalidInputError('Rejection reason is required'));
    }
    
    const leaveRequest = await LeaveRequest.findById(id).populate('employeeId');
    if (!leaveRequest) {
      return next(new ResourceNotFoundError('Leave request'));
    }
    
    if (leaveRequest.status !== 'pending') {
      return next(new InvalidInputError(`Cannot reject leave request with status: ${leaveRequest.status}`));
    }
    
    // Verify rejector has permission
    const employee = leaveRequest.employeeId;
    const isManager = req.user.role === 'manager';
    const isAdmin = req.user.role === 'admin';
    const isDeptLead = req.user.role === 'dept_lead';
    
    if (!isManager && !isAdmin && !isDeptLead) {
      return next(new AccessDeniedError('You do not have permission to reject this leave request'));
    }
    
    // For dept_lead, verify the employee is in their department
    if (isDeptLead) {
      const deptLead = await User.findById(req.user._id).select('department departmentId').lean();
      if (!deptLead) {
        return next(new AccessDeniedError('Department lead not found'));
      }
      
      const employeeUser = await User.findById(employee._id).select('department departmentId').lean();
      if (!employeeUser) {
        return next(new AccessDeniedError('Employee not found'));
      }
      
      // Check if employee is in dept_lead's department
      const sameDepartment = 
        (deptLead.departmentId && employeeUser.departmentId && 
         deptLead.departmentId.toString() === employeeUser.departmentId.toString()) ||
        (deptLead.department && employeeUser.department && 
         deptLead.department === employeeUser.department);
      
      if (!sameDepartment) {
        return next(new AccessDeniedError('You can only reject leave requests for employees in your department'));
      }
    }
    
    // Update leave request
    leaveRequest.status = 'rejected';
    leaveRequest.reviewedBy = req.user._id;
    leaveRequest.reviewedDate = new Date();
    leaveRequest.comments = comments;
    
    await leaveRequest.save();
    
    // Create notification for employee
    await Notification.create({
      userId: leaveRequest.employeeId._id,
      type: 'leave_rejected',
      title: 'Leave Request Rejected',
      message: `Your ${leaveRequest.leaveType} leave request for ${leaveRequest.totalDays} day(s) has been rejected. Reason: ${comments}`,
      relatedEntityType: 'leave',
      relatedEntityId: leaveRequest._id,
      priority: 'high',
      actionUrl: `/employee/leave/${leaveRequest._id}`,
      actionLabel: 'View Leave Request'
    });
    
    logUserAction(req.user._id, 'reject', 'LeaveRequest', leaveRequest._id, {
      employeeId: leaveRequest.employeeId._id,
      reason: comments
    });
    
    return sendSuccess(res, 200, 'Leave request rejected successfully', { request: leaveRequest });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/leave/requests/bulk/approve - Bulk approve leave requests
 */
export const bulkApproveLeaveRequests = async (req, res, next) => {
  try {
    const { requestIds, ids, comments } = req.body;
    const requestIdArray = requestIds || ids;
    
    if (!requestIdArray || !Array.isArray(requestIdArray) || requestIdArray.length === 0) {
      return next(new InvalidInputError('Request IDs are required'));
    }
    
    const requests = await LeaveRequest.find({ 
      _id: { $in: requestIdArray },
      status: 'pending'
    }).populate('employeeId');
    
    if (requests.length === 0) {
      return next(new InvalidInputError('No pending leave requests found'));
    }
    
    const approved = [];
    const failed = [];
    
    for (const request of requests) {
      try {
        // Verify permission
        const employee = request.employeeId;
        const isManager = req.user.role === 'manager';
        const isAdmin = req.user.role === 'admin';
        const isDeptLead = req.user.role === 'dept_lead';
        
        if (!isManager && !isAdmin && !isDeptLead) {
          failed.push({ id: request._id, reason: 'No permission' });
          continue;
        }
        
        // For dept_lead, verify the employee is in their department
        if (isDeptLead) {
          const deptLead = await User.findById(req.user._id).select('department departmentId').lean();
          const employeeUser = await User.findById(employee._id).select('department departmentId').lean();
          
          if (!deptLead || !employeeUser) {
            failed.push({ id: request._id, reason: 'Department validation failed' });
            continue;
          }
          
          // Check if employee is in dept_lead's department
          const sameDepartment = 
            (deptLead.departmentId && employeeUser.departmentId && 
             deptLead.departmentId.toString() === employeeUser.departmentId.toString()) ||
            (deptLead.department && employeeUser.department && 
             deptLead.department === employeeUser.department);
          
          if (!sameDepartment) {
            failed.push({ id: request._id, reason: 'Employee not in your department' });
            continue;
          }
        }
        
        // Check availability
        const availability = await checkLeaveAvailability(
          request.employeeId._id, 
          request.leaveType, 
          request.totalDays
        );
        if (!availability.available && request.leaveType !== 'unpaid') {
          failed.push({ id: request._id, reason: 'Insufficient balance' });
          continue;
        }
        
        // Update balance
        const year = new Date(request.startDate).getFullYear();
        const balance = await updateLeaveBalance(
          request.employeeId._id, 
          request.leaveType, 
          request.totalDays,
          year
        );
        
        // Update request
        request.status = 'approved';
        request.reviewedBy = req.user._id;
        request.reviewedDate = new Date();
        if (comments) request.comments = comments;
        
        // Store balance after (calculate remaining = total - used)
        const calculateRemaining = (balanceObj) => {
          if (!balanceObj) return 0;
          const total = balanceObj.total || 0;
          const used = balanceObj.used || 0;
          return Math.max(0, total - used);
        };
        
        request.leaveBalanceAfter = {
          paid: calculateRemaining(balance.paid),
          unpaid: calculateRemaining(balance.unpaid),
          sick: calculateRemaining(balance.sick),
          annual: calculateRemaining(balance.annual)
        };
        await request.save();
        
        // Notify employee
        await Notification.create({
          userId: request.employeeId._id,
          type: 'leave_approved',
          title: 'Leave Request Approved',
          message: `Your ${request.leaveType} leave request for ${request.totalDays} day(s) has been approved`,
          relatedEntityType: 'leave',
          relatedEntityId: request._id,
          priority: 'low',
          actionUrl: `/employee/leave/${request._id}`,
          actionLabel: 'View Leave Request'
        });
        
        approved.push(request._id);
      } catch (error) {
        failed.push({ id: request._id, reason: error.message });
      }
    }
    
    logUserAction(req.user._id, 'bulk_approve', 'LeaveRequest', null, {
      total: requests.length,
      approved: approved.length,
      failed: failed.length
    });
    
    return sendSuccess(res, 200, 'Bulk approval completed', {
      approved: approved.length,
      failed: failed.length,
      approvedIds: approved,
      failedRequests: failed
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/leave/requests/bulk/reject - Bulk reject leave requests
 */
export const bulkRejectLeaveRequests = async (req, res, next) => {
  try {
    const { requestIds, ids, comments } = req.body;
    const requestIdArray = requestIds || ids;
    
    if (!requestIdArray || !Array.isArray(requestIdArray) || requestIdArray.length === 0) {
      return next(new InvalidInputError('Request IDs are required'));
    }
    
    if (!comments || comments.trim().length === 0) {
      return next(new InvalidInputError('Rejection reason is required'));
    }
    
    const requests = await LeaveRequest.find({ 
      _id: { $in: requestIdArray },
      status: 'pending'
    }).populate('employeeId');
    
    if (requests.length === 0) {
      return next(new InvalidInputError('No pending leave requests found'));
    }
    
    const rejected = [];
    const failed = [];
    
    for (const request of requests) {
      try {
        // Verify permission
        const employee = request.employeeId;
        const isManager = req.user.role === 'manager';
        const isAdmin = req.user.role === 'admin';
        const isDeptLead = req.user.role === 'dept_lead';
        
        if (!isManager && !isAdmin && !isDeptLead) {
          failed.push({ id: request._id, reason: 'No permission' });
          continue;
        }
        
        // For dept_lead, verify the employee is in their department
        if (isDeptLead) {
          const deptLead = await User.findById(req.user._id).select('department departmentId').lean();
          const employeeUser = await User.findById(employee._id).select('department departmentId').lean();
          
          if (!deptLead || !employeeUser) {
            failed.push({ id: request._id, reason: 'Department validation failed' });
            continue;
          }
          
          // Check if employee is in dept_lead's department
          const sameDepartment = 
            (deptLead.departmentId && employeeUser.departmentId && 
             deptLead.departmentId.toString() === employeeUser.departmentId.toString()) ||
            (deptLead.department && employeeUser.department && 
             deptLead.department === employeeUser.department);
          
          if (!sameDepartment) {
            failed.push({ id: request._id, reason: 'Employee not in your department' });
            continue;
          }
        }
        
        // Update request
        request.status = 'rejected';
        request.reviewedBy = req.user._id;
        request.reviewedDate = new Date();
        request.comments = comments;
        await request.save();
        
        // Notify employee
        await Notification.create({
          userId: request.employeeId._id,
          type: 'leave_rejected',
          title: 'Leave Request Rejected',
          message: `Your ${request.leaveType} leave request for ${request.totalDays} day(s) has been rejected. Reason: ${comments}`,
          relatedEntityType: 'leave',
          relatedEntityId: request._id,
          priority: 'high',
          actionUrl: `/employee/leave/${request._id}`,
          actionLabel: 'View Leave Request'
        });
        
        rejected.push(request._id);
      } catch (error) {
        failed.push({ id: request._id, reason: error.message });
      }
    }
    
    logUserAction(req.user._id, 'bulk_reject', 'LeaveRequest', null, {
      total: requests.length,
      rejected: rejected.length,
      failed: failed.length
    });
    
    return sendSuccess(res, 200, 'Bulk rejection completed', {
      rejected: rejected.length,
      failed: failed.length,
      rejectedIds: rejected,
      failedRequests: failed
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/leave/balances - Get all leave balances (admin only)
 */
export const getAllLeaveBalances = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, year } = req.query;
    
    const pagination = buildPagination(page, limit);
    const queryYear = year ? parseInt(year) : new Date().getFullYear();
    
    const query = { year: queryYear };
    
    const [balances, total] = await Promise.all([
      LeaveBalance.find(query)
        .populate('employeeId', 'name email employeeId department')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .exec(),
      LeaveBalance.countDocuments(query).exec()
    ]);
    
    return sendPaginated(res, 200, 'Leave balances retrieved successfully', balances || [], {
      page: pagination.page,
      limit: pagination.limit,
      total: total || 0,
      totalPages: Math.ceil((total || 0) / pagination.limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/leave/balances/:employeeId - Get employee leave balance
 */
export const getEmployeeLeaveBalance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;
    
    // Role-based access control
    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own leave balance'));
    }
    
    if (req.user.role === 'manager') {
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const isManager = employee.managerId?.toString() === req.user._id.toString() || 
                       employee.reportsTo?.toString() === req.user._id.toString();
      if (!isManager && employeeId !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only view leave balances for your direct reports'));
      }
    } else if (req.user.role === 'dept_lead') {
      // Dept_lead can view leave balances for employees in their department
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const deptLead = await User.findById(req.user._id).select('department departmentId').lean();
      if (!deptLead) {
        return next(new ResourceNotFoundError('Department Lead'));
      }
      
      // Check if employee is in dept_lead's department
      const sameDepartment = 
        (deptLead.departmentId && employee.departmentId && 
         deptLead.departmentId.toString() === employee.departmentId.toString()) ||
        (deptLead.department && employee.department && 
         deptLead.department === employee.department);
      
      if (!sameDepartment && employeeId !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only view leave balances for employees in your department'));
      }
    }
    
    const queryYear = year ? parseInt(year) : new Date().getFullYear();
    const balance = await getOrCreateLeaveBalance(employeeId, queryYear);
    
    return sendSuccess(res, 200, 'Leave balance retrieved successfully', { balance });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/leave/balances/:employeeId/:year - Get year-specific balance
 */
export const getYearSpecificBalance = async (req, res, next) => {
  try {
    const { employeeId, year } = req.params;
    
    // Role-based access control
    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own leave balance'));
    }
    
    if (req.user.role === 'manager') {
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const isManager = employee.managerId?.toString() === req.user._id.toString() || 
                       employee.reportsTo?.toString() === req.user._id.toString();
      if (!isManager && employeeId !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only view leave balances for your direct reports'));
      }
    } else if (req.user.role === 'dept_lead') {
      // Dept_lead can view leave balances for employees in their department
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const deptLead = await User.findById(req.user._id).select('department departmentId').lean();
      if (!deptLead) {
        return next(new ResourceNotFoundError('Department Lead'));
      }
      
      // Check if employee is in dept_lead's department
      const sameDepartment = 
        (deptLead.departmentId && employee.departmentId && 
         deptLead.departmentId.toString() === employee.departmentId.toString()) ||
        (deptLead.department && employee.department && 
         deptLead.department === employee.department);
      
      if (!sameDepartment && employeeId !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only view leave balances for employees in your department'));
      }
    }
    
    const queryYear = parseInt(year);
    if (isNaN(queryYear) || queryYear < 2000 || queryYear > 2100) {
      return next(new InvalidInputError('Invalid year'));
    }
    
    const balance = await getOrCreateLeaveBalance(employeeId, queryYear);
    
    return sendSuccess(res, 200, 'Leave balance retrieved successfully', { balance });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/leave/requests/employee/:employeeId - Get employee's leave requests
 */
export const getEmployeeLeaveRequests = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 10, status, leaveType, dateFrom, dateTo } = req.query;
    
    // Role-based access control
    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own leave requests'));
    }
    
    if (req.user.role === 'manager') {
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const isManager = employee.managerId?.toString() === req.user._id.toString() || 
                       employee.reportsTo?.toString() === req.user._id.toString();
      if (!isManager && employeeId !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only view leave requests for your direct reports'));
      }
    } else if (req.user.role === 'dept_lead') {
      // Dept_lead can view leave requests for employees in their department
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const deptLead = await User.findById(req.user._id).select('department departmentId').lean();
      if (!deptLead) {
        return next(new ResourceNotFoundError('Department Lead'));
      }
      
      // Check if employee is in dept_lead's department
      const sameDepartment = 
        (deptLead.departmentId && employee.departmentId && 
         deptLead.departmentId.toString() === employee.departmentId.toString()) ||
        (deptLead.department && employee.department && 
         deptLead.department === employee.department);
      
      if (!sameDepartment && employeeId !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only view leave requests for employees in your department'));
      }
    }
    
    const pagination = buildPagination(page, limit);
    
    const query = { employeeId: new mongoose.Types.ObjectId(employeeId) };
    
    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    
    if (dateFrom || dateTo) {
      query.$or = [
        { startDate: { $gte: new Date(dateFrom || '1970-01-01'), $lte: new Date(dateTo || '2099-12-31') } },
        { endDate: { $gte: new Date(dateFrom || '1970-01-01'), $lte: new Date(dateTo || '2099-12-31') } }
      ];
    }
    
    const [requests, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate('reviewedBy', 'name email')
        .sort({ submittedDate: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .exec(),
      LeaveRequest.countDocuments(query).exec()
    ]);
    
    return sendPaginated(res, 200, 'Employee leave requests retrieved successfully', requests || [], {
      page: pagination.page,
      limit: pagination.limit,
      total: total || 0,
      totalPages: Math.ceil((total || 0) / pagination.limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/leave/departments - Get unique departments from leave requests
 */
export const getUniqueDepartments = async (req, res, next) => {
  try {
    const departments = await LeaveRequest.distinct('employeeDepartment', {
      employeeDepartment: { $exists: true, $ne: null, $ne: '' }
    }).exec();
    
    // Also get departments from User model as fallback
    const userDepartments = await User.distinct('department', {
      department: { $exists: true, $ne: null, $ne: '' }
    }).exec();
    
    // Combine and deduplicate
    const allDepartments = [...new Set([...departments, ...userDepartments])].filter(Boolean);
    
    return sendSuccess(res, 200, 'Departments retrieved successfully', { 
      departments: allDepartments || [] 
    });
  } catch (error) {
    next(error);
  }
};

