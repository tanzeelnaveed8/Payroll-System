import User from '../models/User.js';
import Department from '../models/Department.js';
import { 
  ResourceNotFoundError, 
  InvalidInputError, 
  DuplicateResourceError,
  AuthenticationFailedError 
} from '../utils/errorHandler.js';
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
  
  const fieldsToTrack = ['name', 'email', 'role', 'department', 'status', 'employmentType', 'position', 'baseSalary', 'hourlyRate'];
  
  fieldsToTrack.forEach(field => {
    if (before[field] !== after[field]) {
      changes.before[field] = before[field];
      changes.after[field] = after[field];
      changes.fields.push(field);
    }
  });
  
  return changes.fields.length > 0 ? changes : null;
};

export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', search, role, status, employmentType, departmentId, department } = req.query;
    
    const pagination = buildPagination(page, limit);
    const sortObj = buildSort(sort, order);
    
    let query = {};
    
    // Apply filters
    if (role) query.role = role;
    if (status) query.status = status;
    if (employmentType) query.employmentType = employmentType;
    if (departmentId) query.departmentId = new mongoose.Types.ObjectId(departmentId);
    if (department) query.department = department;
    
    // Add search
    if (search) {
      query = addSearchToQuery(query, search, ['name', 'email', 'employeeId']);
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('departmentId', 'name code')
        .populate('managerId', 'name email')
        .sort(sortObj)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      User.countDocuments(query),
    ]);
    
    return sendPaginated(res, 'Users retrieved successfully', users, {
      ...pagination,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-password')
      .populate('departmentId', 'name code description')
      .populate('managerId', 'name email role')
      .lean();
    
    if (!user) {
      return next(new ResourceNotFoundError('User'));
    }
    
    return sendSuccess(res, 200, 'User retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const userData = {
      ...req.body,
      email: req.body.email?.toLowerCase().trim(),
      name: req.body.name?.trim(),
      ...(req.body.departmentId && { 
        departmentId: new mongoose.Types.ObjectId(req.body.departmentId) 
      }),
      status: req.body.status || 'active',
      createdAt: new Date(),
    };
    
    // Check for duplicate email
    if (userData.email) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return next(new DuplicateResourceError('An account with this email address already exists'));
      }
    }
    
    // Check for duplicate employeeId
    if (userData.employeeId) {
      const existingUser = await User.findOne({ employeeId: userData.employeeId });
      if (existingUser) {
        return next(new DuplicateResourceError('An account with this employee ID already exists'));
      }
    }
    
    // If departmentId is provided, update department field
    if (userData.departmentId) {
      const department = await Department.findById(userData.departmentId);
      if (department) {
        userData.department = department.name;
      }
    }
    
    const user = await User.create(userData);
    
    // Update department employee count
    if (user.departmentId) {
      await Department.findByIdAndUpdate(user.departmentId, {
        $inc: { employeeCount: 1, activeEmployeeCount: user.status === 'active' ? 1 : 0 }
      });
    }
    
    // Audit log
    await logUserAction(req, 'create', 'user', user._id, null, `Created user: ${user.name} (${user.email})`);
    
    const userResponse = await User.findById(user._id)
      .select('-password')
      .populate('departmentId', 'name code')
      .lean();
    
    return sendSuccess(res, 201, 'User created successfully', { user: userResponse });
  } catch (error) {
    if (error.code === 11000) {
      return next(new DuplicateResourceError('User with this email or employee ID already exists'));
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors || {}).map((e) => e.message);
      return next(new InvalidInputError(`Please check your information: ${errors.join('. ')}`));
    }
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Allow self-update for profile fields, admin for all fields
    const isSelf = req.user._id.toString() === id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isSelf && !isAdmin) {
      return next(new AuthenticationFailedError('You can only update your own profile'));
    }
    
    const user = await User.findById(id);
    if (!user) {
      return next(new ResourceNotFoundError('User'));
    }
    
    // If self-update, restrict to profile fields only
    let updateData = { ...req.body };
    if (isSelf && !isAdmin) {
      const allowedFields = ['name', 'phone', 'photo', 'bio', 'address', 'emergencyContact', 'preferences', 'dateOfBirth'];
      const restrictedData = {};
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          restrictedData[field] = updateData[field];
        }
      });
      updateData = restrictedData;
    }
    
    const before = {
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      employmentType: user.employmentType,
      position: user.position,
      baseSalary: user.baseSalary,
      hourlyRate: user.hourlyRate,
    };
    
    // Process update data
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
    }
    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }
    if (updateData.departmentId) {
      updateData.departmentId = new mongoose.Types.ObjectId(updateData.departmentId);
      const department = await Department.findById(updateData.departmentId);
      if (department) {
        updateData.department = department.name;
      }
    }
    
    // Don't allow password update through this endpoint
    delete updateData.password;
    
    Object.assign(user, updateData);
    await user.save();
    
    const after = {
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      employmentType: user.employmentType,
      position: user.position,
      baseSalary: user.baseSalary,
      hourlyRate: user.hourlyRate,
    };
    
    // Update department employee counts if department changed
    if (before.departmentId?.toString() !== user.departmentId?.toString()) {
      if (before.departmentId) {
        await Department.findByIdAndUpdate(before.departmentId, {
          $inc: { employeeCount: -1, activeEmployeeCount: before.status === 'active' ? -1 : 0 }
        });
      }
      if (user.departmentId) {
        await Department.findByIdAndUpdate(user.departmentId, {
          $inc: { employeeCount: 1, activeEmployeeCount: user.status === 'active' ? 1 : 0 }
        });
      }
    } else if (before.status !== user.status && user.departmentId) {
      // Status changed, update active count
      const statusChange = user.status === 'active' ? 1 : (before.status === 'active' ? -1 : 0);
      if (statusChange !== 0) {
        await Department.findByIdAndUpdate(user.departmentId, {
          $inc: { activeEmployeeCount: statusChange }
        });
      }
    }
    
    // Audit log
    const changes = getChanges(before, after);
    await logUserAction(req, 'update', 'user', user._id, changes, `Updated user: ${user.name}`);
    
    const userResponse = await User.findById(user._id)
      .select('-password')
      .populate('departmentId', 'name code')
      .populate('managerId', 'name email')
      .lean();
    
    return sendSuccess(res, 200, 'User updated successfully', { user: userResponse });
  } catch (error) {
    if (error.code === 11000) {
      return next(new DuplicateResourceError('User with this email or employee ID already exists'));
    }
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return next(new ResourceNotFoundError('User'));
    }
    
    // Soft delete - set status to terminated
    user.status = 'terminated';
    user.terminationDate = new Date();
    await user.save();
    
    // Update department employee counts
    if (user.departmentId) {
      await Department.findByIdAndUpdate(user.departmentId, {
        $inc: { employeeCount: -1, activeEmployeeCount: user.status === 'active' ? -1 : 0 }
      });
    }
    
    // Audit log
    await logUserAction(req, 'delete', 'user', user._id, null, `Deleted user: ${user.name}`);
    
    return sendSuccess(res, 200, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getCurrentUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('departmentId', 'name code description')
      .populate('managerId', 'name email role')
      .lean();
    
    if (!user) {
      return next(new ResourceNotFoundError('User'));
    }
    
    return sendSuccess(res, 200, 'Profile retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

export const updateCurrentUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ResourceNotFoundError('User'));
    }
    
    const before = {
      name: user.name,
      phone: user.phone,
      photo: user.photo,
      bio: user.bio,
    };
    
    // Only allow updating specific profile fields
    const allowedFields = ['name', 'phone', 'photo', 'bio', 'address', 'emergencyContact', 'preferences', 'dateOfBirth'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }
    if (updateData.phone) {
      updateData.phone = updateData.phone.trim();
    }
    
    Object.assign(user, updateData);
    await user.save();
    
    const after = {
      name: user.name,
      phone: user.phone,
      photo: user.photo,
      bio: user.bio,
    };
    
    // Audit log
    const changes = getChanges(before, after);
    await logUserAction(req, 'update', 'user', user._id, changes, 'Updated own profile');
    
    const userResponse = await User.findById(user._id)
      .select('-password')
      .populate('departmentId', 'name code')
      .lean();
    
    return sendSuccess(res, 200, 'Profile updated successfully', { user: userResponse });
  } catch (error) {
    next(error);
  }
};

export const getUniqueRoles = async (req, res, next) => {
  try {
    const roles = await User.distinct('role', { role: { $exists: true } });
    return sendSuccess(res, 200, 'Roles retrieved successfully', { roles });
  } catch (error) {
    next(error);
  }
};

export const getUniqueDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ status: 'active' }).select('name').lean();
    const departmentNames = departments.map(d => d.name).sort();
    return sendSuccess(res, 200, 'Departments retrieved successfully', { departments: departmentNames });
  } catch (error) {
    next(error);
  }
};

