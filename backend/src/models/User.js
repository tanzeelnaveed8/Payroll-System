import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String }
}, { _id: false });

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String },
  relationship: { type: String },
  phone: { type: String },
  email: { type: String }
}, { _id: false });

const preferencesSchema = new mongoose.Schema({
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  language: { type: String, default: 'en' },
  timezone: { type: String },
  dateFormat: { type: String, default: 'MM/DD/YYYY' },
  theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' }
}, { _id: false });

const userSchema = new mongoose.Schema({
  // Authentication
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['admin', 'manager', 'employee']
  },
  employeeId: {
    type: String,
    trim: true
  },

  // Personal Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  photo: { type: String }, // URL
  phone: { type: String, trim: true },
  address: { type: addressSchema },
  emergencyContact: { type: emergencyContactSchema },
  bio: { type: String },
  dateOfBirth: { type: Date },

  // Employment Details
  department: { type: String },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  position: { type: String }, // Job title/role
  jobRole: { type: String }, // Job role (different from user role) - renamed from 'role' to avoid conflict
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern']
  },
  skills: [{ type: String }], // Employee skills/expertise
  fields: [{ type: String }], // Employee fields of expertise/domains
  status: {
    type: String,
    enum: ['active', 'inactive', 'on-leave', 'terminated'],
    default: 'active'
  },
  joinDate: { type: Date },
  contractStart: { type: Date },
  contractEnd: { type: Date },
  terminationDate: { type: Date },
  terminationReason: { type: String },

  // Salary Information
  salaryType: {
    type: String,
    enum: ['monthly', 'hourly', 'annual']
  },
  baseSalary: { type: Number },
  hourlyRate: { type: Number },
  currency: { type: String, default: 'USD' },

  // Hierarchy
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  directReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Permissions & Access
  permissions: [{ type: String }], // Custom permissions override
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },

  // Security & Authentication
  refreshToken: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  lastLogin: { type: Date },
  lastActiveAt: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },

  // Profile Completion
  profileCompletion: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Preferences
  preferences: { type: preferencesSchema, default: () => ({}) },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: false, // We're handling timestamps manually
  collection: 'users'
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ employeeId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ departmentId: 1 });
userSchema.index({ status: 1 });
userSchema.index({ managerId: 1 });
userSchema.index({ employmentType: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActiveAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  // Skip if password is already hashed (starts with $2a$, $2b$, or $2y$)
  if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$'))) {
    return next();
  }

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

export default User;

