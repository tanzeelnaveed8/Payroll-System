import { AccessDeniedError } from '../utils/errorHandler.js';

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AccessDeniedError('You must be logged in to access this resource.'));
    }
    
    const userRole = req.user.role?.toString().toLowerCase() || req.user.roleName?.toString().toLowerCase();
    const flatRoles = roles.flat().map(r => r.toString().toLowerCase());
    
    if (!userRole || !flatRoles.includes(userRole)) {
      return next(
        new AccessDeniedError(`You do not have permission to perform this action. Required roles: ${roles.flat().join(', ')}. Your role: ${userRole || 'none'}`)
      );
    }
    
    next();
  };
};

export const authorizeSelfOrAdmin = (userIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AccessDeniedError('You must be logged in to access this resource.'));
    }
    
    const requestedUserId = req.params[userIdParam] || req.body[userIdParam];
    const isSelf = req.user._id.toString() === requestedUserId?.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isSelf && !isAdmin) {
      return next(new AccessDeniedError('You can only access your own resources.'));
    }
    
    next();
  };
};

export const authorizeManagerOrAdmin = () => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AccessDeniedError('You must be logged in to access this resource.'));
    }
    
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return next(new AccessDeniedError('Only managers and admins can access this resource.'));
    }
    
    next();
  };
};

export const authorizeManagerOfEmployee = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AccessDeniedError('You must be logged in to access this resource.'));
    }
    
    if (req.user.role === 'admin') {
      return next();
    }
    
    if (req.user.role === 'manager') {
      const employeeId = req.params.employeeId || req.params.id || req.body.employeeId;
      
      if (employeeId) {
        const User = (await import('../models/User.js')).default;
        const employee = await User.findById(employeeId);
        
        if (employee && employee.managerId?.toString() === req.user._id.toString()) {
          return next();
        }
      }
    }
    
    return next(new AccessDeniedError('You can only manage your direct reports.'));
  };
};


