import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Report from '../models/Report.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import PayStub from '../models/PayStub.js';
import PayrollPeriod from '../models/PayrollPeriod.js';
import Timesheet from '../models/Timesheet.js';
import LeaveRequest from '../models/LeaveRequest.js';
import FileAttachment from '../models/FileAttachment.js';
import mongoose from 'mongoose';
import { InvalidInputError, ResourceNotFoundError } from '../utils/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads/reports');

// Helper to ensure directory exists
const ensureUploadsDir = async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
};

/**
 * Generate Payroll Report - Detailed totals, averages, net/gross
 */
export const generatePayrollReport = async (dateFrom, dateTo, departmentId = null) => {
  const query = {
    payDate: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
    status: 'paid',
  };

  if (departmentId) {
    const users = await User.find({ departmentId: new mongoose.Types.ObjectId(departmentId) }).select('_id');
    query.employeeId = { $in: users.map(u => u._id) };
  }

  const paystubs = await PayStub.find(query)
    .populate('employeeId', 'name email employeeId department position')
    .lean();

  // Calculate totals
  const totalGrossPay = paystubs.reduce((sum, ps) => sum + (ps.grossPay || 0), 0);
  const totalNetPay = paystubs.reduce((sum, ps) => sum + (ps.netPay || 0), 0);
  const totalDeductions = paystubs.reduce((sum, ps) => sum + (ps.totalDeductions || 0), 0);
  const totalTaxes = paystubs.reduce((sum, ps) => sum + (ps.totalTaxes || 0), 0);
  const totalOvertimePay = paystubs.reduce((sum, ps) => sum + (ps.overtimePay || 0), 0);
  const totalRegularPay = paystubs.reduce((sum, ps) => sum + ((ps.regularHours || 0) * (ps.regularRate || 0)), 0);

  // Employee statistics
  const uniqueEmployees = new Set(paystubs.map(ps => ps.employeeId?._id?.toString()).filter(Boolean));
  const employeeCount = uniqueEmployees.size;
  const averageGrossPay = employeeCount > 0 ? totalGrossPay / employeeCount : 0;
  const averageNetPay = employeeCount > 0 ? totalNetPay / employeeCount : 0;
  const averageDeductions = employeeCount > 0 ? totalDeductions / employeeCount : 0;

  // Department breakdown
  const departmentBreakdown = {};
  paystubs.forEach(ps => {
    const dept = ps.employeeId?.department || 'Unknown';
    if (!departmentBreakdown[dept]) {
      departmentBreakdown[dept] = {
        department: dept,
        employeeCount: new Set(),
        totalGrossPay: 0,
        totalNetPay: 0,
        paystubCount: 0,
      };
    }
    departmentBreakdown[dept].employeeCount.add(ps.employeeId?._id?.toString());
    departmentBreakdown[dept].totalGrossPay += ps.grossPay || 0;
    departmentBreakdown[dept].totalNetPay += ps.netPay || 0;
    departmentBreakdown[dept].paystubCount += 1;
  });

  Object.keys(departmentBreakdown).forEach(dept => {
    departmentBreakdown[dept].employeeCount = departmentBreakdown[dept].employeeCount.size;
  });

  return {
    summary: {
      totalGrossPay,
      totalNetPay,
      totalDeductions,
      totalTaxes,
      totalOvertimePay,
      totalRegularPay,
      employeeCount,
      paystubCount: paystubs.length,
      averageGrossPay,
      averageNetPay,
      averageDeductions,
      period: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
    },
    departmentBreakdown: Object.values(departmentBreakdown),
    paystubs: paystubs.map(ps => ({
      employeeName: ps.employeeId?.name || 'N/A',
      employeeId: ps.employeeId?.employeeId || 'N/A',
      department: ps.employeeId?.department || 'N/A',
      payDate: ps.payDate,
      grossPay: ps.grossPay || 0,
      netPay: ps.netPay || 0,
      deductions: ps.totalDeductions || 0,
      taxes: ps.totalTaxes || 0,
      regularHours: ps.regularHours || 0,
      overtimeHours: ps.overtimeHours || 0,
    })),
  };
};

/**
 * Generate Attendance Report - Present, absent, late, attendance rate
 */
export const generateAttendanceReport = async (dateFrom, dateTo, departmentId = null) => {
  const query = {
    date: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
  };

  if (departmentId) {
    const users = await User.find({ departmentId: new mongoose.Types.ObjectId(departmentId) }).select('_id');
    query.employeeId = { $in: users.map(u => u._id) };
  }

  const timesheets = await Timesheet.find(query)
    .populate('employeeId', 'name email employeeId department')
    .lean();

  // Calculate totals
  const totalDays = timesheets.length;
  const presentDays = timesheets.filter(t => t.status === 'approved' && (t.hours || 0) > 0).length;
  const absentDays = totalDays - presentDays;
  const totalHours = timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);
  const regularHours = timesheets.reduce((sum, t) => sum + (t.regularHours || 0), 0);
  const overtimeHours = timesheets.reduce((sum, t) => sum + (t.overtimeHours || 0), 0);
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  // Employee breakdown
  const employeeBreakdown = {};
  timesheets.forEach(t => {
    const empId = t.employeeId?._id?.toString();
    const empName = t.employeeId?.name || 'Unknown';
    if (!employeeBreakdown[empId]) {
      employeeBreakdown[empId] = {
        employeeId: t.employeeId?.employeeId || 'N/A',
        employeeName: empName,
        department: t.employeeId?.department || 'N/A',
        presentDays: 0,
        absentDays: 0,
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        timesheetCount: 0,
      };
    }
    if (t.status === 'approved' && (t.hours || 0) > 0) {
      employeeBreakdown[empId].presentDays += 1;
      employeeBreakdown[empId].totalHours += t.hours || 0;
      employeeBreakdown[empId].regularHours += t.regularHours || 0;
      employeeBreakdown[empId].overtimeHours += t.overtimeHours || 0;
    } else {
      employeeBreakdown[empId].absentDays += 1;
    }
    employeeBreakdown[empId].timesheetCount += 1;
  });

  // Calculate attendance rates for each employee
  Object.values(employeeBreakdown).forEach(emp => {
    const total = emp.presentDays + emp.absentDays;
    emp.attendanceRate = total > 0 ? (emp.presentDays / total) * 100 : 0;
  });

  return {
    summary: {
      totalDays,
      presentDays,
      absentDays,
      totalHours,
      regularHours,
      overtimeHours,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      period: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
    },
    employeeBreakdown: Object.values(employeeBreakdown),
    timesheets: timesheets.map(t => ({
      employeeName: t.employeeId?.name || 'N/A',
      employeeId: t.employeeId?.employeeId || 'N/A',
      date: t.date,
      hours: t.hours || 0,
      regularHours: t.regularHours || 0,
      overtimeHours: t.overtimeHours || 0,
      status: t.status,
    })),
  };
};

/**
 * Generate Leave Report - Total, approved, pending, rejected, by type
 */
export const generateLeaveReport = async (dateFrom, dateTo, departmentId = null) => {
  const query = {
    $or: [
      { startDate: { $lte: new Date(dateTo) }, endDate: { $gte: new Date(dateFrom) } },
    ],
  };

  if (departmentId) {
    const users = await User.find({ departmentId: new mongoose.Types.ObjectId(departmentId) }).select('_id');
    query.employeeId = { $in: users.map(u => u._id) };
  }

  const leaveRequests = await LeaveRequest.find(query)
    .populate('employeeId', 'name email employeeId department')
    .lean();

  // Calculate totals
  const totalLeaves = leaveRequests.length;
  const approvedLeaves = leaveRequests.filter(lr => lr.status === 'approved').length;
  const pendingLeaves = leaveRequests.filter(lr => lr.status === 'pending').length;
  const rejectedLeaves = leaveRequests.filter(lr => lr.status === 'rejected').length;
  const totalDays = leaveRequests.reduce((sum, lr) => sum + (lr.totalDays || 0), 0);
  const approvedDays = leaveRequests
    .filter(lr => lr.status === 'approved')
    .reduce((sum, lr) => sum + (lr.totalDays || 0), 0);

  // By type breakdown
  const byType = {};
  leaveRequests.forEach(lr => {
    const type = lr.leaveType || 'Unknown';
    if (!byType[type]) {
      byType[type] = {
        type,
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        totalDays: 0,
        approvedDays: 0,
      };
    }
    byType[type].total += 1;
    byType[type][lr.status] += 1;
    byType[type].totalDays += lr.totalDays || 0;
    if (lr.status === 'approved') {
      byType[type].approvedDays += lr.totalDays || 0;
    }
  });

  // Employee breakdown
  const employeeBreakdown = {};
  leaveRequests.forEach(lr => {
    const empId = lr.employeeId?._id?.toString();
    if (!employeeBreakdown[empId]) {
      employeeBreakdown[empId] = {
        employeeId: lr.employeeId?.employeeId || 'N/A',
        employeeName: lr.employeeId?.name || 'N/A',
        department: lr.employeeId?.department || 'N/A',
        totalLeaves: 0,
        approvedLeaves: 0,
        pendingLeaves: 0,
        rejectedLeaves: 0,
        totalDays: 0,
        approvedDays: 0,
      };
    }
    employeeBreakdown[empId].totalLeaves += 1;
    employeeBreakdown[empId][`${lr.status}Leaves`] += 1;
    employeeBreakdown[empId].totalDays += lr.totalDays || 0;
    if (lr.status === 'approved') {
      employeeBreakdown[empId].approvedDays += lr.totalDays || 0;
    }
  });

  return {
    summary: {
      totalLeaves,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
      totalDays,
      approvedDays,
      approvalRate: totalLeaves > 0 ? (approvedLeaves / totalLeaves) * 100 : 0,
      period: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
    },
    byType: Object.values(byType),
    employeeBreakdown: Object.values(employeeBreakdown),
    leaveRequests: leaveRequests.map(lr => ({
      employeeName: lr.employeeId?.name || 'N/A',
      employeeId: lr.employeeId?.employeeId || 'N/A',
      leaveType: lr.leaveType,
      startDate: lr.startDate,
      endDate: lr.endDate,
      totalDays: lr.totalDays || 0,
      status: lr.status,
      reason: lr.reason || 'N/A',
    })),
  };
};

/**
 * Generate Department Cost Report - Salary + overtime costs
 */
export const generateDepartmentCostReport = async (dateFrom, dateTo) => {
  const departments = await Department.find({ status: 'active' }).lean();
  const allUsers = await User.find({ status: 'active' }).select('_id departmentId baseSalary hourlyRate').lean();

  // Get paystubs for the period
  const paystubs = await PayStub.find({
    payDate: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
    status: 'paid',
  })
    .populate('employeeId', 'departmentId department')
    .lean();

  // Get timesheets for overtime calculation
  const timesheets = await Timesheet.find({
    date: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
    status: 'approved',
  })
    .populate('employeeId', 'departmentId department hourlyRate')
    .lean();

  const departmentCosts = {};

  // Initialize departments
  departments.forEach(dept => {
    departmentCosts[dept._id.toString()] = {
      departmentId: dept._id,
      department: dept.name,
      employeeCount: 0,
      totalSalary: 0,
      totalOvertimeCost: 0,
      totalCost: 0,
      paystubCount: 0,
    };
  });

  // Calculate from paystubs
  paystubs.forEach(ps => {
    const deptId = ps.employeeId?.departmentId?.toString();
    if (deptId && departmentCosts[deptId]) {
      departmentCosts[deptId].totalSalary += ps.grossPay || 0;
      departmentCosts[deptId].paystubCount += 1;
    }
  });

  // Calculate overtime costs from timesheets
  timesheets.forEach(ts => {
    const deptId = ts.employeeId?.departmentId?.toString();
    if (deptId && departmentCosts[deptId] && ts.overtimeHours > 0) {
      const hourlyRate = ts.employeeId?.hourlyRate || 0;
      const overtimeRate = hourlyRate * 1.5; // Standard overtime rate
      departmentCosts[deptId].totalOvertimeCost += (ts.overtimeHours || 0) * overtimeRate;
    }
  });

  // Count employees per department
  allUsers.forEach(user => {
    const deptId = user.departmentId?.toString();
    if (deptId && departmentCosts[deptId]) {
      departmentCosts[deptId].employeeCount += 1;
    }
  });

  // Calculate total costs and percentages
  const costs = Object.values(departmentCosts);
  const grandTotal = costs.reduce((sum, dept) => sum + (dept.totalSalary + dept.totalOvertimeCost), 0);

  costs.forEach(dept => {
    dept.totalCost = dept.totalSalary + dept.totalOvertimeCost;
    dept.percentage = grandTotal > 0 ? (dept.totalCost / grandTotal) * 100 : 0;
  });

  return {
    summary: {
      totalDepartments: costs.length,
      grandTotal,
      period: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
    },
    departments: costs.sort((a, b) => b.totalCost - a.totalCost),
  };
};

/**
 * Generate Employee Report - Performance + attendance summary
 */
export const generateEmployeeReport = async (employeeId, dateFrom, dateTo) => {
  const employee = await User.findById(employeeId).lean();
  if (!employee) {
    throw new ResourceNotFoundError('Employee');
  }

  // Get paystubs
  const paystubs = await PayStub.find({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    payDate: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
    status: 'paid',
  }).lean();

  // Get timesheets
  const timesheets = await Timesheet.find({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    date: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
  }).lean();

  // Get leave requests
  const leaveRequests = await LeaveRequest.find({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    $or: [
      { startDate: { $lte: new Date(dateTo) }, endDate: { $gte: new Date(dateFrom) } },
    ],
  }).lean();

  // Calculate payroll summary
  const totalGrossPay = paystubs.reduce((sum, ps) => sum + (ps.grossPay || 0), 0);
  const totalNetPay = paystubs.reduce((sum, ps) => sum + (ps.netPay || 0), 0);
  const totalDeductions = paystubs.reduce((sum, ps) => sum + (ps.totalDeductions || 0), 0);
  const averageGrossPay = paystubs.length > 0 ? totalGrossPay / paystubs.length : 0;

  // Calculate attendance summary
  const totalHours = timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);
  const regularHours = timesheets.reduce((sum, t) => sum + (t.regularHours || 0), 0);
  const overtimeHours = timesheets.reduce((sum, t) => sum + (t.overtimeHours || 0), 0);
  const approvedTimesheets = timesheets.filter(t => t.status === 'approved').length;
  const attendanceRate = timesheets.length > 0 ? (approvedTimesheets / timesheets.length) * 100 : 0;

  // Calculate leave summary
  const totalLeaveDays = leaveRequests.reduce((sum, lr) => sum + (lr.totalDays || 0), 0);
  const approvedLeaveDays = leaveRequests
    .filter(lr => lr.status === 'approved')
    .reduce((sum, lr) => sum + (lr.totalDays || 0), 0);

  return {
    employee: {
      name: employee.name,
      email: employee.email,
      employeeId: employee.employeeId,
      department: employee.department,
      position: employee.position,
    },
    payroll: {
      totalGrossPay,
      totalNetPay,
      totalDeductions,
      averageGrossPay,
      paystubCount: paystubs.length,
      paystubs: paystubs.map(ps => ({
        payDate: ps.payDate,
        grossPay: ps.grossPay || 0,
        netPay: ps.netPay || 0,
        deductions: ps.totalDeductions || 0,
      })),
    },
    attendance: {
      totalHours,
      regularHours,
      overtimeHours,
      approvedTimesheets,
      totalTimesheets: timesheets.length,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      timesheets: timesheets.map(t => ({
        date: t.date,
        hours: t.hours || 0,
        status: t.status,
      })),
    },
    leave: {
      totalLeaveDays,
      approvedLeaveDays,
      totalLeaves: leaveRequests.length,
      approvedLeaves: leaveRequests.filter(lr => lr.status === 'approved').length,
      leaveRequests: leaveRequests.map(lr => ({
        leaveType: lr.leaveType,
        startDate: lr.startDate,
        endDate: lr.endDate,
        totalDays: lr.totalDays || 0,
        status: lr.status,
      })),
    },
    period: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
  };
};

/**
 * Generate Financial Report - Overall payroll & cost summary
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

  // Overall summary
  const totalGrossPay = paystubs.reduce((sum, ps) => sum + (ps.grossPay || 0), 0);
  const totalNetPay = paystubs.reduce((sum, ps) => sum + (ps.netPay || 0), 0);
  const totalDeductions = paystubs.reduce((sum, ps) => sum + (ps.totalDeductions || 0), 0);
  const totalTaxes = paystubs.reduce((sum, ps) => sum + (ps.totalTaxes || 0), 0);
  const totalBenefits = paystubs.reduce((sum, ps) => sum + ((ps.benefits || 0) + (ps.employerContributions || 0)), 0);

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
        benefits: 0,
        paystubCount: 0,
      };
    }
    monthlyBreakdown[month].grossPay += ps.grossPay || 0;
    monthlyBreakdown[month].netPay += ps.netPay || 0;
    monthlyBreakdown[month].deductions += ps.totalDeductions || 0;
    monthlyBreakdown[month].taxes += ps.totalTaxes || 0;
    monthlyBreakdown[month].benefits += (ps.benefits || 0) + (ps.employerContributions || 0);
    monthlyBreakdown[month].paystubCount += 1;
  });

  // Department breakdown
  const departmentBreakdown = {};
  paystubs.forEach(ps => {
    // We need to populate or get department info
    // For now, we'll aggregate by employee
  });

  return {
    summary: {
      totalGrossPay,
      totalNetPay,
      totalDeductions,
      totalTaxes,
      totalBenefits,
      totalCost: totalGrossPay + totalBenefits,
      paystubCount: paystubs.length,
      period: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
    },
    monthlyBreakdown: Object.values(monthlyBreakdown).sort((a, b) => a.month.localeCompare(b.month)),
  };
};

/**
 * Generate PDF Report using PDFKit
 */
export const generatePDF = async (reportType, reportData, reportId, generatedBy) => {
  await ensureUploadsDir();
  
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const fileName = `report-${reportType}-${reportId}-${Date.now()}.pdf`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  // Create write stream
  const stream = createWriteStream(filePath);
  doc.pipe(stream);

  // Helper function to add header
  const addHeader = (title) => {
    doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);
  };

  // Helper function to add section
  const addSection = (title) => {
    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text(title, { underline: true });
    doc.moveDown(0.5);
  };

  // Helper function to add table
  const addTable = (headers, rows, columnWidths) => {
    const startY = doc.y;
    const rowHeight = 20;
    const headerHeight = 25;

    // Header
    doc.fontSize(10).font('Helvetica-Bold');
    let x = 50;
    headers.forEach((header, i) => {
      doc.text(header, x, startY, { width: columnWidths[i], align: 'left' });
      x += columnWidths[i];
    });
    doc.moveDown();

    // Rows
    doc.font('Helvetica');
    rows.forEach(row => {
      x = 50;
      row.forEach((cell, i) => {
        doc.text(String(cell || ''), x, doc.y, { width: columnWidths[i], align: 'left' });
        x += columnWidths[i];
      });
      doc.moveDown(0.8);
    });
    doc.moveDown();
  };

  // Generate report based on type
  addHeader(`${reportType.toUpperCase()} REPORT`);

  if (reportType === 'payroll') {
    const data = reportData.payrollSummary || reportData;
    addSection('Summary');
    doc.fontSize(11).text(`Total Gross Pay: $${(data.totalGrossPay || data.totalPayroll || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    doc.text(`Total Net Pay: $${(data.totalNetPay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    doc.text(`Total Deductions: $${(data.totalDeductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    doc.text(`Employee Count: ${data.employeeCount || 0}`);
    doc.text(`Average Pay: $${(data.averageSalary || data.averagePay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    doc.text(`Period: ${data.period || 'N/A'}`);

    if (reportData.paystubs && reportData.paystubs.length > 0) {
      addSection('Paystub Details');
      const headers = ['Employee', 'Pay Date', 'Gross Pay', 'Net Pay'];
      const rows = reportData.paystubs.slice(0, 50).map(ps => [
        ps.employeeName || 'N/A',
        new Date(ps.payDate).toLocaleDateString(),
        `$${(ps.grossPay || 0).toFixed(2)}`,
        `$${(ps.netPay || 0).toFixed(2)}`,
      ]);
      addTable(headers, rows, [150, 100, 100, 100]);
    }
  } else if (reportType === 'attendance') {
    const data = reportData.attendanceOverview || reportData;
    addSection('Summary');
    doc.fontSize(11).text(`Total Days: ${data.totalDays || 0}`);
    doc.text(`Present Days: ${data.presentDays || 0}`);
    doc.text(`Absent Days: ${data.absentDays || 0}`);
    doc.text(`Total Hours: ${(data.totalHours || 0).toFixed(2)}`);
    doc.text(`Regular Hours: ${(data.regularHours || 0).toFixed(2)}`);
    doc.text(`Overtime Hours: ${(data.overtimeHours || 0).toFixed(2)}`);
    doc.text(`Attendance Rate: ${(data.attendanceRate || 0).toFixed(2)}%`);
    doc.text(`Period: ${data.period || 'N/A'}`);
  } else if (reportType === 'leave') {
    const data = reportData.leaveAnalytics || reportData;
    addSection('Summary');
    doc.fontSize(11).text(`Total Leaves: ${data.totalLeaves || 0}`);
    doc.text(`Approved: ${data.approvedLeaves || 0}`);
    doc.text(`Pending: ${data.pendingLeaves || 0}`);
    doc.text(`Rejected: ${data.rejectedLeaves || 0}`);
    doc.text(`Period: ${data.period || 'N/A'}`);

    if (data.leaveTypes && data.leaveTypes.length > 0) {
      addSection('Leave Types');
      data.leaveTypes.forEach(lt => {
        doc.text(`${lt.type}: ${lt.count}`);
      });
    }
  } else if (reportType === 'department') {
    const data = reportData.departmentCosts || reportData.departments || [];
    addSection('Department Costs');
    if (data.length > 0) {
      const headers = ['Department', 'Employees', 'Total Cost', 'Percentage'];
      const rows = data.map(dept => [
        dept.department || 'N/A',
        dept.employeeCount || 0,
        `$${(dept.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `${(dept.percentage || 0).toFixed(2)}%`,
      ]);
      addTable(headers, rows, [200, 100, 120, 100]);
    }
  } else if (reportType === 'employee') {
    const data = reportData;
    addSection('Employee Information');
    doc.fontSize(11).text(`Name: ${data.employee?.name || 'N/A'}`);
    doc.text(`Email: ${data.employee?.email || 'N/A'}`);
    doc.text(`Department: ${data.employee?.department || 'N/A'}`);
    doc.text(`Period: ${data.period || 'N/A'}`);

    if (data.payroll) {
      addSection('Payroll Summary');
      doc.text(`Total Gross Pay: $${(data.payroll.totalGrossPay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      doc.text(`Total Net Pay: $${(data.payroll.totalNetPay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }

    if (data.attendance) {
      addSection('Attendance Summary');
      doc.text(`Total Hours: ${(data.attendance.totalHours || 0).toFixed(2)}`);
      doc.text(`Attendance Rate: ${(data.attendance.attendanceRate || 0).toFixed(2)}%`);
    }
  } else if (reportType === 'financial') {
    const data = reportData.reportData || reportData;
    if (data.summary) {
      addSection('Financial Summary');
      doc.fontSize(11).text(`Total Gross Pay: $${(data.summary.totalGrossPay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      doc.text(`Total Net Pay: $${(data.summary.totalNetPay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      doc.text(`Total Deductions: $${(data.summary.totalDeductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      doc.text(`Total Taxes: $${(data.summary.totalTaxes || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      doc.text(`Period: ${data.summary.period || 'N/A'}`);
    }
  }

  // Footer
  doc.fontSize(8).font('Helvetica').text(
    `Generated by: ${generatedBy?.name || 'System'} | Page ${doc.bufferedPageRange().start + 1}`,
    50,
    doc.page.height - 50,
    { align: 'center', width: doc.page.width - 100 }
  );

  // Finalize PDF
  doc.end();

  // Wait for stream to finish
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  // Get file size
  const stats = await fs.stat(filePath);
  const fileSize = stats.size;

  // Create file URL (relative path for now)
  const fileUrl = `/uploads/reports/${fileName}`;

  // Save to FileAttachments
  const fileAttachment = await FileAttachment.create({
    fileName: fileName,
    originalFileName: `${reportType}-report.pdf`,
    fileType: 'application/pdf',
    fileSize: fileSize,
    fileUrl: fileUrl,
    filePath: filePath,
    storageProvider: 'local',
    entityType: 'report',
    entityId: reportId,
    uploadedBy: generatedBy?._id || generatedBy,
    uploadedByName: generatedBy?.name || 'System',
    description: `${reportType.toUpperCase()} Report - ${reportData.period || 'N/A'}`,
    tags: [reportType, 'report', 'pdf'],
    category: 'report',
    status: 'active',
  });

  return { fileAttachment, filePath, fileUrl };
};

/**
 * Generate Excel Report using exceljs
 */
export const generateExcel = async (reportType, reportData, reportId, generatedBy) => {
  await ensureUploadsDir();
  
  const workbook = new ExcelJS.Workbook();
  const fileName = `report-${reportType}-${reportId}-${Date.now()}.xlsx`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  // Helper function to format currency
  const formatCurrency = (value) => {
    return typeof value === 'number' ? value.toFixed(2) : value;
  };

  // Helper function to add summary sheet
  const addSummarySheet = (data, title) => {
    const sheet = workbook.addWorksheet('Summary');
    sheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];

    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return; // Skip nested objects
      }
      sheet.addRow({
        metric: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        value: Array.isArray(value) ? value.length : formatCurrency(value),
      });
    });

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  };

  // Generate report based on type
  if (reportType === 'payroll') {
    const data = reportData.payrollSummary || reportData;
    addSummarySheet(data, 'Payroll Summary');

    if (reportData.paystubs && reportData.paystubs.length > 0) {
      const sheet = workbook.addWorksheet('Paystubs');
      sheet.columns = [
        { header: 'Employee Name', key: 'employeeName', width: 20 },
        { header: 'Employee ID', key: 'employeeId', width: 15 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Pay Date', key: 'payDate', width: 15 },
        { header: 'Gross Pay', key: 'grossPay', width: 15 },
        { header: 'Net Pay', key: 'netPay', width: 15 },
        { header: 'Deductions', key: 'deductions', width: 15 },
        { header: 'Taxes', key: 'taxes', width: 15 },
      ];

      reportData.paystubs.forEach(ps => {
        sheet.addRow({
          employeeName: ps.employeeName || 'N/A',
          employeeId: ps.employeeId || 'N/A',
          department: ps.department || 'N/A',
          payDate: new Date(ps.payDate).toLocaleDateString(),
          grossPay: formatCurrency(ps.grossPay || 0),
          netPay: formatCurrency(ps.netPay || 0),
          deductions: formatCurrency(ps.deductions || 0),
          taxes: formatCurrency(ps.taxes || 0),
        });
      });

      // Style header
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }

    if (reportData.departmentBreakdown && reportData.departmentBreakdown.length > 0) {
      const sheet = workbook.addWorksheet('Department Breakdown');
      sheet.columns = [
        { header: 'Department', key: 'department', width: 25 },
        { header: 'Employee Count', key: 'employeeCount', width: 15 },
        { header: 'Total Gross Pay', key: 'totalGrossPay', width: 18 },
        { header: 'Total Net Pay', key: 'totalNetPay', width: 18 },
        { header: 'Paystub Count', key: 'paystubCount', width: 15 },
      ];

      reportData.departmentBreakdown.forEach(dept => {
        sheet.addRow({
          department: dept.department || 'N/A',
          employeeCount: dept.employeeCount || 0,
          totalGrossPay: formatCurrency(dept.totalGrossPay || 0),
          totalNetPay: formatCurrency(dept.totalNetPay || 0),
          paystubCount: dept.paystubCount || 0,
        });
      });

      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }
  } else if (reportType === 'attendance') {
    const data = reportData.attendanceOverview || reportData;
    addSummarySheet(data, 'Attendance Summary');

    if (reportData.employeeBreakdown && reportData.employeeBreakdown.length > 0) {
      const sheet = workbook.addWorksheet('Employee Breakdown');
      sheet.columns = [
        { header: 'Employee ID', key: 'employeeId', width: 15 },
        { header: 'Employee Name', key: 'employeeName', width: 20 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Present Days', key: 'presentDays', width: 15 },
        { header: 'Absent Days', key: 'absentDays', width: 15 },
        { header: 'Total Hours', key: 'totalHours', width: 15 },
        { header: 'Attendance Rate', key: 'attendanceRate', width: 15 },
      ];

      reportData.employeeBreakdown.forEach(emp => {
        sheet.addRow({
          employeeId: emp.employeeId || 'N/A',
          employeeName: emp.employeeName || 'N/A',
          department: emp.department || 'N/A',
          presentDays: emp.presentDays || 0,
          absentDays: emp.absentDays || 0,
          totalHours: formatCurrency(emp.totalHours || 0),
          attendanceRate: `${formatCurrency(emp.attendanceRate || 0)}%`,
        });
      });

      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }
  } else if (reportType === 'leave') {
    const data = reportData.leaveAnalytics || reportData;
    addSummarySheet(data, 'Leave Summary');

    if (reportData.byType && reportData.byType.length > 0) {
      const sheet = workbook.addWorksheet('Leave by Type');
      sheet.columns = [
        { header: 'Leave Type', key: 'type', width: 20 },
        { header: 'Total', key: 'total', width: 10 },
        { header: 'Approved', key: 'approved', width: 10 },
        { header: 'Pending', key: 'pending', width: 10 },
        { header: 'Rejected', key: 'rejected', width: 10 },
        { header: 'Total Days', key: 'totalDays', width: 12 },
        { header: 'Approved Days', key: 'approvedDays', width: 15 },
      ];

      reportData.byType.forEach(lt => {
        sheet.addRow({
          type: lt.type || 'N/A',
          total: lt.total || 0,
          approved: lt.approved || 0,
          pending: lt.pending || 0,
          rejected: lt.rejected || 0,
          totalDays: lt.totalDays || 0,
          approvedDays: lt.approvedDays || 0,
        });
      });

      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }
  } else if (reportType === 'department') {
    const data = reportData.departmentCosts || reportData.departments || [];
    const sheet = workbook.addWorksheet('Department Costs');
    sheet.columns = [
      { header: 'Department', key: 'department', width: 25 },
      { header: 'Employee Count', key: 'employeeCount', width: 15 },
      { header: 'Total Salary', key: 'totalSalary', width: 18 },
      { header: 'Total Overtime Cost', key: 'totalOvertimeCost', width: 20 },
      { header: 'Total Cost', key: 'totalCost', width: 18 },
      { header: 'Percentage', key: 'percentage', width: 12 },
    ];

    data.forEach(dept => {
      sheet.addRow({
        department: dept.department || 'N/A',
        employeeCount: dept.employeeCount || 0,
        totalSalary: formatCurrency(dept.totalSalary || 0),
        totalOvertimeCost: formatCurrency(dept.totalOvertimeCost || 0),
        totalCost: formatCurrency(dept.totalCost || 0),
        percentage: `${formatCurrency(dept.percentage || 0)}%`,
      });
    });

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  } else if (reportType === 'employee') {
    const data = reportData;
    const sheet = workbook.addWorksheet('Employee Report');
    
    // Employee Info
    sheet.addRow(['Employee Information']);
    sheet.addRow(['Name', data.employee?.name || 'N/A']);
    sheet.addRow(['Email', data.employee?.email || 'N/A']);
    sheet.addRow(['Department', data.employee?.department || 'N/A']);
    sheet.addRow(['Period', data.period || 'N/A']);
    sheet.addRow([]);

    // Payroll
    if (data.payroll) {
      sheet.addRow(['Payroll Summary']);
      sheet.addRow(['Total Gross Pay', formatCurrency(data.payroll.totalGrossPay || 0)]);
      sheet.addRow(['Total Net Pay', formatCurrency(data.payroll.totalNetPay || 0)]);
      sheet.addRow([]);
    }

    // Attendance
    if (data.attendance) {
      sheet.addRow(['Attendance Summary']);
      sheet.addRow(['Total Hours', formatCurrency(data.attendance.totalHours || 0)]);
      sheet.addRow(['Attendance Rate', `${formatCurrency(data.attendance.attendanceRate || 0)}%`]);
    }
  } else if (reportType === 'financial') {
    const data = reportData.reportData || reportData;
    if (data.summary) {
      addSummarySheet(data.summary, 'Financial Summary');
    }

    if (data.monthlyBreakdown && data.monthlyBreakdown.length > 0) {
      const sheet = workbook.addWorksheet('Monthly Breakdown');
      sheet.columns = [
        { header: 'Month', key: 'month', width: 15 },
        { header: 'Gross Pay', key: 'grossPay', width: 15 },
        { header: 'Net Pay', key: 'netPay', width: 15 },
        { header: 'Deductions', key: 'deductions', width: 15 },
        { header: 'Taxes', key: 'taxes', width: 15 },
        { header: 'Benefits', key: 'benefits', width: 15 },
      ];

      data.monthlyBreakdown.forEach(month => {
        sheet.addRow({
          month: month.month,
          grossPay: formatCurrency(month.grossPay || 0),
          netPay: formatCurrency(month.netPay || 0),
          deductions: formatCurrency(month.deductions || 0),
          taxes: formatCurrency(month.taxes || 0),
          benefits: formatCurrency(month.benefits || 0),
        });
      });

      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }
  }

  // Write to file
  await workbook.xlsx.writeFile(filePath);

  // Get file size
  const stats = await fs.stat(filePath);
  const fileSize = stats.size;

  // Create file URL
  const fileUrl = `/uploads/reports/${fileName}`;

  // Save to FileAttachments
  const fileAttachment = await FileAttachment.create({
    fileName: fileName,
    originalFileName: `${reportType}-report.xlsx`,
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: fileSize,
    fileUrl: fileUrl,
    filePath: filePath,
    storageProvider: 'local',
    entityType: 'report',
    entityId: reportId,
    uploadedBy: generatedBy?._id || generatedBy,
    uploadedByName: generatedBy?.name || 'System',
    description: `${reportType.toUpperCase()} Report - ${reportData.period || 'N/A'}`,
    tags: [reportType, 'report', 'excel'],
    category: 'report',
    status: 'active',
  });

  return { fileAttachment, filePath, fileUrl };
};

