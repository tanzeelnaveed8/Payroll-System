import DailyReport from '../models/DailyReport.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { ResourceNotFoundError, InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

/**
 * Create or update a daily report for an employee
 */
export const createOrUpdateDailyReport = async (employeeId, reportData) => {
  const employee = await User.findById(employeeId).select('department departmentId role').lean();
  
  if (!employee) {
    throw new ResourceNotFoundError('Employee');
  }

  if (employee.role !== 'employee') {
    throw new InvalidInputError('Only employees can submit daily reports');
  }

  // Ensure reportDate is set to start of day for consistency
  const reportDate = new Date(reportData.reportDate);
  reportDate.setHours(0, 0, 0, 0);

  // Check if report already exists for this date
  const existingReport = await DailyReport.findOne({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    reportDate
  });

  const reportPayload = {
    employeeId: new mongoose.Types.ObjectId(employeeId),
    reportDate,
    departmentId: employee.departmentId,
    department: employee.department,
    tasksCompleted: reportData.tasksCompleted || [],
    accomplishments: reportData.accomplishments || [],
    challenges: reportData.challenges || [],
    hoursWorked: reportData.hoursWorked || 0,
    overtimeHours: reportData.overtimeHours || 0,
    status: reportData.status || 'draft',
    notes: reportData.notes || '',
    updatedAt: Date.now()
  };

  if (reportPayload.status === 'submitted' && !reportPayload.submittedAt) {
    reportPayload.submittedAt = Date.now();
  }

  let report;
  if (existingReport) {
    // Update existing report
    Object.assign(existingReport, reportPayload);
    report = await existingReport.save();
  } else {
    // Create new report
    report = await DailyReport.create(reportPayload);
  }

  return report;
};

/**
 * Get daily reports for an employee
 */
export const getEmployeeDailyReports = async (employeeId, filters = {}) => {
  const query = {
    employeeId: new mongoose.Types.ObjectId(employeeId)
  };

  if (filters.startDate) {
    query.reportDate = { ...query.reportDate, $gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    query.reportDate = { ...query.reportDate, $lte: new Date(filters.endDate) };
  }
  if (filters.status) {
    query.status = filters.status;
  }

  const reports = await DailyReport.find(query)
    .sort({ reportDate: -1 })
    .limit(filters.limit || 50)
    .lean();

  return reports;
};

/**
 * Get daily reports for all employees in a department (for dept_lead)
 */
export const getDepartmentDailyReports = async (deptLeadId, filters = {}) => {
  const deptLead = await User.findById(deptLeadId).select('department departmentId').lean();
  
  if (!deptLead) {
    throw new ResourceNotFoundError('Department Lead');
  }

  const query = {
    role: 'employee',
    status: { $in: ['active', 'on-leave'] }
  };

  if (deptLead.departmentId) {
    query.departmentId = deptLead.departmentId;
  } else if (deptLead.department) {
    query.department = deptLead.department;
  } else {
    return { reports: [], employees: [] };
  }

  // Get all employees in the department
  const employees = await User.find(query)
    .select('_id name email employeeId position')
    .lean();

  const employeeIds = employees.map(emp => emp._id);

  // Build report query
  const reportQuery = {
    employeeId: { $in: employeeIds }
  };

  if (filters.startDate) {
    reportQuery.reportDate = { ...reportQuery.reportDate, $gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    reportQuery.reportDate = { ...reportQuery.reportDate, $lte: new Date(filters.endDate) };
  }
  if (filters.status) {
    reportQuery.status = filters.status;
  }
  if (filters.employeeId) {
    reportQuery.employeeId = new mongoose.Types.ObjectId(filters.employeeId);
  }

  const reports = await DailyReport.find(reportQuery)
    .sort({ reportDate: -1, employeeId: 1 })
    .limit(filters.limit || 100)
    .populate('employeeId', 'name email employeeId position')
    .populate('tasksCompleted.taskId', 'title description status')
    .lean();

  // Group reports by employee
  const reportsByEmployee = {};
  reports.forEach(report => {
    const empId = report.employeeId._id.toString();
    if (!reportsByEmployee[empId]) {
      reportsByEmployee[empId] = {
        employee: report.employeeId,
        reports: []
      };
    }
    reportsByEmployee[empId].reports.push(report);
  });

  // Add employees with no reports
  employees.forEach(emp => {
    const empId = emp._id.toString();
    if (!reportsByEmployee[empId]) {
      reportsByEmployee[empId] = {
        employee: emp,
        reports: []
      };
    }
  });

  return {
    reports,
    employees: Object.values(reportsByEmployee),
    summary: {
      totalEmployees: employees.length,
      employeesWithReports: Object.keys(reportsByEmployee).filter(
        empId => reportsByEmployee[empId].reports.length > 0
      ).length,
      totalReports: reports.length,
      submittedReports: reports.filter(r => r.status === 'submitted').length,
      pendingReports: reports.filter(r => r.status === 'draft').length
    }
  };
};

/**
 * Get a specific daily report by ID
 */
export const getDailyReportById = async (reportId, userId, userRole) => {
  const report = await DailyReport.findById(reportId)
    .populate('employeeId', 'name email employeeId department position')
    .populate('tasksCompleted.taskId', 'title description status priority')
    .populate('reviewedBy', 'name email')
    .lean();

  if (!report) {
    throw new ResourceNotFoundError('Daily Report');
  }

  // Authorization check
  const isEmployee = userRole === 'employee' && report.employeeId._id.toString() === userId;
  const isDeptLead = userRole === 'dept_lead';
  const isManager = userRole === 'manager';
  const isAdmin = userRole === 'admin';

  if (!isEmployee && !isDeptLead && !isManager && !isAdmin) {
    throw new InvalidInputError('You do not have permission to view this report');
  }

  return report;
};

/**
 * Review a daily report (dept_lead can review)
 */
export const reviewDailyReport = async (reportId, deptLeadId, reviewData) => {
  const report = await DailyReport.findById(reportId);
  
  if (!report) {
    throw new ResourceNotFoundError('Daily Report');
  }

  // Verify dept_lead has access to this employee's department
  const deptLead = await User.findById(deptLeadId).select('department departmentId').lean();
  const employee = await User.findById(report.employeeId).select('department departmentId').lean();

  if (!deptLead || !employee) {
    throw new ResourceNotFoundError('User');
  }

  // Check if dept_lead manages this employee's department
  const sameDepartment = 
    (deptLead.departmentId && employee.departmentId && 
     deptLead.departmentId.toString() === employee.departmentId.toString()) ||
    (deptLead.department && employee.department && 
     deptLead.department === employee.department);

  if (!sameDepartment) {
    throw new InvalidInputError('You can only review reports from your department employees');
  }

  report.status = 'reviewed';
  report.reviewedBy = new mongoose.Types.ObjectId(deptLeadId);
  report.reviewedAt = Date.now();
  report.reviewComments = reviewData.comments || '';

  await report.save();

  return report;
};

/**
 * Get daily report statistics for a department
 */
export const getDepartmentReportStats = async (deptLeadId, period = 'week') => {
  const deptLead = await User.findById(deptLeadId).select('department departmentId').lean();
  
  if (!deptLead) {
    throw new ResourceNotFoundError('Department Lead');
  }

  const now = new Date();
  let startDate;
  
  if (period === 'week') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 30);
  }

  const query = {
    role: 'employee',
    status: { $in: ['active', 'on-leave'] }
  };

  if (deptLead.departmentId) {
    query.departmentId = deptLead.departmentId;
  } else if (deptLead.department) {
    query.department = deptLead.department;
  } else {
    return {
      totalEmployees: 0,
      employeesWithReports: 0,
      submissionRate: 0,
      averageHoursWorked: 0,
      totalHoursWorked: 0
    };
  }

  const employees = await User.find(query).select('_id').lean();
  const employeeIds = employees.map(emp => emp._id);

  const reports = await DailyReport.find({
    employeeId: { $in: employeeIds },
    reportDate: { $gte: startDate },
    status: 'submitted'
  }).lean();

  const uniqueEmployeesWithReports = new Set(reports.map(r => r.employeeId.toString()));
  const totalHours = reports.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);

  return {
    totalEmployees: employees.length,
    employeesWithReports: uniqueEmployeesWithReports.size,
    submissionRate: employees.length > 0 
      ? Math.round((uniqueEmployeesWithReports.size / employees.length) * 100)
      : 0,
    averageHoursWorked: reports.length > 0 
      ? Math.round((totalHours / reports.length) * 10) / 10
      : 0,
    totalHoursWorked: totalHours,
    totalReports: reports.length
  };
};
