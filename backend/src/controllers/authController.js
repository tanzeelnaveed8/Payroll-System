import User from '../models/User.js';
import UserSession from '../models/UserSession.js';
import { comparePassword, generateResetToken, hashResetToken, generatePasswordResetExpiry } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { 
  AuthenticationFailedError, 
  ResourceNotFoundError, 
  InvalidInputError, 
  DuplicateResourceError,
  // Backward compatibility
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  ConflictError
} from '../utils/errorHandler.js';
import { addDays } from '../utils/dateUtils.js';

const getClientInfo = (req) => {
  return {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent') || '',
    deviceType: req.get('user-agent')?.includes('Mobile') ? 'mobile' : 
                req.get('user-agent')?.includes('Tablet') ? 'tablet' : 'desktop',
  };
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Additional validation (backup in case middleware fails)
    if (!email || !password) {
      return next(new InvalidInputError('Email address and password are required'));
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Login attempt:', { email: normalizedEmail, passwordLength: password.length });
    }
    
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('User not found for email:', normalizedEmail);
      }
      return next(new AuthenticationFailedError('The email address or password you entered is incorrect. Please try again.'));
    }
    
    if (!user.password) {
      console.error('User found but password field is missing:', user._id);
      return next(new AuthenticationFailedError('Account configuration error. Please contact support for assistance.'));
    }
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('User found:', { id: user._id, email: user.email, hasPassword: !!user.password, passwordStartsWith: user.password.substring(0, 10) });
    }
    
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Password comparison result:', isPasswordValid);
    }
    
    if (!isPasswordValid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = addDays(new Date(), 1);
        await user.save();
        return next(new AuthenticationFailedError('Your account has been temporarily locked due to multiple failed login attempts. Please contact support or try again later.'));
      }
      await user.save();
      
      return next(new AuthenticationFailedError('The email address or password you entered is incorrect. Please try again.'));
    }
    
    if (user.status !== 'active') {
      const statusMessages = {
        'inactive': 'Your account is currently inactive. Please contact support to reactivate your account.',
        'on-leave': 'Your account is currently on leave. Please contact support for assistance.',
        'terminated': 'Your account has been terminated. Please contact support for more information.'
      };
      return next(new AuthenticationFailedError(statusMessages[user.status] || 'Your account is not active. Please contact support.'));
    }
    
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return next(new AuthenticationFailedError('Your account has been temporarily locked due to multiple failed login attempts. Please contact support or try again later.'));
    }
    
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    user.lastActiveAt = new Date();
    await user.save();
    
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });
    
    const clientInfo = getClientInfo(req);
    const expiresAt = addDays(new Date(), 30);
    
    try {
      await UserSession.create({
        userId: user._id,
        sessionToken: accessToken,
        refreshToken: refreshToken,
        ...clientInfo,
        isActive: true,
        expiresAt: expiresAt,
      });
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
      // Continue even if session creation fails - user can still login
    }
    
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      department: user.department,
    };
    
    return sendSuccess(res, 200, 'Login successful', {
      user: userData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { email, password, name, role, employeeId, department, position } = req.body;
    
    if (!email || !password || !name || !role) {
      return next(new InvalidInputError('Email address, password, full name, and role are required to create an account'));
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        ...(employeeId ? [{ employeeId: employeeId.trim() }] : [])
      ]
    });
    
    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return next(new DuplicateResourceError('An account with this email address already exists. Please use a different email or try logging in.'));
      }
      return next(new DuplicateResourceError('An account with this employee ID already exists. Please contact support if you believe this is an error.'));
    }
    
    // Don't hash password here - let the User model's pre-save hook handle it
    // This prevents double hashing which causes login failures
    const userData = {
      email: normalizedEmail,
      password: password, // Plain password - will be hashed by pre-save hook
      name: name.trim(),
      role: role || 'employee',
      ...(employeeId && { employeeId: employeeId.trim() }),
      ...(department && { department: department.trim() }),
      ...(position && { position: position.trim() }),
      status: 'active',
      createdAt: new Date(),
    };
    
    const user = await User.create(userData);
    
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });
    
    const clientInfo = getClientInfo(req);
    const expiresAt = addDays(new Date(), 30);
    
    try {
      await UserSession.create({
        userId: user._id,
        sessionToken: accessToken,
        refreshToken: refreshToken,
        ...clientInfo,
        isActive: true,
        expiresAt: expiresAt,
      });
    } catch (sessionError) {
      console.error('Session creation error during registration:', sessionError);
      // Continue even if session creation fails
    }
    
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };
    
    return sendSuccess(res, 201, 'User registered successfully', {
      user: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return next(new DuplicateResourceError('An account with this information already exists. Please use different credentials or contact support.'));
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors || {}).map((e) => e.message);
      return next(new InvalidInputError(`Please check your information: ${errors.join('. ')}`));
    }
    return next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    
    if (!token) {
      return next(new ValidationError('Refresh token is required'));
    }
    
    const decoded = verifyToken(token);
    
    const session = await UserSession.findOne({
      refreshToken: token,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
    
    if (!session) {
      return next(new UnauthorizedError('Invalid or expired refresh token'));
    }
    
    const user = await User.findById(decoded.id);
    
    if (!user || user.status !== 'active') {
      return next(new UnauthorizedError('User not found or inactive'));
    }
    
    const newAccessToken = generateAccessToken({ id: user._id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user._id });
    
    session.sessionToken = newAccessToken;
    session.refreshToken = newRefreshToken;
    session.expiresAt = addDays(new Date(), 30);
    session.lastActivity = new Date();
    await session.save();
    
    return sendSuccess(res, 200, 'Token refreshed successfully', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error.message === 'Token expired' || error.message === 'Invalid token') {
      return next(new UnauthorizedError('Invalid or expired refresh token'));
    }
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const session = await UserSession.findOne({ sessionToken: token });
      if (session) {
        session.isActive = false;
        session.loggedOutAt = new Date();
        await session.save();
      }
    }
    
    if (req.user) {
      req.user.lastActiveAt = new Date();
      await req.user.save();
    }
    
    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return sendSuccess(res, 200, 'If email exists, password reset link has been sent');
    }
    
    const resetToken = generateResetToken();
    const hashedToken = hashResetToken(resetToken);
    
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = generatePasswordResetExpiry();
    await user.save();
    
    // TODO: Send email with reset token
    // For now, return token in development
    if (process.env.NODE_ENV === 'development') {
      return sendSuccess(res, 200, 'Password reset token generated', {
        resetToken, // Only in development
        expiresAt: user.passwordResetExpires,
      });
    }
    
    return sendSuccess(res, 200, 'If email exists, password reset link has been sent');
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return next(new ValidationError('Token and password are required'));
    }
    
    const hashedToken = hashResetToken(token);
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password');
    
    if (!user) {
      return next(new UnauthorizedError('Invalid or expired reset token'));
    }
    
    // Set plain password - pre-save hook will hash it automatically
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    
    // Invalidate all existing sessions
    await UserSession.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false, loggedOutAt: new Date() }
    );
    
    return sendSuccess(res, 200, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return next(new ResourceNotFoundError('User account'));
    }
    
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      department: user.department,
      position: user.position,
      photo: user.photo,
      status: user.status,
      preferences: user.preferences,
    };
    
    return sendSuccess(res, 200, 'User retrieved successfully', { user: userData });
  } catch (error) {
    next(error);
  }
};

