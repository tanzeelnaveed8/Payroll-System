import ProgressUpdate from '../models/ProgressUpdate.js';
import User from '../models/User.js';
import DailyReport from '../models/DailyReport.js';
import Task from '../models/Task.js';
import { ResourceNotFoundError, InvalidInputError } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

/**
 * Create or update a progress update from dept_lead
 */
export const createOrUpdateProgressUpdate = async (deptLeadId, updateData) => {
  const deptLead = await User.findById(deptLeadId)
    .select('name department departmentId role')
    .lean();
  
  if (!deptLead) {
    throw new ResourceNotFoundError('Department Lead');
  }

  if (deptLead.role !== 'dept_lead') {
    throw new InvalidInputError('Only department leads can create progress updates');
  }

  // Get department employees for metrics
  const query = {
    role: 'employee',
    status: { $in: ['active', 'on-leave'] }
  };

  if (deptLead.departmentId) {
    query.departmentId = deptLead.departmentId;
  } else if (deptLead.department) {
    query.department = deptLead.department;
  } else {
    throw new InvalidInputError('Department Lead must be assigned to a department');
  }

  const employees = await User.find(query).select('_id').lean();
  const employeeIds = employees.map(emp => emp._id);

  // Calculate metrics for the period
  const periodStart = new Date(updateData.periodStart);
  const periodEnd = new Date(updateData.periodEnd);
  periodEnd.setHours(23, 59, 59, 999);

  // Get daily reports for the period
  const reports = await DailyReport.find({
    employeeId: { $in: employeeIds },
    reportDate: { $gte: periodStart, $lte: periodEnd }
  }).lean();

  const submittedReports = reports.filter(r => r.status === 'submitted');
  const pendingReports = reports.filter(r => r.status === 'draft');

  // Get task statistics
  const [tasksCompleted, tasksInProgress, tasksOverdue] = await Promise.all([
    Task.countDocuments({
      employeeId: { $in: employeeIds },
      status: 'completed',
      completedDate: { $gte: periodStart, $lte: periodEnd }
    }),
    Task.countDocuments({
      employeeId: { $in: employeeIds },
      status: 'in-progress'
    }),
    Task.countDocuments({
      employeeId: { $in: employeeIds },
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() }
    })
  ]);

  const totalTasks = await Task.countDocuments({
    employeeId: { $in: employeeIds }
  });

  const completionRate = totalTasks > 0 
    ? Math.round((tasksCompleted / totalTasks) * 100)
    : 0;

  // Get all managers and admins as recipients
  const recipients = await User.find({
    role: { $in: ['admin', 'manager'] },
    status: 'active'
  }).select('_id role').lean();

  const updatePayload = {
    deptLeadId: new mongoose.Types.ObjectId(deptLeadId),
    deptLeadName: deptLead.name,
    departmentId: deptLead.departmentId,
    department: deptLead.department,
    updateDate: updateData.updateDate ? new Date(updateData.updateDate) : new Date(),
    periodStart,
    periodEnd,
    totalEmployees: employees.length,
    activeEmployees: employees.length, // Can be refined based on status
    reportsSubmitted: submittedReports.length,
    reportsPending: pendingReports.length,
    tasksCompleted,
    tasksInProgress,
    tasksOverdue,
    completionRate,
    highlights: updateData.highlights || [],
    challenges: updateData.challenges || [],
    resourceNeeds: updateData.resourceNeeds || [],
    nextPeriodGoals: updateData.nextPeriodGoals || [],
    status: updateData.status || 'draft',
    recipients: recipients.map(rec => ({
      userId: rec._id,
      role: rec.role
    })),
    updatedAt: Date.now()
  };

  if (updatePayload.status === 'submitted' && !updatePayload.submittedAt) {
    updatePayload.submittedAt = Date.now();
  }

  // Check if update already exists for this period
  const existingUpdate = await ProgressUpdate.findOne({
    deptLeadId: new mongoose.Types.ObjectId(deptLeadId),
    periodStart: { $gte: periodStart, $lte: periodEnd },
    periodEnd: { $gte: periodStart, $lte: periodEnd }
  });

  let update;
  if (existingUpdate && updateData.updateId) {
    // Update existing
    Object.assign(existingUpdate, updatePayload);
    update = await existingUpdate.save();
  } else {
    // Create new
    update = await ProgressUpdate.create(updatePayload);
  }

  return update;
};

/**
 * Get progress updates for a dept_lead
 */
export const getDeptLeadProgressUpdates = async (deptLeadId, filters = {}) => {
  const query = {
    deptLeadId: new mongoose.Types.ObjectId(deptLeadId)
  };

  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.startDate) {
    query.updateDate = { ...query.updateDate, $gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    query.updateDate = { ...query.updateDate, $lte: new Date(filters.endDate) };
  }

  const updates = await ProgressUpdate.find(query)
    .sort({ updateDate: -1 })
    .limit(filters.limit || 50)
    .lean();

  return updates;
};

/**
 * Get progress updates visible to manager/admin
 */
export const getProgressUpdatesForManager = async (userId, userRole, filters = {}) => {
  if (userRole !== 'admin' && userRole !== 'manager') {
    throw new InvalidInputError('Only admins and managers can view progress updates');
  }

  const query = {
    status: { $in: ['submitted', 'acknowledged'] },
    'recipients.userId': new mongoose.Types.ObjectId(userId)
  };

  if (filters.departmentId) {
    query.departmentId = new mongoose.Types.ObjectId(filters.departmentId);
  }
  if (filters.deptLeadId) {
    query.deptLeadId = new mongoose.Types.ObjectId(filters.deptLeadId);
  }
  if (filters.startDate) {
    query.updateDate = { ...query.updateDate, $gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    query.updateDate = { ...query.updateDate, $lte: new Date(filters.endDate) };
  }

  const updates = await ProgressUpdate.find(query)
    .populate('deptLeadId', 'name email')
    .populate('departmentId', 'name code')
    .sort({ updateDate: -1 })
    .limit(filters.limit || 50)
    .lean();

  // Mark as viewed if not already
  for (const update of updates) {
    const recipient = update.recipients.find(
      r => r.userId.toString() === userId.toString()
    );
    if (recipient && !recipient.viewedAt) {
      await ProgressUpdate.updateOne(
        { _id: update._id, 'recipients.userId': new mongoose.Types.ObjectId(userId) },
        { $set: { 'recipients.$.viewedAt': new Date() } }
      );
    }
  }

  return updates;
};

/**
 * Get a specific progress update by ID
 */
export const getProgressUpdateById = async (updateId, userId, userRole) => {
  const update = await ProgressUpdate.findById(updateId)
    .populate('deptLeadId', 'name email')
    .populate('departmentId', 'name code')
    .populate('acknowledgedBy', 'name email')
    .lean();

  if (!update) {
    throw new ResourceNotFoundError('Progress Update');
  }

  // Authorization check
  const isDeptLead = userRole === 'dept_lead' && update.deptLeadId._id.toString() === userId;
  const isRecipient = update.recipients.some(
    r => r.userId.toString() === userId && (userRole === 'admin' || userRole === 'manager')
  );

  if (!isDeptLead && !isRecipient) {
    throw new InvalidInputError('You do not have permission to view this update');
  }

  return update;
};

/**
 * Acknowledge a progress update (manager/admin)
 */
export const acknowledgeProgressUpdate = async (updateId, userId, userRole, acknowledgmentData) => {
  if (userRole !== 'admin' && userRole !== 'manager') {
    throw new InvalidInputError('Only admins and managers can acknowledge progress updates');
  }

  const update = await ProgressUpdate.findById(updateId);
  
  if (!update) {
    throw new ResourceNotFoundError('Progress Update');
  }

  // Check if user is a recipient
  const isRecipient = update.recipients.some(
    r => r.userId.toString() === userId
  );

  if (!isRecipient) {
    throw new InvalidInputError('You are not authorized to acknowledge this update');
  }

  update.status = 'acknowledged';
  update.acknowledgedBy = new mongoose.Types.ObjectId(userId);
  update.acknowledgedAt = Date.now();
  update.acknowledgmentComments = acknowledgmentData.comments || '';

  await update.save();

  return update;
};
