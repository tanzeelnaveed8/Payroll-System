import Task from '../models/Task.js';
import User from '../models/User.js';
import { 
  ResourceNotFoundError, 
  InvalidInputError, 
  AccessDeniedError 
} from '../utils/errorHandler.js';
import { sendSuccess, sendPaginated } from '../utils/responseHandler.js';
import { buildSort, buildPagination, addSearchToQuery } from '../utils/queryBuilder.js';
import { logUserAction } from '../utils/auditLogger.js';
import {
  assignTask,
  updateTaskStatus,
  calculateProgress,
  checkOverdue,
  denormalizeEmployeeInfo
} from '../services/taskService.js';
import mongoose from 'mongoose';

export const getTasks = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'assignedDate', 
      order = 'desc',
      search,
      employeeId,
      status,
      priority,
      assignedBy,
      dueDateFrom,
      dueDateTo
    } = req.query;
    
    const pagination = buildPagination(page, limit);
    const sortObj = buildSort(sort, order);
    
    let query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (employeeId) query.employeeId = mongoose.Types.ObjectId.isValid(employeeId) ? new mongoose.Types.ObjectId(employeeId) : employeeId;
    if (assignedBy) query.assignedBy = mongoose.Types.ObjectId.isValid(assignedBy) ? new mongoose.Types.ObjectId(assignedBy) : assignedBy;
    
    if (dueDateFrom || dueDateTo) {
      query.dueDate = {};
      if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo);
    }
    
    // Role-based filtering
    if (req.user.role === 'employee') {
      // Employees only see their own tasks
      query.employeeId = req.user._id;
    } else if (req.user.role === 'dept_lead') {
      // Dept leads see tasks assigned to them and tasks they assigned to their department employees
      try {
        // Get employees in the same department as dept_lead
        const deptLead = await User.findById(req.user._id).select('department').lean();
        const departmentEmployees = await User.find({
          department: deptLead?.department,
          role: 'employee',
          status: { $in: ['active', 'on-leave'] }
        }).select('_id').lean();
        
        const deptEmployeeIds = departmentEmployees.map(emp => emp._id.toString());
        deptEmployeeIds.push(req.user._id.toString()); // Include dept_lead's own tasks
        
        query.$or = [
          { employeeId: { $in: deptEmployeeIds.map(id => new mongoose.Types.ObjectId(id)) } },
          { assignedBy: req.user._id } // Tasks assigned by dept_lead
        ];
      } catch (err) {
        console.error('[getTasks] Error fetching department employees for dept_lead:', err);
        query.employeeId = req.user._id; // Fallback to own tasks
      }
    } else if (req.user.role === 'manager') {
      // Managers see tasks from their direct reports + their own tasks
      try {
        const directReports = await User.find({
          $or: [
            { managerId: req.user._id },
            { reportsTo: req.user._id }
          ],
          status: { $in: ['active', 'on-leave'] }
        }).select('_id').lean().exec();
        
        const reportIds = directReports.map(u => u._id.toString());
        reportIds.push(req.user._id.toString());
        
        // Ensure we have at least the manager's own ID
        if (reportIds.length === 0) {
          reportIds.push(req.user._id.toString());
        }
        
        // Convert to ObjectIds for query - handle empty array case
        if (reportIds.length > 0) {
          query.employeeId = { $in: reportIds.map(id => {
            try {
              return new mongoose.Types.ObjectId(id);
            } catch (err) {
              console.error(`Invalid ObjectId: ${id}`, err);
              return null;
            }
          }).filter(id => id !== null) };
        } else {
          // Fallback: just manager's own tasks
          query.employeeId = req.user._id;
        }
        
        console.log(`[getTasks] Manager ${req.user._id} has ${directReports.length} direct reports, query includes ${reportIds.length} employees`);
      } catch (err) {
        console.error('[getTasks] Error fetching direct reports for manager:', err);
        // Fallback: just manager's own tasks if query fails
        query.employeeId = req.user._id;
      }
    }
    // Admin role: no filter applied, sees all tasks (query remains empty for employeeId)
    
    if (search) {
      addSearchToQuery(query, search, ['title', 'description', 'category']);
    }
    
    console.log(`[getTasks] User role: ${req.user.role}, Query:`, JSON.stringify(query, null, 2));
    
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('employeeId', 'name email employeeId department')
        .populate('assignedBy', 'name email')
        .sort(sortObj)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .exec(),
      Task.countDocuments(query).exec()
    ]);
    
    console.log(`[getTasks] Found ${tasks?.length || 0} tasks, total: ${total || 0}`);
    
    // Transform tasks to include denormalized employee info
    const transformedTasks = (tasks || []).map(task => ({
      ...task,
      employeeName: task.employeeId?.name || task.employeeName || 'N/A',
      employeeEmail: task.employeeId?.email || task.employeeEmail,
      employeeDepartment: task.employeeId?.department || task.employeeDepartment,
      assignedByName: task.assignedBy?.name || task.assignedByName || 'N/A',
    }));
    
    return sendPaginated(res, 'Tasks retrieved successfully', transformedTasks || [], {
      page: pagination.page,
      limit: pagination.limit,
      total: total || 0,
      totalPages: Math.ceil((total || 0) / pagination.limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new InvalidInputError('Invalid task ID format'));
    }
    
    const task = await Task.findById(id)
      .populate('employeeId', 'name email employeeId department')
      .populate('assignedBy', 'name email')
      .populate('attachments')
      .lean();
    
    if (!task) {
      return next(new ResourceNotFoundError('Task'));
    }
    
    const employeeId = task.employeeId?._id || task.employeeId;
    const employeeIdStr = employeeId?.toString() || employeeId;
    
    if (req.user.role === 'employee' && employeeIdStr !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own tasks'));
    }
    
    if (req.user.role === 'manager' || req.user.role === 'admin') {
      // Admin and manager can view all tasks
      // No additional check needed
    } else if (req.user.role === 'dept_lead') {
      // Dept leads can view tasks assigned to them or tasks they assigned
      const isAssignedToDeptLead = employeeIdStr === req.user._id.toString();
      const isAssignedByDeptLead = task.assignedBy?.toString() === req.user._id.toString();
      
      if (!isAssignedToDeptLead && !isAssignedByDeptLead) {
        // Check if task is assigned to an employee in dept_lead's department
        const employee = await User.findById(employeeId);
        const deptLead = await User.findById(req.user._id).select('department').lean();
        
        if (!employee || employee.department !== deptLead?.department) {
          return next(new AccessDeniedError('You can only view tasks for your department'));
        }
      }
    }
    
    return sendSuccess(res, 200, 'Task retrieved successfully', { task });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { employeeId, title, description, priority, dueDate, estimatedHours, tags, category, attachments } = req.body;
    
    // Log incoming data for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[createTask] Incoming request data:', {
        employeeId,
        title,
        priority,
        dueDate,
        description: description ? 'provided' : 'not provided',
        estimatedHours,
      });
    }
    
    if (!employeeId || !title || !priority || !dueDate) {
      return next(new InvalidInputError('Employee ID, title, priority, and due date are required'));
    }
    
    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      return next(new InvalidInputError('Invalid due date format'));
    }
    
    // Allow today as valid due date, but not past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateOnly = new Date(dueDateObj);
    dueDateOnly.setHours(0, 0, 0, 0);
    
    if (dueDateOnly < today) {
      return next(new InvalidInputError('Due date cannot be in the past'));
    }
    
    // Verify assignment permissions
    const targetUser = await User.findById(employeeId);
    if (!targetUser) {
      return next(new ResourceNotFoundError('User not found'));
    }
    
    // Hierarchical task assignment rules:
    // 1. Admin and Manager can ONLY assign tasks to dept_lead (not directly to employees)
    // 2. Dept_lead can assign tasks to employees in their department
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      // Admin and Manager must assign to dept_lead only
      if (targetUser.role !== 'dept_lead') {
        return next(new AccessDeniedError(
          'You can only assign tasks to Department Leads. Department Leads will then assign tasks to relevant employees.'
        ));
      }
    } else if (req.user.role === 'dept_lead') {
      // Dept_lead can only assign to employees in their department
      const deptLead = await User.findById(req.user._id).select('department departmentId').lean();
      if (!deptLead) {
        return next(new ResourceNotFoundError('Department Lead not found'));
      }
      
      // Check if target is an employee
      if (targetUser.role !== 'employee') {
        return next(new AccessDeniedError('You can only assign tasks to employees in your department'));
      }
      
      // Check if employee is in the same department
      const sameDepartment = 
        (deptLead.departmentId && targetUser.departmentId && 
         deptLead.departmentId.toString() === targetUser.departmentId.toString()) ||
        (deptLead.department && targetUser.department && 
         deptLead.department === targetUser.department);
      
      if (!sameDepartment) {
        return next(new AccessDeniedError('You can only assign tasks to employees in your department'));
      }
    } else {
      // Employees cannot assign tasks
      return next(new AccessDeniedError('You do not have permission to assign tasks'));
    }
    
    const taskData = {
      employeeId,
      title,
      description,
      priority,
      dueDate: dueDateObj,
      estimatedHours,
      tags: Array.isArray(tags) ? tags : [],
      category,
      attachments: Array.isArray(attachments) ? attachments : []
    };
    
    const task = await assignTask(taskData, req.user._id);
    await denormalizeEmployeeInfo(task);
    
    console.log(`[createTask] Task created successfully:`, {
      id: task._id,
      title: task.title,
      employeeId: task.employeeId,
      assignedBy: req.user._id,
      status: task.status
    });
    
    logUserAction(req, 'create', 'Task', task._id, {
      title,
      employeeId,
      priority,
      dueDate
    });
    
    // Populate task before sending response
    const populatedTask = await Task.findById(task._id)
      .populate('employeeId', 'name email employeeId department')
      .populate('assignedBy', 'name email')
      .lean()
      .exec();
    
    return sendSuccess(res, 201, 'Task created successfully', { task: populatedTask });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, priority, dueDate, estimatedHours, actualHours, progress, tags, category, attachments } = req.body;
    
    const task = await Task.findById(id);
    if (!task) {
      return next(new ResourceNotFoundError('Task'));
    }
    
    const employeeId = task.employeeId.toString();
    const isEmployee = req.user.role === 'employee' && employeeId === req.user._id.toString();
    const isManager = req.user.role === 'manager' || req.user.role === 'admin';
    const isDeptLead = req.user.role === 'dept_lead';
    
    if (!isEmployee && !isManager && !isDeptLead) {
      return next(new AccessDeniedError('You do not have permission to update this task'));
    }
    
    // Dept_lead can only update tasks assigned to them or tasks they assigned
    if (isDeptLead && !isManager) {
      const isAssignedToDeptLead = employeeId === req.user._id.toString();
      const isAssignedByDeptLead = task.assignedBy?.toString() === req.user._id.toString();
      
      if (!isAssignedToDeptLead && !isAssignedByDeptLead) {
        // Check if task is assigned to an employee in dept_lead's department
        const employee = await User.findById(task.employeeId);
        const deptLead = await User.findById(req.user._id).select('department').lean();
        
        if (!employee || employee.department !== deptLead?.department) {
          return next(new AccessDeniedError('You can only update tasks for your department'));
        }
      }
    }
    
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return next(new InvalidInputError('Invalid due date format'));
      }
      task.dueDate = dueDateObj;
    }
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (progress !== undefined) {
      if (progress < 0 || progress > 100) {
        return next(new InvalidInputError('Progress must be between 0 and 100'));
      }
      task.progress = progress;
    }
    if (tags !== undefined) task.tags = Array.isArray(tags) ? tags : [];
    if (category !== undefined) task.category = category;
    if (attachments !== undefined) task.attachments = Array.isArray(attachments) ? attachments : [];
    
    await task.save();
    await denormalizeEmployeeInfo(task);
    
    logUserAction(req, 'update', 'Task', task._id, {
      changes: req.body
    });
    
    return sendSuccess(res, 200, 'Task updated successfully', { task });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatusEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return next(new InvalidInputError('Status is required'));
    }
    
    const task = await Task.findById(id);
    if (!task) {
      return next(new ResourceNotFoundError('Task'));
    }
    
    const employeeId = task.employeeId.toString();
    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only update your own tasks'));
    }
    
    const updatedTask = await updateTaskStatus(id, status, req.user._id);
    
    logUserAction(req, 'update_status', 'Task', task._id, {
      oldStatus: task.status,
      newStatus: status
    });
    
    return sendSuccess(res, 200, 'Task status updated successfully', { task: updatedTask });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id);
    if (!task) {
      return next(new ResourceNotFoundError('Task'));
    }
    
    if (req.user.role !== 'admin') {
      return next(new AccessDeniedError('Only administrators can delete tasks'));
    }
    
    await Task.findByIdAndDelete(id);
    
    logUserAction(req, 'delete', 'Task', task._id, {
      title: task.title
    });
    
    return sendSuccess(res, 200, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getEmployeeTasks = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 10, status, priority } = req.query;
    
    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own tasks'));
    }
    
    if (req.user.role === 'manager') {
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const isManager = employee.managerId?.toString() === req.user._id.toString() || 
                       employee.reportsTo?.toString() === req.user._id.toString();
      if (!isManager && employeeId !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only view tasks for your direct reports'));
      }
    } else if (req.user.role === 'dept_lead') {
      // Dept_lead can view tasks for employees in their department
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const deptLead = await User.findById(req.user._id).select('department departmentId').lean();
      if (!deptLead) {
        return next(new ResourceNotFoundError('Department Lead'));
      }
      
      // Check if employee is in dept_lead's department
      const sameDepartment = 
        (deptLead.departmentId && employee.departmentId && 
         deptLead.departmentId.toString() === employee.departmentId.toString()) ||
        (deptLead.department && employee.department && 
         deptLead.department === employee.department);
      
      if (!sameDepartment && employeeId !== req.user._id.toString()) {
        return next(new AccessDeniedError('You can only view tasks for employees in your department'));
      }
    }
    
    const pagination = buildPagination(page, limit);
    const query = { employeeId: new mongoose.Types.ObjectId(employeeId) };
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignedBy', 'name email')
        .sort({ assignedDate: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .exec(),
      Task.countDocuments(query).exec()
    ]);
    
    return sendPaginated(res, 'Employee tasks retrieved successfully', tasks || [], {
      page: pagination.page,
      limit: pagination.limit,
      total: total || 0,
      totalPages: Math.ceil((total || 0) / pagination.limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeCurrentTasks = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    
    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own tasks'));
    }
    
    if (req.user.role === 'dept_lead' && employeeId !== req.user._id.toString()) {
      // Dept_lead can view tasks for employees in their department
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const deptLead = await User.findById(req.user._id).select('department departmentId').lean();
      if (!deptLead) {
        return next(new ResourceNotFoundError('Department Lead'));
      }
      
      // Check if employee is in dept_lead's department
      const sameDepartment = 
        (deptLead.departmentId && employee.departmentId && 
         deptLead.departmentId.toString() === employee.departmentId.toString()) ||
        (deptLead.department && employee.department && 
         deptLead.department === employee.department);
      
      if (!sameDepartment) {
        return next(new AccessDeniedError('You can only view tasks for employees in your department'));
      }
    }
    
    const query = {
      employeeId: new mongoose.Types.ObjectId(employeeId),
      $or: [
        { status: 'in-progress' },
        { 
          status: 'pending',
          dueDate: { $lt: new Date() }
        }
      ]
    };
    
    const tasks = await Task.find(query)
      .populate('assignedBy', 'name email')
      .sort({ dueDate: 1 })
      .lean()
      .exec();
    
    return sendSuccess(res, 200, 'Current tasks retrieved successfully', { tasks: tasks || [] });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeUpcomingTasks = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    
    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return next(new AccessDeniedError('You can only view your own tasks'));
    }
    
    if (req.user.role === 'dept_lead' && employeeId !== req.user._id.toString()) {
      // Dept_lead can view tasks for employees in their department
      const employee = await User.findById(employeeId);
      if (!employee) {
        return next(new ResourceNotFoundError('Employee'));
      }
      const deptLead = await User.findById(req.user._id).select('department departmentId').lean();
      if (!deptLead) {
        return next(new ResourceNotFoundError('Department Lead'));
      }
      
      // Check if employee is in dept_lead's department
      const sameDepartment = 
        (deptLead.departmentId && employee.departmentId && 
         deptLead.departmentId.toString() === employee.departmentId.toString()) ||
        (deptLead.department && employee.department && 
         deptLead.department === employee.department);
      
      if (!sameDepartment) {
        return next(new AccessDeniedError('You can only view tasks for employees in your department'));
      }
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const query = {
      employeeId: new mongoose.Types.ObjectId(employeeId),
      status: 'pending',
      dueDate: { $gte: today }
    };
    
    const tasks = await Task.find(query)
      .populate('assignedBy', 'name email')
      .sort({ dueDate: 1 })
      .lean()
      .exec();
    
    return sendSuccess(res, 200, 'Upcoming tasks retrieved successfully', { tasks: tasks || [] });
  } catch (error) {
    next(error);
  }
};

