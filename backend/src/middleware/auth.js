import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errorHandler.js';
import User from '../models/User.js';
import UserSession from '../models/UserSession.js';

export const authenticate = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return next(new UnauthorizedError('You are not logged in! Please log in to get access.'));
    }
    
    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.id).select('+password');
    
    if (!user) {
      return next(new UnauthorizedError('The user belonging to this token does no longer exist.'));
    }
    
    if (user.status !== 'active') {
      return next(new UnauthorizedError('Your account has been deactivated.'));
    }
    
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return next(new UnauthorizedError('Your account has been locked. Please contact support.'));
    }
    
    const session = await UserSession.findOne({
      userId: user._id,
      sessionToken: token,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
    
    if (!session) {
      return next(new UnauthorizedError('Invalid or expired session. Please log in again.'));
    }
    
    session.lastActivity = new Date();
    await session.save();
    
    user.lastActiveAt = new Date();
    await user.save();
    
    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    if (error.message === 'Token expired') {
      return next(new UnauthorizedError('Your token has expired! Please log in again.'));
    }
    if (error.message === 'Invalid token') {
      return next(new UnauthorizedError('Invalid token. Please log in again!'));
    }
    return next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

