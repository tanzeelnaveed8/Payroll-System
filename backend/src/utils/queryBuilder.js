import mongoose from 'mongoose';

export const buildQuery = (filters = {}) => {
  const query = {};
  
  // Search is handled separately in controllers using addSearchToQuery
  
  if (filters.department) {
    query.department = filters.department;
  }
  
  if (filters.departmentId) {
    query.departmentId = mongoose.Types.ObjectId.isValid(filters.departmentId) 
      ? new mongoose.Types.ObjectId(filters.departmentId)
      : filters.departmentId;
  }
  
  if (filters.role) {
    query.role = filters.role;
  }
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.employmentType) {
    query.employmentType = filters.employmentType;
  }
  
  if (filters.employeeId) {
    query.employeeId = mongoose.Types.ObjectId.isValid(filters.employeeId)
      ? new mongoose.Types.ObjectId(filters.employeeId)
      : filters.employeeId;
  }
  
  if (filters.userId) {
    query.userId = mongoose.Types.ObjectId.isValid(filters.userId)
      ? new mongoose.Types.ObjectId(filters.userId)
      : filters.userId;
  }
  
  if (filters.managerId) {
    query.managerId = mongoose.Types.ObjectId.isValid(filters.managerId)
      ? new mongoose.Types.ObjectId(filters.managerId)
      : filters.managerId;
  }
  
  if (filters.leaveType) {
    query.leaveType = filters.leaveType;
  }
  
  if (filters.priority) {
    query.priority = filters.priority;
  }
  
  if (filters.dateFrom || filters.dateTo) {
    query.date = {};
    if (filters.dateFrom) {
      query.date.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      query.date.$lte = new Date(filters.dateTo);
    }
  }
  
  if (filters.startDate || filters.endDate) {
    if (filters.startDate && filters.endDate) {
      query.$or = [
        {
          startDate: { $lte: new Date(filters.endDate) },
          endDate: { $gte: new Date(filters.startDate) },
        },
      ];
    } else if (filters.startDate) {
      query.endDate = { $gte: new Date(filters.startDate) };
    } else if (filters.endDate) {
      query.startDate = { $lte: new Date(filters.endDate) };
    }
  }
  
  if (filters.periodStart || filters.periodEnd) {
    if (filters.periodStart && filters.periodEnd) {
      query.$or = [
        {
          periodStart: { $lte: new Date(filters.periodEnd) },
          periodEnd: { $gte: new Date(filters.periodStart) },
        },
      ];
    }
  }
  
  if (filters.read !== undefined) {
    query.read = filters.read === 'true' || filters.read === true;
  }
  
  if (filters.type) {
    query.type = filters.type;
  }
  
  return query;
};

export const buildSort = (sortField, sortDirection = 'desc') => {
  const sort = {};
  if (sortField) {
    sort[sortField] = sortDirection === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }
  return sort;
};

export const buildPagination = (page = 1, limit = 10) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    skip,
  };
};

export const addSearchToQuery = (query, searchTerm, searchFields = []) => {
  if (!searchTerm || searchFields.length === 0) {
    return query;
  }
  
  const searchRegex = { $regex: searchTerm, $options: 'i' };
  const searchConditions = searchFields.map((field) => ({
    [field]: searchRegex,
  }));
  
  if (query.$or) {
    query.$or = [...query.$or, ...searchConditions];
  } else {
    query.$or = searchConditions;
  }
  
  return query;
};


