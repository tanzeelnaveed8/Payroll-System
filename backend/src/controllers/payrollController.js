import PayrollPeriod from '../models/PayrollPeriod.js';
import PayStub from '../models/PayStub.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Setting from '../models/Setting.js';
import { sendSuccess, sendPaginated } from '../utils/responseHandler.js';
import { ResourceNotFoundError, InvalidInputError, AccessDeniedError } from '../utils/errorHandler.js';
import { buildPagination, buildSort } from '../utils/queryBuilder.js';
import {
  processPayrollForPeriod,
  generatePaystub,
} from '../services/payrollCalculationService.js';
import { generatePaystubPDF } from '../utils/pdfGenerator.js';
import mongoose from 'mongoose';

export const getPayrollPeriods = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', status, departmentId, dateFrom, dateTo } = req.query;

    const pagination = buildPagination(page, limit);
    const sortObj = buildSort(sort, order);

    const query = {};
    if (status) query.status = status;
    if (departmentId) query.departmentId = new mongoose.Types.ObjectId(departmentId);
    if (dateFrom || dateTo) {
      query.periodStart = {};
      if (dateFrom) query.periodStart.$gte = new Date(dateFrom);
      if (dateTo) query.periodStart.$lte = new Date(dateTo);
    }

    const [periods, total] = await Promise.all([
      PayrollPeriod.find(query)
        .populate('departmentId', 'name')
        .populate('processedBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort(sortObj)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      PayrollPeriod.countDocuments(query),
    ]);

    return sendPaginated(res, 'Payroll periods retrieved successfully', periods, {
      ...pagination,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollPeriodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const period = await PayrollPeriod.findById(id)
      .populate('departmentId', 'name')
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email')
      .lean();

    if (!period) {
      return next(new ResourceNotFoundError('Payroll period'));
    }

    return sendSuccess(res, 200, 'Payroll period retrieved successfully', { period });
  } catch (error) {
    next(error);
  }
};

export const createPayrollPeriod = async (req, res, next) => {
  try {
    const { periodStart, periodEnd, payDate, departmentId, department } = req.body;

    if (!periodStart || !periodEnd || !payDate) {
      return next(new InvalidInputError('Period start, end, and pay date are required'));
    }

    const periodData = {
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      payDate: new Date(payDate),
      status: 'draft',
      department: department || undefined,
      departmentId: departmentId ? new mongoose.Types.ObjectId(departmentId) : undefined,
      createdBy: req.user._id,
    };

    const period = await PayrollPeriod.create(periodData);

    return sendSuccess(res, 201, 'Payroll period created successfully', { period });
  } catch (error) {
    next(error);
  }
};

export const updatePayrollPeriod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const period = await PayrollPeriod.findById(id);

    if (!period) {
      return next(new ResourceNotFoundError('Payroll period'));
    }

    if (period.status === 'completed') {
      return next(new InvalidInputError('Cannot update a completed payroll period'));
    }

    const updateData = { ...req.body };
    if (updateData.periodStart) updateData.periodStart = new Date(updateData.periodStart);
    if (updateData.periodEnd) updateData.periodEnd = new Date(updateData.periodEnd);
    if (updateData.payDate) updateData.payDate = new Date(updateData.payDate);
    if (updateData.departmentId) updateData.departmentId = new mongoose.Types.ObjectId(updateData.departmentId);

    Object.assign(period, updateData);
    await period.save();

    return sendSuccess(res, 200, 'Payroll period updated successfully', { period });
  } catch (error) {
    next(error);
  }
};

export const processPayroll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const period = await PayrollPeriod.findById(id);

    if (!period) {
      return next(new ResourceNotFoundError('Payroll period'));
    }

    if (period.status === 'completed') {
      return next(new InvalidInputError('Payroll period is already completed'));
    }

    const result = await processPayrollForPeriod(id, req.user._id);

    return sendSuccess(res, 200, 'Payroll processed successfully', {
      period: await PayrollPeriod.findById(id).lean(),
      paystubsCount: result.paystubs.length,
      totals: result.totals,
    });
  } catch (error) {
    console.error('Error processing payroll:', error);
    next(error);
  }
};

export const approvePayroll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const period = await PayrollPeriod.findById(id);

    if (!period) {
      return next(new ResourceNotFoundError('Payroll period'));
    }

    if (period.status !== 'processing') {
      return next(new InvalidInputError('Payroll period must be in processing status to approve'));
    }

    await PayStub.updateMany(
      { payrollPeriodId: id, status: 'processing' },
      { status: 'paid' }
    );

    await PayrollPeriod.findByIdAndUpdate(id, {
      status: 'completed',
      approvedBy: req.user._id,
      approvedAt: new Date(),
    });

    return sendSuccess(res, 200, 'Payroll approved successfully', {
      period: await PayrollPeriod.findById(id).lean(),
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentPeriod = async (req, res, next) => {
  try {
    const now = new Date();
    const period = await PayrollPeriod.findOne({
      periodStart: { $lte: now },
      periodEnd: { $gte: now },
      status: { $in: ['draft', 'processing'] },
    })
      .populate('departmentId', 'name')
      .lean();

    if (!period) {
      return sendSuccess(res, 200, 'No current period found', { period: null });
    }

    return sendSuccess(res, 200, 'Current period retrieved successfully', { period });
  } catch (error) {
    next(error);
  }
};

export const getNextPayDate = async (req, res, next) => {
  try {
    const settings = await Setting.findOne({ type: 'payroll' });
    const payrollSettings = settings?.payroll || {};

    if (!payrollSettings.salaryCycle || !payrollSettings.payDay) {
      return sendSuccess(res, 200, 'Payroll settings not configured', { nextPayDate: null });
    }

    const today = new Date();
    let nextPayDate = new Date();

    if (payrollSettings.salaryCycle === 'weekly') {
      const daysUntilPayDay = (payrollSettings.payDay - today.getDay() + 7) % 7 || 7;
      nextPayDate.setDate(today.getDate() + daysUntilPayDay);
    } else if (payrollSettings.salaryCycle === 'bi-weekly') {
      nextPayDate.setDate(today.getDate() + 14);
    } else if (payrollSettings.salaryCycle === 'monthly') {
      nextPayDate = new Date(today.getFullYear(), today.getMonth(), payrollSettings.payDay);
      if (nextPayDate <= today) {
        nextPayDate = new Date(today.getFullYear(), today.getMonth() + 1, payrollSettings.payDay);
      }
    } else if (payrollSettings.salaryCycle === 'semi-monthly') {
      const day = payrollSettings.payDay;
      if (today.getDate() < day) {
        nextPayDate = new Date(today.getFullYear(), today.getMonth(), day);
      } else {
        nextPayDate = new Date(today.getFullYear(), today.getMonth() + 1, day);
      }
    }

    return sendSuccess(res, 200, 'Next pay date calculated successfully', { nextPayDate });
  } catch (error) {
    next(error);
  }
};

export const getPaystubs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'payDate', order = 'desc', employeeId, payrollPeriodId, status } = req.query;

    const pagination = buildPagination(page, limit);
    const sortObj = buildSort(sort, order);

    const query = {};
    if (employeeId) query.employeeId = new mongoose.Types.ObjectId(employeeId);
    if (payrollPeriodId) query.payrollPeriodId = new mongoose.Types.ObjectId(payrollPeriodId);
    if (status) query.status = status;

    if (req.user.role === 'employee' && !employeeId) {
      query.employeeId = req.user._id;
    }

    const [paystubs, total] = await Promise.all([
      PayStub.find(query)
        .populate('employeeId', 'name email employeeId')
        .populate('payrollPeriodId')
        .sort(sortObj)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      PayStub.countDocuments(query),
    ]);

    return sendPaginated(res, 'Paystubs retrieved successfully', paystubs, {
      ...pagination,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaystubById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paystub = await PayStub.findById(id)
      .populate('employeeId', 'name email employeeId')
      .populate('payrollPeriodId')
      .lean();

    if (!paystub) {
      return next(new ResourceNotFoundError('Paystub'));
    }

    if (req.user.role === 'employee' && paystub.employeeId._id.toString() !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own paystubs'));
    }

    return sendSuccess(res, 200, 'Paystub retrieved successfully', { paystub });
  } catch (error) {
    next(error);
  }
};

export const getPaystubPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paystub = await PayStub.findById(id)
      .populate('employeeId', 'name email employeeId')
      .populate('payrollPeriodId')
      .lean();

    if (!paystub) {
      return next(new ResourceNotFoundError('Paystub'));
    }

    if (req.user.role === 'employee' && paystub.employeeId._id.toString() !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own paystubs'));
    }

    const settings = await Setting.findOne({ type: 'company' });
    const html = generatePaystubPDF(paystub, settings);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const getEmployeePaystubs = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own paystubs'));
    }

    const pagination = buildPagination(page, limit);

    const [paystubs, total] = await Promise.all([
      PayStub.find({ employeeId: new mongoose.Types.ObjectId(employeeId) })
        .populate('payrollPeriodId')
        .sort({ payDate: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      PayStub.countDocuments({ employeeId: new mongoose.Types.ObjectId(employeeId) }),
    ]);

    return sendPaginated(res, 'Employee paystubs retrieved successfully', paystubs, {
      ...pagination,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const calculatePayroll = async (req, res, next) => {
  try {
    const { periodId } = req.body;

    if (!periodId) {
      return next(new InvalidInputError('Period ID is required'));
    }

    const period = await PayrollPeriod.findById(periodId);
    if (!period) {
      return next(new ResourceNotFoundError('Payroll period'));
    }

    const result = await processPayrollForPeriod(periodId, req.user._id);

    return sendSuccess(res, 200, 'Payroll calculated successfully', {
      period: await PayrollPeriod.findById(periodId).lean(),
      paystubsCount: result.paystubs.length,
      totals: result.totals,
    });
  } catch (error) {
    console.error('Error calculating payroll:', error);
    next(error);
  }
};

