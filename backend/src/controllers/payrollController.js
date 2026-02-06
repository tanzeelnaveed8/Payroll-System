import PayrollPeriod from '../models/PayrollPeriod.js';
import PayStub from '../models/PayStub.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import { sendSuccess, sendPaginated } from '../utils/responseHandler.js';
import { ResourceNotFoundError, InvalidInputError, AccessDeniedError } from '../utils/errorHandler.js';
import { buildPagination, buildSort } from '../utils/queryBuilder.js';
import {
  processPayrollForPeriod,
  generatePaystub,
} from '../services/payrollCalculationService.js';
import { generatePaystubPDF } from '../utils/pdfGenerator.js';
import { getPayPeriod, calculatePayDate } from '../utils/dateUtils.js';
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

    // Validate dates
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    const payDateObj = new Date(payDate);

    if (startDate >= endDate) {
      return next(new InvalidInputError('Period end date must be after period start date'));
    }

    if (payDateObj <= endDate) {
      return next(new InvalidInputError('Pay date must be after period end date'));
    }

    // Count active employees for the period
    const employeeCount = await User.countDocuments({
      status: 'active',
      role: { $in: ['employee', 'manager'] },
      ...(departmentId && { departmentId: new mongoose.Types.ObjectId(departmentId) })
    });

    const periodData = {
      periodStart: startDate,
      periodEnd: endDate,
      payDate: payDateObj,
      status: 'draft',
      department: department || undefined,
      departmentId: departmentId ? new mongoose.Types.ObjectId(departmentId) : undefined,
      employeeCount,
      createdBy: req.user._id,
    };

    const period = await PayrollPeriod.create(periodData);

    // Populate the created period before returning
    const populatedPeriod = await PayrollPeriod.findById(period._id)
      .populate('departmentId', 'name')
      .lean();

    return sendSuccess(res, 201, 'Payroll period created successfully', { period: populatedPeriod });
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
    
    // Validate dates
    if (updateData.periodStart) {
      updateData.periodStart = new Date(updateData.periodStart);
      if (isNaN(updateData.periodStart.getTime())) {
        return next(new InvalidInputError('Invalid period start date'));
      }
    }
    if (updateData.periodEnd) {
      updateData.periodEnd = new Date(updateData.periodEnd);
      if (isNaN(updateData.periodEnd.getTime())) {
        return next(new InvalidInputError('Invalid period end date'));
      }
    }
    if (updateData.payDate) {
      updateData.payDate = new Date(updateData.payDate);
      if (isNaN(updateData.payDate.getTime())) {
        return next(new InvalidInputError('Invalid pay date'));
      }
    }

    // Validate date order
    const periodStart = updateData.periodStart || period.periodStart;
    const periodEnd = updateData.periodEnd || period.periodEnd;
    const payDate = updateData.payDate || period.payDate;

    if (periodStart >= periodEnd) {
      return next(new InvalidInputError('Period end date must be after period start date'));
    }

    if (payDate <= periodEnd) {
      return next(new InvalidInputError('Pay date must be after period end date'));
    }

    // Validate employee count
    if (updateData.employeeCount !== undefined) {
      const employeeCount = parseInt(updateData.employeeCount);
      if (isNaN(employeeCount) || employeeCount < 0) {
        return next(new InvalidInputError('Employee count must be a non-negative number'));
      }
      updateData.employeeCount = employeeCount;
    }

    if (updateData.departmentId) {
      updateData.departmentId = new mongoose.Types.ObjectId(updateData.departmentId);
    }

    Object.assign(period, updateData);
    await period.save();

    // Notify managers and employees about period update (non-blocking)
    try {
      const managers = await User.find({ role: 'manager', status: 'active' }).select('_id');
      const employees = await User.find({ 
        role: { $in: ['employee', 'manager'] }, 
        status: 'active' 
      }).select('_id');

      const notifications = [];
      for (const user of [...managers, ...employees]) {
        // Determine action URL based on user role
        let actionUrl = '/employee/paystubs';
        if (user.role === 'manager') {
          actionUrl = '/manager/payroll';
        } else if (user.role === 'dept_lead') {
          actionUrl = '/dept_lead/payroll';
        } else if (period.status !== 'completed') {
          actionUrl = '/employee/paystubs';
        }
        
        notifications.push({
          userId: user._id,
          type: 'payroll_processed',
          title: 'Payroll Period Updated',
          message: `Payroll period ${new Date(period.periodStart).toLocaleDateString()} - ${new Date(period.periodEnd).toLocaleDateString()} has been updated.`,
          relatedEntityType: 'payroll_period',
          relatedEntityId: period._id,
          priority: 'low',
          actionUrl: actionUrl,
          actionLabel: 'View Details'
        });
      }

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifyError) {
      console.warn('Failed to send notifications for payroll period update:', notifyError.message);
    }

    const updatedPeriod = await PayrollPeriod.findById(id)
      .populate('departmentId', 'name')
      .lean();

    return sendSuccess(res, 200, 'Payroll period updated successfully', { period: updatedPeriod });
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

    // Notify all employees and managers about payroll processing (non-blocking)
    try {
      const employees = await User.find({ 
        role: { $in: ['employee', 'manager'] }, 
        status: 'active' 
      }).select('_id name email');

      const notifications = [];
      for (const user of employees) {
        // Determine action URL based on user role
        let actionUrl = '/employee/paystubs';
        if (user.role === 'manager') {
          actionUrl = '/manager/payroll';
        } else if (user.role === 'dept_lead') {
          actionUrl = '/dept_lead/payroll';
        }
        
        notifications.push({
          userId: user._id,
          type: 'payroll_processed',
          title: 'Payroll Processed',
          message: `Payroll for period ${new Date(period.periodStart).toLocaleDateString()} - ${new Date(period.periodEnd).toLocaleDateString()} has been processed. Your paystub is now available.`,
          relatedEntityType: 'payroll_period',
          relatedEntityId: period._id,
          priority: 'high',
          actionUrl: actionUrl,
          actionLabel: 'View Paystub'
        });
      }

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifyError) {
      console.warn('Failed to send notifications for payroll processing:', notifyError.message);
    }

    const updatedPeriod = await PayrollPeriod.findById(id)
      .populate('departmentId', 'name')
      .populate('processedBy', 'name email')
      .lean();

    return sendSuccess(res, 200, 'Payroll processed successfully', {
      period: updatedPeriod,
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

    // Notify all employees and managers about payroll approval (non-blocking)
    try {
      const employees = await User.find({ 
        role: { $in: ['employee', 'manager'] }, 
        status: 'active' 
      }).select('_id name email');

      const notifications = [];
      for (const user of employees) {
        // Determine action URL based on user role
        let actionUrl = '/employee/paystubs';
        if (user.role === 'manager') {
          actionUrl = '/manager/payroll';
        } else if (user.role === 'dept_lead') {
          actionUrl = '/dept_lead/payroll';
        }
        
        notifications.push({
          userId: user._id,
          type: 'payroll_processed',
          title: 'Payroll Approved and Paid',
          message: `Payroll for period ${new Date(period.periodStart).toLocaleDateString()} - ${new Date(period.periodEnd).toLocaleDateString()} has been approved and paid. Payment will be processed according to the pay date.`,
          relatedEntityType: 'payroll_period',
          relatedEntityId: id,
          priority: 'high',
          actionUrl: actionUrl,
          actionLabel: 'View Paystub'
        });
      }

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifyError) {
      console.warn('Failed to send notifications for payroll approval:', notifyError.message);
    }

    const updatedPeriod = await PayrollPeriod.findById(id)
      .populate('departmentId', 'name')
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email')
      .lean();

    return sendSuccess(res, 200, 'Payroll approved successfully', {
      period: updatedPeriod,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentPeriod = async (req, res, next) => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

    let period = await PayrollPeriod.findOne({
      periodStart: { $lte: now },
      periodEnd: { $gte: now },
      status: { $in: ['draft', 'processing'] },
    })
      .populate('departmentId', 'name')
      .sort({ periodStart: -1 })
      .lean();

    // If no current period exists, try to auto-create one based on payroll settings
    if (!period) {
      try {
        const settings = await Setting.findOne({ type: 'payroll' });
        const payrollSettings = settings?.payroll || {};

        // Only auto-create if payroll settings are configured
        if (payrollSettings.salaryCycle && payrollSettings.payDay !== undefined) {
          const { getPayPeriod, calculatePayDate } = await import('../utils/dateUtils.js');
          const { periodStart, periodEnd } = getPayPeriod(now, payrollSettings.salaryCycle, payrollSettings.payDay);
          const payDate = calculatePayDate(periodEnd, payrollSettings.salaryCycle, payrollSettings.payDay);

          // Normalize dates for comparison
          const normalizedStart = new Date(periodStart);
          normalizedStart.setHours(0, 0, 0, 0);
          const normalizedEnd = new Date(periodEnd);
          normalizedEnd.setHours(23, 59, 59, 999);

          // Check if we're actually in the calculated period and no period already exists for this range
          if (now >= normalizedStart && now <= normalizedEnd) {
            const existingPeriod = await PayrollPeriod.findOne({
              periodStart: normalizedStart,
              periodEnd: normalizedEnd,
            }).lean();

            if (!existingPeriod) {
              // Count active employees for the period
              const employeeCount = await User.countDocuments({
                status: 'active',
                role: { $in: ['employee', 'manager'] }
              }).catch(() => 0); // Default to 0 if count fails

              // Create the period
              const newPeriod = await PayrollPeriod.create({
                periodStart: normalizedStart,
                periodEnd: normalizedEnd,
                payDate,
                status: 'draft',
                employeeCount,
                createdBy: req.user._id,
              });

              period = await PayrollPeriod.findById(newPeriod._id)
                .populate('departmentId', 'name')
                .lean();
            } else {
              period = existingPeriod;
            }
          }
        }
      } catch (createError) {
        // If auto-create fails, log but don't fail the request
        console.warn('Failed to auto-create payroll period:', createError.message);
      }
    }

    if (!period) {
      return sendSuccess(res, 200, 'No current period found. Please create a payroll period manually or configure payroll settings for automatic period creation.', { 
        period: null,
        requiresManualCreation: true 
      });
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

