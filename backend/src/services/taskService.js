import Task from '../models/Task.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ResourceNotFoundError, InvalidInputError } from '../utils/errorHandler.js';

export const assignTask = async (taskData, assignedBy) => {
  const employee = await User.findById(taskData.employeeId);
  if (!employee) {
    throw new ResourceNotFoundError('Employee');
  }

  const assigner = await User.findById(assignedBy);
  if (!assigner) {
    throw new ResourceNotFoundError('Assigner');
  }

  const task = new Task({
    ...taskData,
    assignedBy,
    assignedByName: assigner.name,
    status: 'pending',
    progress: 0,
    assignedDate: new Date(),
  });

  await task.save();

  await Notification.create({
    userId: taskData.employeeId,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: `${assigner.name} assigned you a task: ${taskData.title}`,
    relatedEntityType: 'task',
    relatedEntityId: task._id,
    priority: taskData.priority === 'urgent' || taskData.priority === 'high' ? 'high' : 'medium',
    actionUrl: `/employee/tasks/${task._id}`,
    actionLabel: 'View Task'
  });

  return task;
};

export const updateTaskStatus = async (taskId, newStatus, userId) => {
  const task = await Task.findById(taskId).populate('employeeId assignedBy');
  if (!task) {
    throw new ResourceNotFoundError('Task');
  }

  const validTransitions = {
    'pending': ['in-progress', 'cancelled'],
    'in-progress': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
  };

  if (!validTransitions[task.status]?.includes(newStatus)) {
    throw new InvalidInputError(`Cannot transition from ${task.status} to ${newStatus}`);
  }

  const oldStatus = task.status;
  task.status = newStatus;

  if (newStatus === 'in-progress' && !task.startDate) {
    task.startDate = new Date();
  }

  if (newStatus === 'completed') {
    task.completedDate = new Date();
    task.progress = 100;
  }

  // Recalculate progress if status changed
  task.progress = calculateProgress(task);
  
  await task.save();
  await denormalizeEmployeeInfo(task);

  if (oldStatus !== newStatus) {
    const assigner = task.assignedBy;
    if (assigner && assigner._id.toString() !== userId.toString()) {
      // Use 'task_completed' if status changed to completed, otherwise use 'performance_update'
      const notificationType = newStatus === 'completed' ? 'task_completed' : 'performance_update';
      await Notification.create({
        userId: assigner._id,
        type: notificationType,
        title: 'Task Status Updated',
        message: `${task.employeeId.name} updated task "${task.title}" from ${oldStatus} to ${newStatus}`,
        relatedEntityType: 'task',
        relatedEntityId: task._id,
        priority: 'low',
        actionUrl: `/admin/tasks/${task._id}`,
        actionLabel: 'View Task'
      });
    }
  }

  return task;
};

export const calculateProgress = (task) => {
  if (task.status === 'completed') return 100;
  if (task.status === 'cancelled') return 0;
  if (task.status === 'pending') return 0;
  return task.progress || 0;
};

export const checkOverdue = async (employeeId = null) => {
  const query = {
    status: { $in: ['pending', 'in-progress'] },
    dueDate: { $lt: new Date() }
  };

  if (employeeId) {
    query.employeeId = employeeId;
  }

  const overdueTasks = await Task.find(query)
    .populate('employeeId', 'name email')
    .populate('assignedBy', 'name email')
    .lean();

  for (const task of overdueTasks) {
    const daysOverdue = Math.floor((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
    
    await Notification.create({
      userId: task.employeeId._id,
      type: 'task_overdue',
      title: 'Overdue Task',
      message: `Task "${task.title}" is ${daysOverdue} day(s) overdue`,
      relatedEntityType: 'task',
      relatedEntityId: task._id,
      priority: 'high',
      actionUrl: `/employee/tasks/${task._id}`,
      actionLabel: 'View Task'
    });
  }

  return overdueTasks;
};

export const denormalizeEmployeeInfo = async (task) => {
  const employee = await User.findById(task.employeeId);
  if (employee) {
    task.employeeName = employee.name;
    task.employeeEmail = employee.email;
    task.employeeDepartment = employee.department;
    await task.save();
  }
  return task;
};

