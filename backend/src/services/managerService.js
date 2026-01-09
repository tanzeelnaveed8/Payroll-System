import User from '../models/User.js';
import Timesheet from '../models/Timesheet.js';
import LeaveRequest from '../models/LeaveRequest.js';
import PerformanceUpdate from '../models/PerformanceUpdate.js';
import { ResourceNotFoundError, InvalidInputError, AccessDeniedError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

export const getDirectReports = async (managerId) => {
  const reports = await User.find({ 
    $or: [
      { managerId: managerId },
      { reportsTo: managerId }
    ],
    role: 'employee',
    status: { $in: ['active', 'on-leave'] }
  })
    .select('name email employeeId department position status managerId reportsTo')
    .sort({ name: 1 })
    .lean();
  return reports;
};

export const getDashboardData = async (managerId) => {
  const directReports = await getDirectReports(managerId);
  const reportIds = directReports.map(r => r._id);

  const [pendingTimesheets, pendingLeaveRequests] = await Promise.all([
    Timesheet.countDocuments({
      employeeId: { $in: reportIds },
      status: 'pending'
    }),
    LeaveRequest.countDocuments({
      employeeId: { $in: reportIds },
      status: 'pending'
    })
  ]);

  return {
    teamMembers: directReports.length,
    directReports: directReports.length,
    pendingApprovals: pendingTimesheets + pendingLeaveRequests,
    timesheetsSubmitted: pendingTimesheets,
    leaveRequestsPending: pendingLeaveRequests
  };
};

export const getTeamMemberDetails = async (managerId, employeeId) => {
  const employee = await User.findOne({
    _id: employeeId,
    role: 'employee'
  }).lean();

  if (!employee) {
    throw new ResourceNotFoundError('Team member');
  }

  return employee;
};

export const getPendingApprovals = async (managerId) => {
  const directReports = await getDirectReports(managerId);
  const reportIds = directReports.map(r => r._id);

  const [timesheets, leaveRequests] = await Promise.all([
    Timesheet.countDocuments({
      employeeId: { $in: reportIds },
      status: 'pending'
    }),
    LeaveRequest.countDocuments({
      employeeId: { $in: reportIds },
      status: 'pending'
    })
  ]);

  return {
    timesheets,
    leaveRequests,
    total: timesheets + leaveRequests
  };
};

export const getPendingTimesheets = async (managerId, pagination = {}) => {
  const directReports = await getDirectReports(managerId);
  const reportIds = directReports.map(r => r._id);

  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const [timesheets, total] = await Promise.all([
    Timesheet.find({
      employeeId: { $in: reportIds },
      status: 'pending'
    })
      .populate('employeeId', 'name email employeeId')
      .populate('payrollPeriodId', 'periodStart periodEnd')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Timesheet.countDocuments({
      employeeId: { $in: reportIds },
      status: 'pending'
    })
  ]);

  return {
    timesheets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getPendingLeaveRequests = async (managerId, pagination = {}) => {
  const directReports = await getDirectReports(managerId);
  const reportIds = directReports.map(r => r._id);

  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const [leaveRequests, total] = await Promise.all([
    LeaveRequest.find({
      employeeId: { $in: reportIds },
      status: 'pending'
    })
      .populate('employeeId', 'name email employeeId')
      .sort({ submittedDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LeaveRequest.countDocuments({
      employeeId: { $in: reportIds },
      status: 'pending'
    })
  ]);

  return {
    leaveRequests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getPerformanceUpdates = async (managerId, filters = {}, pagination = {}) => {
  const { employeeId, startDate, endDate } = filters;
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const directReports = await getDirectReports(managerId);
  const reportIds = directReports.map(r => r._id);

  const query = { managerId };

  if (employeeId) {
    if (!reportIds.some(id => id.toString() === employeeId.toString())) {
      throw new AccessDeniedError('You can only view performance updates for your direct reports');
    }
    query.employeeId = employeeId;
  } else {
    query.employeeId = { $in: reportIds };
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const [updates, total] = await Promise.all([
    PerformanceUpdate.find(query)
      .populate('employeeId', 'name email employeeId department')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PerformanceUpdate.countDocuments(query)
  ]);

  return {
    updates,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const createPerformanceUpdate = async (managerId, updateData) => {
  const employee = await User.findOne({
    _id: updateData.employeeId,
    role: 'employee'
  });

  if (!employee) {
    throw new ResourceNotFoundError('Employee');
  }

  const performanceUpdate = new PerformanceUpdate({
    ...updateData,
    managerId,
    employeeName: employee.name,
    employeeDepartment: employee.department?.name || employee.department
  });

  await performanceUpdate.save();
  return performanceUpdate.toObject();
};

export const getPerformanceUpdateById = async (managerId, updateId) => {
  const update = await PerformanceUpdate.findById(updateId)
    .populate('employeeId', 'name email employeeId department')
    .lean();

  if (!update) {
    throw new ResourceNotFoundError('Performance update');
  }

  if (update.managerId.toString() !== managerId.toString()) {
    throw new AccessDeniedError('You can only access your own performance updates');
  }

  return update;
};

export const updatePerformanceUpdate = async (managerId, updateId, updateData) => {
  const update = await PerformanceUpdate.findById(updateId);

  if (!update) {
    throw new ResourceNotFoundError('Performance update');
  }

  if (update.managerId.toString() !== managerId.toString()) {
    throw new AccessDeniedError('You can only update your own performance updates');
  }

  Object.keys(updateData).forEach(key => {
    if (key !== '_id' && key !== 'managerId' && key !== 'employeeId') {
      update[key] = updateData[key];
    }
  });

  await update.save();
  return update.toObject();
};

export const getTeamPerformance = async (managerId) => {
  const directReports = await getDirectReports(managerId);
  const reportIds = directReports.map(r => r._id);

  const updates = await PerformanceUpdate.find({
    managerId,
    employeeId: { $in: reportIds }
  })
    .sort({ date: -1 })
    .limit(100)
    .lean();

  const avgRating = updates.length > 0
    ? updates.reduce((sum, u) => sum + u.rating, 0) / updates.length
    : 0;

  const ratingDistribution = {
    5: updates.filter(u => u.rating === 5).length,
    4: updates.filter(u => u.rating === 4).length,
    3: updates.filter(u => u.rating === 3).length,
    2: updates.filter(u => u.rating === 2).length,
    1: updates.filter(u => u.rating === 1).length
  };

  return {
    totalUpdates: updates.length,
    averageRating: Math.round(avgRating * 10) / 10,
    ratingDistribution,
    teamMembers: directReports.length
  };
};

