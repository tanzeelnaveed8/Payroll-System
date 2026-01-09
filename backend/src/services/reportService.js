import Report from '../models/Report.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import PayStub from '../models/PayStub.js';
import PayrollPeriod from '../models/PayrollPeriod.js';
import Timesheet from '../models/Timesheet.js';
import LeaveRequest from '../models/LeaveRequest.js';
import FileAttachment from '../models/FileAttachment.js';
import { ResourceNotFoundError, InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

/**
 * Generate payroll summary report
 */
export const generatePayrollSummary = async (dateFrom, dateTo, departmentId = null) => {
  const query = {
    payDate: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
    status: 'paid',
  };

  if (departmentId) {
    const users = await User.find({ departmentId: new mongoose.Types.ObjectId(departmentId) }).select('_id');
    query.employeeId = { $in: users.map(u => u._id) };
  }

  const paystubs = await PayStub.find(query).lean();
  const totalPayroll = paystubs.reduce((sum, ps) => sum + (ps.netPay || 0), 0);
  const totalGross = paystubs.reduce((sum, ps) => sum + (ps.grossPay || 0), 0);
  const totalDeductions = paystubs.reduce((sum, ps) => sum + (ps.totalDeductions || 0), 0);
  const totalTaxes = paystubs.reduce((sum, ps) => sum + (ps.totalTaxes || 0), 0);

  const uniqueEmployees = new Set(paystubs.map(ps => ps.employeeId?.toString()));
  const employeeCount = uniqueEmployees.size;

  return {
    totalPayroll,
    totalGross,
    totalDeductions,
    totalTaxes,
    employeeCount,
    paystubCount: paystubs.length,
    averagePay: employeeCount > 0 ? totalPayroll / employeeCount : 0,
    period: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
  };
};

/**
 * Generate attendance overview report
 */
export const generateAttendanceOverview = async (dateFrom, dateTo, departmentId = null) => {
  const query = {
    date: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
  };

  if (departmentId) {
    const users = await User.find({ departmentId: new mongoose.Types.ObjectId(departmentId) }).select('_id');
    query.employeeId = { $in: users.map(u => u._id) };
  }

  const timesheets = await Timesheet.find(query).lean();
  const totalDays = timesheets.length;
  const presentDays = timesheets.filter(t => t.status === 'approved' && t.hours > 0).length;
  const absentDays = totalDays - presentDays;
  const totalHours = timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);
  const regularHours = timesheets.reduce((sum, t) => sum + (t.regularHours || 0), 0);
  const overtimeHours = timesheets.reduce((sum, t) => sum + (t.overtimeHours || 0), 0);
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  return {
    totalDays,
    presentDays,
    absentDays,
    totalHours,
    regularHours,
    overtimeHours,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
  };
};

/**
 * Generate leave analytics report
 */
export const generateLeaveAnalytics = async (dateFrom, dateTo, departmentId = null) => {
  const query = {
    $or: [
      { startDate: { $lte: new Date(dateTo) }, endDate: { $gte: new Date(dateFrom) } },
    ],
  };

  if (departmentId) {
    const users = await User.find({ departmentId: new mongoose.Types.ObjectId(departmentId) }).select('_id');
    query.employeeId = { $in: users.map(u => u._id) };
  }

  const leaveRequests = await LeaveRequest.find(query).lean();
  const totalLeaves = leaveRequests.length;
  const approvedLeaves = leaveRequests.filter(lr => lr.status === 'approved').length;
  const pendingLeaves = leaveRequests.filter(lr => lr.status === 'pending').length;
  const rejectedLeaves = leaveRequests.filter(lr => lr.status === 'rejected').length;
  const totalDays = leaveRequests.reduce((sum, lr) => sum + (lr.totalDays || 0), 0);

  const leaveTypeMap = new Map();
  leaveRequests.forEach(lr => {
    const type = lr.leaveType || 'other';
    leaveTypeMap.set(type, (leaveTypeMap.get(type) || 0) + 1);
  });

  const leaveTypes = Array.from(leaveTypeMap.entries()).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count,
  }));

  return {
    totalLeaves,
    approvedLeaves,
    pendingLeaves,
    rejectedLeaves,
    totalDays,
    leaveTypes,
  };
};

/**
 * Generate department costs report
 */
export const generateDepartmentCosts = async (dateFrom, dateTo) => {
  const departments = await Department.find({ status: 'active' }).lean();
  const departmentCosts = await Promise.all(
    departments.map(async (dept) => {
      const deptUsers = await User.find({ departmentId: dept._id, status: 'active' }).lean();
      const userIds = deptUsers.map(u => u._id);
      
      const deptPaystubs = await PayStub.find({
        employeeId: { $in: userIds },
        payDate: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
        status: 'paid',
      }).lean();

      const totalCost = deptPaystubs.reduce((sum, ps) => sum + (ps.netPay || 0), 0);
      const totalGross = deptPaystubs.reduce((sum, ps) => sum + (ps.grossPay || 0), 0);

      return {
        department: dept.name,
        departmentId: dept._id,
        employeeCount: deptUsers.length,
        totalCost,
        totalGross,
        paystubCount: deptPaystubs.length,
      };
    })
  );

  const totalPayroll = departmentCosts.reduce((sum, dc) => sum + dc.totalCost, 0);
  
  return departmentCosts.map(dc => ({
    ...dc,
    percentage: totalPayroll > 0 ? Math.round((dc.totalCost / totalPayroll) * 100 * 10) / 10 : 0,
  })).filter(dc => dc.employeeCount > 0);
};

/**
 * Generate employee report
 */
export const generateEmployeeReport = async (employeeId, dateFrom, dateTo) => {
  const employee = await User.findById(employeeId).lean();
  if (!employee) {
    throw new ResourceNotFoundError('Employee');
  }

  const paystubs = await PayStub.find({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    payDate: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
  }).lean();

  const timesheets = await Timesheet.find({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    date: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
  }).lean();

  const leaveRequests = await LeaveRequest.find({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    $or: [
      { startDate: { $lte: new Date(dateTo) }, endDate: { $gte: new Date(dateFrom) } },
    ],
  }).lean();

  return {
    employee: {
      id: employee._id,
      name: employee.name,
      email: employee.email,
      employeeId: employee.employeeId,
      department: employee.department,
      position: employee.position,
    },
    payroll: {
      totalPay: paystubs.reduce((sum, ps) => sum + (ps.netPay || 0), 0),
      totalGross: paystubs.reduce((sum, ps) => sum + (ps.grossPay || 0), 0),
      paystubCount: paystubs.length,
      paystubs: paystubs.map(ps => ({
        period: ps.payPeriod,
        netPay: ps.netPay,
        grossPay: ps.grossPay,
        payDate: ps.payDate,
      })),
    },
    attendance: {
      totalHours: timesheets.reduce((sum, t) => sum + (t.hours || 0), 0),
      regularHours: timesheets.reduce((sum, t) => sum + (t.regularHours || 0), 0),
      overtimeHours: timesheets.reduce((sum, t) => sum + (t.overtimeHours || 0), 0),
      timesheetCount: timesheets.length,
    },
    leave: {
      totalDays: leaveRequests.reduce((sum, lr) => sum + (lr.totalDays || 0), 0),
      approvedDays: leaveRequests.filter(lr => lr.status === 'approved').reduce((sum, lr) => sum + (lr.totalDays || 0), 0),
      leaveCount: leaveRequests.length,
      leaves: leaveRequests.map(lr => ({
        type: lr.leaveType,
        startDate: lr.startDate,
        endDate: lr.endDate,
        totalDays: lr.totalDays,
        status: lr.status,
      })),
    },
  };
};

/**
 * Generate financial report
 */
export const generateFinancialReport = async (dateFrom, dateTo, departmentId = null) => {
  const query = {
    payDate: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
    status: 'paid',
  };

  if (departmentId) {
    const users = await User.find({ departmentId: new mongoose.Types.ObjectId(departmentId) }).select('_id');
    query.employeeId = { $in: users.map(u => u._id) };
  }

  const paystubs = await PayStub.find(query).lean();
  
  const summary = {
    totalGrossPay: paystubs.reduce((sum, ps) => sum + (ps.grossPay || 0), 0),
    totalNetPay: paystubs.reduce((sum, ps) => sum + (ps.netPay || 0), 0),
    totalDeductions: paystubs.reduce((sum, ps) => sum + (ps.totalDeductions || 0), 0),
    totalTaxes: paystubs.reduce((sum, ps) => sum + (ps.totalTaxes || 0), 0),
    totalBenefits: paystubs.reduce((sum, ps) => sum + ((ps.benefits || 0) + (ps.employerContributions || 0)), 0),
    paystubCount: paystubs.length,
  };

  // Monthly breakdown
  const monthlyBreakdown = {};
  paystubs.forEach(ps => {
    const month = new Date(ps.payDate).toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyBreakdown[month]) {
      monthlyBreakdown[month] = {
        month,
        grossPay: 0,
        netPay: 0,
        deductions: 0,
        taxes: 0,
        count: 0,
      };
    }
    monthlyBreakdown[month].grossPay += ps.grossPay || 0;
    monthlyBreakdown[month].netPay += ps.netPay || 0;
    monthlyBreakdown[month].deductions += ps.totalDeductions || 0;
    monthlyBreakdown[month].taxes += ps.totalTaxes || 0;
    monthlyBreakdown[month].count += 1;
  });

  return {
    summary,
    monthlyBreakdown: Object.values(monthlyBreakdown),
  };
};

/**
 * Save report to database
 */
export const saveReport = async (reportData, generatedBy, expiresInDays = 30) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const report = new Report({
    ...reportData,
    generatedBy,
    expiresAt,
  });

  await report.save();
  return report;
};

/**
 * Generate report based on type
 */
export const generateReport = async (reportType, dateFrom, dateTo, options = {}) => {
  const { departmentId, employeeId } = options;
  let reportData = {};

  switch (reportType) {
    case 'payroll':
      reportData = {
        reportType: 'payroll',
        period: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        departmentId: departmentId ? new mongoose.Types.ObjectId(departmentId) : null,
        payrollSummary: await generatePayrollSummary(dateFrom, dateTo, departmentId),
      };
      break;

    case 'attendance':
      reportData = {
        reportType: 'attendance',
        period: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        departmentId: departmentId ? new mongoose.Types.ObjectId(departmentId) : null,
        attendanceOverview: await generateAttendanceOverview(dateFrom, dateTo, departmentId),
      };
      break;

    case 'leave':
      reportData = {
        reportType: 'leave',
        period: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        departmentId: departmentId ? new mongoose.Types.ObjectId(departmentId) : null,
        leaveAnalytics: await generateLeaveAnalytics(dateFrom, dateTo, departmentId),
      };
      break;

    case 'department':
      reportData = {
        reportType: 'department',
        period: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        departmentCosts: await generateDepartmentCosts(dateFrom, dateTo),
      };
      break;

    case 'employee':
      if (!employeeId) {
        throw new InvalidInputError('Employee ID is required for employee reports');
      }
      reportData = {
        reportType: 'employee',
        period: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        reportData: await generateEmployeeReport(employeeId, dateFrom, dateTo),
      };
      break;

    case 'financial':
      reportData = {
        reportType: 'financial',
        period: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        departmentId: departmentId ? new mongoose.Types.ObjectId(departmentId) : null,
        reportData: await generateFinancialReport(dateFrom, dateTo, departmentId),
      };
      break;

    default:
      throw new InvalidInputError(`Unknown report type: ${reportType}`);
  }

  return reportData;
};

