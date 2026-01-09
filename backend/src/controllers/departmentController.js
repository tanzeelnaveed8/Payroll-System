import Department from '../models/Department.js';
import User from '../models/User.js';
import { ResourceNotFoundError, InvalidInputError, DuplicateResourceError } from '../utils/errorHandler.js';
import { sendSuccess, sendPaginated, createPagination } from '../utils/responseHandler.js';
import { buildQuery, buildSort, buildPagination, addSearchToQuery } from '../utils/queryBuilder.js';
import { logUserAction } from '../utils/auditLogger.js';
import mongoose from 'mongoose';

const getChanges = (before, after) => {
  const changes = {
    before: {},
    after: {},
    fields: [],
  };
  
  const fieldsToTrack = ['name', 'code', 'description', 'managerId', 'status', 'annualBudget', 'monthlyBudget'];
  
  fieldsToTrack.forEach(field => {
    const beforeVal = before[field]?.toString();
    const afterVal = after[field]?.toString();
    if (beforeVal !== afterVal) {
      changes.before[field] = before[field];
      changes.after[field] = after[field];
      changes.fields.push(field);
    }
  });
  
  return changes.fields.length > 0 ? changes : null;
};

const updateDepartmentEmployeeCounts = async (departmentId) => {
  if (!departmentId) return;
  
  const [employeeCount, activeEmployeeCount] = await Promise.all([
    User.countDocuments({ departmentId, status: { $ne: 'terminated' } }),
    User.countDocuments({ departmentId, status: 'active' }),
  ]);
  
  await Department.findByIdAndUpdate(departmentId, {
    employeeCount,
    activeEmployeeCount,
  });
};

export const getDepartments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'name', order = 'asc', search, status } = req.query;
    
    const pagination = buildPagination(page, limit);
    const sortObj = buildSort(sort, order);
    
    let query = {};
    
    if (status) query.status = status;
    
    if (search) {
      query = addSearchToQuery(query, search, ['name', 'code', 'description']);
    }
    
    const [departments, total] = await Promise.all([
      Department.find(query)
        .populate('managerId', 'name email role')
        .populate('parentDepartmentId', 'name code')
        .sort(sortObj)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Department.countDocuments(query),
    ]);
    
    return sendPaginated(res, 'Departments retrieved successfully', departments, {
      ...pagination,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findById(id)
      .populate('managerId', 'name email role phone')
      .populate('parentDepartmentId', 'name code description')
      .lean();
    
    if (!department) {
      return next(new ResourceNotFoundError('Department'));
    }
    
    return sendSuccess(res, 200, 'Department retrieved successfully', { department });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const departmentData = {
      ...req.body,
      name: req.body.name?.trim(),
      code: req.body.code?.trim().toUpperCase(),
      description: req.body.description?.trim(),
      ...(req.body.managerId && { 
        managerId: new mongoose.Types.ObjectId(req.body.managerId) 
      }),
      ...(req.body.parentDepartmentId && { 
        parentDepartmentId: new mongoose.Types.ObjectId(req.body.parentDepartmentId) 
      }),
      status: req.body.status || 'active',
      employeeCount: 0,
      activeEmployeeCount: 0,
      createdAt: new Date(),
      createdBy: req.user._id,
    };
    
    // Check for duplicate name
    if (departmentData.name) {
      const existing = await Department.findOne({ name: departmentData.name });
      if (existing) {
        return next(new DuplicateResourceError('A department with this name already exists'));
      }
    }
    
    // Check for duplicate code
    if (departmentData.code) {
      const existing = await Department.findOne({ code: departmentData.code });
      if (existing) {
        return next(new DuplicateResourceError('A department with this code already exists'));
      }
    }
    
    const department = await Department.create(departmentData);
    
    // Audit log
    await logUserAction(req, 'create', 'department', department._id, null, `Created department: ${department.name}`);
    
    const departmentResponse = await Department.findById(department._id)
      .populate('managerId', 'name email role')
      .populate('parentDepartmentId', 'name code')
      .lean();
    
    return sendSuccess(res, 201, 'Department created successfully', { department: departmentResponse });
  } catch (error) {
    if (error.code === 11000) {
      return next(new DuplicateResourceError('Department with this name or code already exists'));
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors || {}).map((e) => e.message);
      return next(new InvalidInputError(`Please check your information: ${errors.join('. ')}`));
    }
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findById(id);
    if (!department) {
      return next(new ResourceNotFoundError('Department'));
    }
    
    const before = {
      name: department.name,
      code: department.code,
      description: department.description,
      managerId: department.managerId,
      status: department.status,
      annualBudget: department.annualBudget,
      monthlyBudget: department.monthlyBudget,
    };
    
    const updateData = { ...req.body };
    
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.code) updateData.code = updateData.code.trim().toUpperCase();
    if (updateData.description) updateData.description = updateData.description.trim();
    if (updateData.managerId) {
      updateData.managerId = new mongoose.Types.ObjectId(updateData.managerId);
    }
    if (updateData.parentDepartmentId) {
      if (updateData.parentDepartmentId === id) {
        return next(new InvalidInputError('Department cannot be its own parent'));
      }
      updateData.parentDepartmentId = new mongoose.Types.ObjectId(updateData.parentDepartmentId);
    }
    
    Object.assign(department, updateData);
    await department.save();
    
    // Update employee counts
    await updateDepartmentEmployeeCounts(department._id);
    
    const after = {
      name: department.name,
      code: department.code,
      description: department.description,
      managerId: department.managerId,
      status: department.status,
      annualBudget: department.annualBudget,
      monthlyBudget: department.monthlyBudget,
    };
    
    // Audit log
    const changes = getChanges(before, after);
    await logUserAction(req, 'update', 'department', department._id, changes, `Updated department: ${department.name}`);
    
    const departmentResponse = await Department.findById(department._id)
      .populate('managerId', 'name email role')
      .populate('parentDepartmentId', 'name code')
      .lean();
    
    return sendSuccess(res, 200, 'Department updated successfully', { department: departmentResponse });
  } catch (error) {
    if (error.code === 11000) {
      return next(new DuplicateResourceError('Department with this name or code already exists'));
    }
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findById(id);
    if (!department) {
      return next(new ResourceNotFoundError('Department'));
    }
    
    // Check if department has employees
    const employeeCount = await User.countDocuments({ departmentId: id, status: { $ne: 'terminated' } });
    if (employeeCount > 0) {
      return next(new InvalidInputError(`Cannot delete department. It has ${employeeCount} active employee(s). Please reassign employees first.`));
    }
    
    // Check if department has child departments
    const childCount = await Department.countDocuments({ parentDepartmentId: id });
    if (childCount > 0) {
      return next(new InvalidInputError(`Cannot delete department. It has ${childCount} child department(s). Please reassign or delete child departments first.`));
    }
    
    await Department.findByIdAndDelete(id);
    
    // Audit log
    await logUserAction(req, 'delete', 'department', id, null, `Deleted department: ${department.name}`);
    
    return sendSuccess(res, 200, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getDepartmentEmployees = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    const department = await Department.findById(id);
    if (!department) {
      return next(new ResourceNotFoundError('Department'));
    }
    
    const pagination = buildPagination(page, limit);
    
    let query = { departmentId: id };
    if (status) query.status = status;
    
    const [employees, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('managerId', 'name email')
        .sort({ name: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      User.countDocuments(query),
    ]);
    
    return sendPaginated(res, 'Department employees retrieved successfully', employees, {
      ...pagination,
      total,
    });
  } catch (error) {
    next(error);
  }
};

