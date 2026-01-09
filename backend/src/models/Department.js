import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  code: {
    type: String,
    trim: true,
    uppercase: true
  },
  description: { type: String },

  // Management
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  parentDepartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },

  // Budget & Costs
  annualBudget: { type: Number },
  monthlyBudget: { type: Number },
  currentSpend: { type: Number, default: 0 },

  // Statistics (denormalized for performance)
  employeeCount: { type: Number, default: 0 },
  activeEmployeeCount: { type: Number, default: 0 },

  // Settings
  costCenter: { type: String },
  location: { type: String },
  timezone: { type: String },
  workingDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },

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
  }
}, {
  timestamps: false, // We're handling timestamps manually
  collection: 'departments'
});

// Indexes
departmentSchema.index({ name: 1 }, { unique: true });
departmentSchema.index({ code: 1 }, { unique: true, sparse: true });
departmentSchema.index({ managerId: 1 });
departmentSchema.index({ status: 1 });
departmentSchema.index({ parentDepartmentId: 1 });

// Update updatedAt before saving
departmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for full department path (if nested)
departmentSchema.virtual('fullPath').get(function() {
  return this.name; // Can be enhanced to show parent path
});

const Department = mongoose.model('Department', departmentSchema);

export default Department;

