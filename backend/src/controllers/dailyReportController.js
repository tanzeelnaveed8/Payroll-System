import {
  createOrUpdateDailyReport,
  getEmployeeDailyReports,
  getDepartmentDailyReports,
  getDailyReportById,
  reviewDailyReport,
  getDepartmentReportStats
} from '../services/dailyReportService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { logUserAction } from '../utils/auditLogger.js';

/**
 * POST /api/daily-reports
 * Create or update a daily report (employee)
 */
export const createDailyReport = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const report = await createOrUpdateDailyReport(employeeId, req.body);
    
    await logUserAction(employeeId, 'create_daily_report', {
      reportId: report._id,
      reportDate: report.reportDate
    });

    return sendSuccess(res, 201, 'Daily report created successfully', report);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/daily-reports/employee
 * Get daily reports for the logged-in employee
 */
export const getMyDailyReports = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const reports = await getEmployeeDailyReports(employeeId, req.query);
    return sendSuccess(res, 200, 'Daily reports retrieved successfully', { reports });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/daily-reports/department
 * Get daily reports for all employees in department (dept_lead)
 */
export const getDepartmentReports = async (req, res, next) => {
  try {
    const deptLeadId = req.user._id;
    const data = await getDepartmentDailyReports(deptLeadId, req.query);
    
    await logUserAction(deptLeadId, 'view_department_reports', {
      filters: req.query
    });

    return sendSuccess(res, 200, 'Department daily reports retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/daily-reports/:id
 * Get a specific daily report
 */
export const getReportById = async (req, res, next) => {
  try {
    const reportId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;
    const report = await getDailyReportById(reportId, userId, userRole);
    return sendSuccess(res, 200, 'Daily report retrieved successfully', report);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/daily-reports/:id/review
 * Review a daily report (dept_lead)
 */
export const reviewReport = async (req, res, next) => {
  try {
    const reportId = req.params.id;
    const deptLeadId = req.user._id;
    const report = await reviewDailyReport(reportId, deptLeadId, req.body);
    
    await logUserAction(deptLeadId, 'review_daily_report', {
      reportId: report._id,
      employeeId: report.employeeId
    });

    return sendSuccess(res, 200, 'Daily report reviewed successfully', report);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/daily-reports/department/stats
 * Get daily report statistics for department (dept_lead)
 */
export const getReportStats = async (req, res, next) => {
  try {
    const deptLeadId = req.user._id;
    const period = req.query.period || 'week';
    const stats = await getDepartmentReportStats(deptLeadId, period);
    return sendSuccess(res, 200, 'Report statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};
