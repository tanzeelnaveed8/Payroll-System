import Report from '../models/Report.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import FileAttachment from '../models/FileAttachment.js';
import {
  ResourceNotFoundError,
  InvalidInputError,
  AccessDeniedError,
} from '../utils/errorHandler.js';
import { sendSuccess, sendPaginated } from '../utils/responseHandler.js';
import { buildSort, buildPagination, addSearchToQuery } from '../utils/queryBuilder.js';
import { logUserAction } from '../utils/auditLogger.js';
import {
  generateReport,
  saveReport,
  generatePayrollSummary,
  generateAttendanceOverview,
  generateLeaveAnalytics,
  generateDepartmentCosts,
} from '../services/reportService.js';
import {
  generatePayrollReport,
  generateAttendanceReport,
  generateLeaveReport,
  generateDepartmentCostReport,
  generateEmployeeReport,
  generateFinancialReport,
  generatePDF,
  generateExcel,
} from '../services/reportGenerationService.js';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs/promises';

/**
 * GET /api/reports - List reports with filters
 */
export const getReports = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'generatedAt',
      order = 'desc',
      type,
      dateFrom,
      dateTo,
      departmentId,
      createdBy,
    } = req.query;

    const pagination = buildPagination(page, limit);
    const sortObj = buildSort(sort, order);

    let query = {};

    // Apply filters
    if (type) query.reportType = type;
    if (createdBy) {
      query.generatedBy = mongoose.Types.ObjectId.isValid(createdBy)
        ? new mongoose.Types.ObjectId(createdBy)
        : createdBy;
    }
    if (departmentId) {
      query.departmentId = mongoose.Types.ObjectId.isValid(departmentId)
        ? new mongoose.Types.ObjectId(departmentId)
        : departmentId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.$or = [];
      if (dateFrom) {
        query.$or.push({ dateFrom: { $gte: new Date(dateFrom) } });
      }
      if (dateTo) {
        query.$or.push({ dateTo: { $lte: new Date(dateTo) } });
      }
    }

    // Role-based access: managers can only see their own reports
    if (req.user.role === 'manager') {
      query.generatedBy = req.user._id;
    }

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('generatedBy', 'name email')
        .populate('departmentId', 'name code')
        .sort(sortObj)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .exec(),
      Report.countDocuments(query).exec(),
    ]);

    return sendPaginated(res, 'Reports retrieved successfully', reports || [], {
      page: pagination.page,
      limit: pagination.limit,
      total: total || 0,
      totalPages: Math.ceil((total || 0) / pagination.limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/:id - Get report by ID
 */
export const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new InvalidInputError('Invalid report ID format'));
    }

    const report = await Report.findById(id)
      .populate('generatedBy', 'name email')
      .populate('departmentId', 'name code')
      .populate('pdfFileId')
      .populate('excelFileId')
      .lean()
      .exec();

    if (!report) {
      return next(new ResourceNotFoundError('Report'));
    }

    // Check access: managers can only view their own reports
    if (req.user.role === 'manager' && report.generatedBy?._id?.toString() !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own reports'));
    }

    return sendSuccess(res, 200, 'Report retrieved successfully', { report });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reports/generate - Generate a new report
 */
export const generateReportEndpoint = async (req, res, next) => {
  try {
    const { type, dateFrom, dateTo, departmentId, employeeId, expiresInDays = 30 } = req.body;

    // Validate date range
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return next(new InvalidInputError('Invalid date format'));
    }
    if (endDate < startDate) {
      return next(new InvalidInputError('End date must be after start date'));
    }

    // Generate report data (quick summary)
    const reportData = await generateReport(type, dateFrom, dateTo, {
      departmentId,
      employeeId,
    });

    // Generate detailed report data for file generation
    let detailedReportData = null;
    try {
      switch (type) {
        case 'payroll':
          detailedReportData = await generatePayrollReport(dateFrom, dateTo, departmentId);
          break;
        case 'attendance':
          detailedReportData = await generateAttendanceReport(dateFrom, dateTo, departmentId);
          break;
        case 'leave':
          detailedReportData = await generateLeaveReport(dateFrom, dateTo, departmentId);
          break;
        case 'department':
          detailedReportData = await generateDepartmentCostReport(dateFrom, dateTo);
          break;
        case 'employee':
          if (!employeeId) {
            throw new InvalidInputError('Employee ID is required for employee reports');
          }
          detailedReportData = await generateEmployeeReport(employeeId, dateFrom, dateTo);
          break;
        case 'financial':
          detailedReportData = await generateFinancialReport(dateFrom, dateTo, departmentId);
          break;
      }
    } catch (error) {
      console.error('Error generating detailed report data:', error);
      // Continue with basic report data if detailed generation fails
    }

    // Save report to database
    const report = await saveReport(reportData, req.user._id, expiresInDays);

    // Generate PDF and Excel files asynchronously (don't wait)
    Promise.all([
      generatePDF(type, detailedReportData || reportData, report._id, req.user).catch(err => {
        console.error('Error generating PDF:', err);
        return null;
      }),
      generateExcel(type, detailedReportData || reportData, report._id, req.user).catch(err => {
        console.error('Error generating Excel:', err);
        return null;
      }),
    ]).then(([pdfResult, excelResult]) => {
      // Update report with file attachments
      const updateData = {};
      if (pdfResult?.fileAttachment) {
        updateData.pdfFileId = pdfResult.fileAttachment._id;
      }
      if (excelResult?.fileAttachment) {
        updateData.excelFileId = excelResult.fileAttachment._id;
      }
      if (Object.keys(updateData).length > 0) {
        Report.findByIdAndUpdate(report._id, updateData).catch(err => {
          console.error('Error updating report with file attachments:', err);
        });
      }
    }).catch(err => {
      console.error('Error in file generation promise:', err);
    });

    // Populate before sending
    const populatedReport = await Report.findById(report._id)
      .populate('generatedBy', 'name email')
      .populate('departmentId', 'name code')
      .lean()
      .exec();

    logUserAction(req, 'create', 'Report', report._id, {
      type,
      dateFrom,
      dateTo,
      departmentId,
    });

    return sendSuccess(res, 201, 'Report generated successfully', { report: populatedReport });
  } catch (error) {
    console.error('Error generating report:', error);
    next(error);
  }
};

/**
 * GET /api/reports/:id/pdf - Download report as PDF
 */
export const getReportPDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new InvalidInputError('Invalid report ID format'));
    }

    const report = await Report.findById(id)
      .populate('pdfFileId')
      .lean()
      .exec();

    if (!report) {
      return next(new ResourceNotFoundError('Report'));
    }

    // Check access
    if (req.user.role === 'manager' && report.generatedBy?.toString() !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only access your own reports'));
    }

    // Check if PDF exists
    if (!report.pdfFileId) {
      return next(new ResourceNotFoundError('PDF file is still being generated. Please try again in a few moments.'));
    }

    const fileAttachment = await FileAttachment.findById(report.pdfFileId);
    if (!fileAttachment) {
      return next(new ResourceNotFoundError('PDF file attachment not found'));
    }

    // Check if file exists
    const fs = await import('fs/promises');
    try {
      await fs.access(fileAttachment.filePath);
    } catch (error) {
      return next(new ResourceNotFoundError('PDF file not found on disk'));
    }

    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileAttachment.originalFileName || 'report.pdf'}"`);

    // Stream the file
    const { createReadStream } = await import('fs');
    const fileStream = createReadStream(fileAttachment.filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/:id/excel - Download report as Excel
 */
export const getReportExcel = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new InvalidInputError('Invalid report ID format'));
    }

    const report = await Report.findById(id)
      .populate('excelFileId')
      .lean()
      .exec();

    if (!report) {
      return next(new ResourceNotFoundError('Report'));
    }

    // Check access
    if (req.user.role === 'manager' && report.generatedBy?.toString() !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only access your own reports'));
    }

    // Check if Excel exists
    if (!report.excelFileId) {
      return next(new ResourceNotFoundError('Excel file is still being generated. Please try again in a few moments.'));
    }

    const fileAttachment = await FileAttachment.findById(report.excelFileId);
    if (!fileAttachment) {
      return next(new ResourceNotFoundError('Excel file attachment not found'));
    }

    // Check if file exists
    const fs = await import('fs/promises');
    try {
      await fs.access(fileAttachment.filePath);
    } catch (error) {
      return next(new ResourceNotFoundError('Excel file not found on disk'));
    }

    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileAttachment.originalFileName || 'report.xlsx'}"`);

    // Stream the file
    const { createReadStream } = await import('fs');
    const fileStream = createReadStream(fileAttachment.filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/payroll-summary - Get payroll summary (quick report)
 */
export const getPayrollSummary = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, departmentId } = req.query;

    if (!dateFrom || !dateTo) {
      return next(new InvalidInputError('Date range (dateFrom and dateTo) is required'));
    }

    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return next(new InvalidInputError('Invalid date format'));
    }

    const summary = await generatePayrollSummary(
      dateFrom,
      dateTo,
      departmentId || null
    );

    return sendSuccess(res, 200, 'Payroll summary retrieved successfully', { summary });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/attendance-overview - Get attendance overview (quick report)
 */
export const getAttendanceOverview = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, departmentId } = req.query;

    if (!dateFrom || !dateTo) {
      return next(new InvalidInputError('Date range (dateFrom and dateTo) is required'));
    }

    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return next(new InvalidInputError('Invalid date format'));
    }

    const overview = await generateAttendanceOverview(
      dateFrom,
      dateTo,
      departmentId || null
    );

    return sendSuccess(res, 200, 'Attendance overview retrieved successfully', { overview });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/leave-analytics - Get leave analytics (quick report)
 */
export const getLeaveAnalytics = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, departmentId } = req.query;

    if (!dateFrom || !dateTo) {
      return next(new InvalidInputError('Date range (dateFrom and dateTo) is required'));
    }

    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return next(new InvalidInputError('Invalid date format'));
    }

    const analytics = await generateLeaveAnalytics(
      dateFrom,
      dateTo,
      departmentId || null
    );

    return sendSuccess(res, 200, 'Leave analytics retrieved successfully', { analytics });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/department-costs - Get department costs (quick report)
 */
export const getDepartmentCosts = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return next(new InvalidInputError('Date range (dateFrom and dateTo) is required'));
    }

    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return next(new InvalidInputError('Invalid date format'));
    }

    const costs = await generateDepartmentCosts(dateFrom, dateTo);

    return sendSuccess(res, 200, 'Department costs retrieved successfully', { costs });
  } catch (error) {
    next(error);
  }
};
