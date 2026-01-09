import User from '../models/User.js';
import Timesheet from '../models/Timesheet.js';
import PayStub from '../models/PayStub.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import PayrollPeriod from '../models/PayrollPeriod.js';
import Notification from '../models/Notification.js';
import { ResourceNotFoundError, InvalidInputError, AccessDeniedError } from '../utils/errorHandler.js';
import {
  calculateTotalDays,
  checkLeaveAvailability,
  checkOverlappingRequests,
  getOrCreateLeaveBalance,
  updateLeaveBalance,
  calculateLeaveBalance
} from './leaveBalanceService.js';
import { optimizedFind, optimizedFindOne } from '../utils/queryOptimizer.js';
import mongoose from 'mongoose';

export const getDashboardData = async (employeeId) => {
  const employee = await User.findById(employeeId);
  if (!employee) {
    throw new ResourceNotFoundError('Employee');
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const [weeklyTimesheets, latestPaystub, leaveBalance, upcomingLeaves, currentPeriod] = await Promise.all([
    optimizedFind(Timesheet, {
      employeeId,
      date: { $gte: startOfWeek, $lte: endOfWeek }
    }, {
      sort: { date: 1 },
      lean: true
    }),
    optimizedFindOne(PayStub, { employeeId }, {
      sort: { payDate: -1 },
      lean: true
    }),
    optimizedFindOne(LeaveBalance, { employeeId, year: currentYear }, {
      lean: true
    }),
    optimizedFind(LeaveRequest, {
      employeeId,
      status: 'approved',
      startDate: { $gte: now }
    }, {
      sort: { startDate: 1 },
      limit: 5,
      lean: true
    }),
    optimizedFindOne(PayrollPeriod, {
      periodStart: { $lte: now },
      periodEnd: { $gte: now },
      status: { $in: ['draft', 'processing'] }
    }, {
      sort: { periodStart: -1 },
      lean: true
    })
  ]);

  const weeklyHours = weeklyTimesheets.reduce((sum, ts) => sum + (ts.hours || 0), 0);
  const weeklyRegularHours = weeklyTimesheets.reduce((sum, ts) => sum + (ts.regularHours || 0), 0);
  const weeklyOvertimeHours = weeklyTimesheets.reduce((sum, ts) => sum + (ts.overtimeHours || 0), 0);

  const totalHoursThisMonth = await Timesheet.aggregate([
    {
      $match: {
        employeeId: new mongoose.Types.ObjectId(employeeId),
        date: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        },
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$hours' }
      }
    }
  ]);

  const hoursLogged = totalHoursThisMonth.length > 0 ? totalHoursThisMonth[0].total : 0;

  let availableLeave = 0;
  if (leaveBalance) {
    availableLeave = (leaveBalance.annual?.remaining || 0) + 
                     (leaveBalance.sick?.remaining || 0) + 
                     (leaveBalance.casual?.remaining || 0);
  }

  const nextPayday = currentPeriod ? currentPeriod.payDate : null;

  return {
    kpis: {
      hoursLogged: Math.round(hoursLogged * 10) / 10,
      availableLeave: Math.round(availableLeave * 10) / 10,
      latestPay: latestPaystub ? latestPaystub.netPay : 0,
      nextPayday: nextPayday ? nextPayday.toISOString() : null
    },
    weeklyTimesheet: {
      hours: Math.round(weeklyHours * 10) / 10,
      regularHours: Math.round(weeklyRegularHours * 10) / 10,
      overtimeHours: Math.round(weeklyOvertimeHours * 10) / 10,
      entries: weeklyTimesheets.map(ts => ({
        date: ts.date,
        day: ts.day,
        hours: ts.hours,
        status: ts.status,
        clockIn: ts.clockIn,
        clockOut: ts.clockOut
      }))
    },
    latestPaystub: latestPaystub ? {
      id: latestPaystub._id,
      payDate: latestPaystub.payDate,
      grossPay: latestPaystub.grossPay,
      netPay: latestPaystub.netPay,
      status: latestPaystub.status,
      payPeriodStart: latestPaystub.payPeriodStart,
      payPeriodEnd: latestPaystub.payPeriodEnd
    } : null,
    leaveOverview: {
      balance: leaveBalance ? {
        annual: {
          total: leaveBalance.annual?.total || 0,
          used: leaveBalance.annual?.used || 0,
          remaining: leaveBalance.annual?.remaining || 0
        },
        sick: {
          total: leaveBalance.sick?.total || 0,
          used: leaveBalance.sick?.used || 0,
          remaining: leaveBalance.sick?.remaining || 0
        },
        casual: {
          total: leaveBalance.casual?.total || 0,
          used: leaveBalance.casual?.used || 0,
          remaining: leaveBalance.casual?.remaining || 0
        }
      } : null,
      upcomingLeaves: upcomingLeaves.map(lr => ({
        id: lr._id,
        leaveType: lr.leaveType,
        startDate: lr.startDate,
        endDate: lr.endDate,
        totalDays: lr.totalDays
      }))
    }
  };
};

export const getCurrentTimesheet = async (employeeId) => {
  const now = new Date();
  const currentPeriod = await PayrollPeriod.findOne({
    periodStart: { $lte: now },
    periodEnd: { $gte: now },
    status: { $in: ['draft', 'processing'] }
  })
    .sort({ periodStart: -1 })
    .lean();

  if (!currentPeriod) {
    return {
      period: null,
      timesheets: [],
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      status: 'no_period'
    };
  }

  const timesheets = await Timesheet.find({
    employeeId,
    payrollPeriodId: currentPeriod._id
  })
    .sort({ date: 1 })
    .lean();

  const totalHours = timesheets.reduce((sum, ts) => sum + (ts.hours || 0), 0);
  const regularHours = timesheets.reduce((sum, ts) => sum + (ts.regularHours || 0), 0);
  const overtimeHours = timesheets.reduce((sum, ts) => sum + (ts.overtimeHours || 0), 0);

  const status = timesheets.length > 0 ? timesheets[0].status : 'draft';

  return {
    period: {
      id: currentPeriod._id,
      periodStart: currentPeriod.periodStart,
      periodEnd: currentPeriod.periodEnd,
      payDate: currentPeriod.payDate
    },
    timesheets: timesheets.map(ts => ({
      id: ts._id,
      date: ts.date,
      day: ts.day,
      hours: ts.hours,
      regularHours: ts.regularHours,
      overtimeHours: ts.overtimeHours,
      clockIn: ts.clockIn,
      clockOut: ts.clockOut,
      status: ts.status,
      comments: ts.comments
    })),
    totalHours: Math.round(totalHours * 10) / 10,
    regularHours: Math.round(regularHours * 10) / 10,
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    status
  };
};

export const submitTimesheet = async (employeeId, timesheetIds) => {
  if (!timesheetIds || timesheetIds.length === 0) {
    throw new InvalidInputError('At least one timesheet entry is required');
  }

  const timesheets = await Timesheet.find({
    _id: { $in: timesheetIds },
    employeeId
  });

  if (timesheets.length === 0) {
    throw new ResourceNotFoundError('Timesheet entries not found');
  }

  if (timesheets.length !== timesheetIds.length) {
    throw new AccessDeniedError('Some timesheet entries do not belong to you');
  }

  const invalidStatus = timesheets.find(ts => ts.status !== 'draft');
  if (invalidStatus) {
    throw new InvalidInputError('Only draft timesheets can be submitted');
  }

  const now = new Date();
  for (const timesheet of timesheets) {
    timesheet.status = 'submitted';
    timesheet.submittedAt = now;
    await timesheet.save();
  }

  return {
    message: 'Timesheet submitted successfully',
    submittedCount: timesheets.length
  };
};

export const getPaystubs = async (employeeId, pagination = {}) => {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const [paystubs, total] = await Promise.all([
    PayStub.find({ employeeId })
      .populate('payrollPeriodId', 'periodStart periodEnd')
      .sort({ payDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PayStub.countDocuments({ employeeId })
  ]);

  return {
    paystubs: paystubs.map(ps => ({
      id: ps._id,
      payDate: ps.payDate,
      payPeriodStart: ps.payPeriodStart,
      payPeriodEnd: ps.payPeriodEnd,
      grossPay: ps.grossPay,
      netPay: ps.netPay,
      status: ps.status,
      pdfUrl: ps.pdfUrl
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getPaystubById = async (employeeId, paystubId) => {
  const paystub = await PayStub.findOne({
    _id: paystubId,
    employeeId
  })
    .populate('payrollPeriodId', 'periodStart periodEnd')
    .lean();

  if (!paystub) {
    throw new ResourceNotFoundError('Paystub');
  }

  return paystub;
};

export const getLeaveBalance = async (employeeId) => {
  const currentYear = new Date().getFullYear();
  const leaveBalance = await LeaveBalance.findOne({ employeeId, year: currentYear }).lean();

  if (!leaveBalance) {
    return {
      year: currentYear,
      annual: { total: 0, used: 0, remaining: 0, accrued: 0, carryForward: 0 },
      sick: { total: 0, used: 0, remaining: 0, accrued: 0, carryForward: 0 },
      casual: { total: 0, used: 0, remaining: 0 },
      paid: { total: 0, used: 0, remaining: 0 },
      unpaid: { total: 0, used: 0, remaining: 0 },
      maternity: { total: 0, used: 0, remaining: 0 },
      paternity: { total: 0, used: 0, remaining: 0 }
    };
  }

  return {
    year: leaveBalance.year,
    annual: {
      total: leaveBalance.annual?.total || 0,
      used: leaveBalance.annual?.used || 0,
      remaining: leaveBalance.annual?.remaining || 0,
      accrued: leaveBalance.annual?.accrued || 0,
      carryForward: leaveBalance.annual?.carryForward || 0
    },
    sick: {
      total: leaveBalance.sick?.total || 0,
      used: leaveBalance.sick?.used || 0,
      remaining: leaveBalance.sick?.remaining || 0,
      accrued: leaveBalance.sick?.accrued || 0,
      carryForward: leaveBalance.sick?.carryForward || 0
    },
    casual: {
      total: leaveBalance.casual?.total || 0,
      used: leaveBalance.casual?.used || 0,
      remaining: leaveBalance.casual?.remaining || 0
    },
    paid: {
      total: leaveBalance.paid?.total || 0,
      used: leaveBalance.paid?.used || 0,
      remaining: leaveBalance.paid?.remaining || 0
    },
    unpaid: {
      total: leaveBalance.unpaid?.total || 0,
      used: leaveBalance.unpaid?.used || 0,
      remaining: leaveBalance.unpaid?.remaining || 0
    },
    maternity: {
      total: leaveBalance.maternity?.total || 0,
      used: leaveBalance.maternity?.used || 0,
      remaining: leaveBalance.maternity?.remaining || 0
    },
    paternity: {
      total: leaveBalance.paternity?.total || 0,
      used: leaveBalance.paternity?.used || 0,
      remaining: leaveBalance.paternity?.remaining || 0
    }
  };
};

export const getLeaveRequests = async (employeeId, pagination = {}) => {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const [leaveRequests, total] = await Promise.all([
    LeaveRequest.find({ employeeId })
      .sort({ submittedDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LeaveRequest.countDocuments({ employeeId })
  ]);

  return {
    leaveRequests: leaveRequests.map(lr => ({
      id: lr._id,
      leaveType: lr.leaveType,
      startDate: lr.startDate,
      endDate: lr.endDate,
      totalDays: lr.totalDays,
      reason: lr.reason,
      status: lr.status,
      submittedDate: lr.submittedDate,
      reviewedDate: lr.reviewedDate,
      comments: lr.comments
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const createLeaveRequest = async (employeeId, leaveData) => {
  const { startDate, endDate, leaveType, reason } = leaveData;

  if (!startDate || !endDate || !leaveType) {
    throw new InvalidInputError('Start date, end date, and leave type are required');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new InvalidInputError('End date must be after start date');
  }

  if (start < new Date()) {
    throw new InvalidInputError('Start date cannot be in the past');
  }

  const employee = await User.findById(employeeId);
  if (!employee) {
    throw new ResourceNotFoundError('Employee');
  }

  const totalDays = calculateTotalDays(start, end);

  const currentYear = new Date().getFullYear();
  const leaveBalance = await getOrCreateLeaveBalance(employeeId, currentYear);

  const availability = await checkLeaveAvailability(employeeId, leaveType, totalDays, currentYear);
  if (!availability.available) {
    throw new InvalidInputError(`Insufficient leave balance. Available: ${availability.remaining} days, Required: ${totalDays} days`);
  }

  const overlapping = await checkOverlappingRequests(employeeId, start, end);
  if (overlapping.length > 0) {
    throw new InvalidInputError('You have an overlapping leave request for this period');
  }

  const balanceBefore = await calculateLeaveBalance(employeeId, leaveType, currentYear);
  
  // Extract remaining balance as numbers for all leave types (schema expects numbers, not objects)
  // Calculate remaining = total - used, ensuring it's never negative
  const calculateRemaining = (balanceObj) => {
    if (!balanceObj) return 0;
    const total = balanceObj.total || 0;
    const used = balanceObj.used || 0;
    return Math.max(0, total - used);
  };
  
  const leaveBalanceBefore = {
    paid: calculateRemaining(leaveBalance.paid),
    unpaid: calculateRemaining(leaveBalance.unpaid),
    sick: calculateRemaining(leaveBalance.sick),
    annual: calculateRemaining(leaveBalance.annual)
  };

  const leaveRequest = new LeaveRequest({
    employeeId,
    leaveType,
    startDate: start,
    endDate: end,
    totalDays,
    reason: reason || '',
    status: 'pending',
    submittedDate: new Date(),
    employeeName: employee.name,
    employeeEmail: employee.email,
    employeeDepartment: employee.department,
    employeeRole: employee.role,
    leaveBalanceBefore
  });

  await leaveRequest.save();

  // Note: Leave balance is NOT updated here - it will be updated when the request is approved
  // The leaveBalanceAfter will be set after approval
  
  // Create notifications for manager and admins
  const manager = await User.findById(employee.managerId || employee.reportsTo);
  if (manager) {
    await Notification.create({
      userId: manager._id,
      type: 'approval_required',
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
      type: 'approval_required',
      title: 'Leave Request Submitted',
      message: `${employee.name} has submitted a ${leaveType} leave request for ${totalDays} day(s)`,
      relatedEntityType: 'leave',
      relatedEntityId: leaveRequest._id,
      priority: 'medium',
      actionUrl: `/admin/leaves`,
      actionLabel: 'Review Leave Request'
    });
  }

  return leaveRequest.toObject();
};

