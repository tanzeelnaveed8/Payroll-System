import mongoose from 'mongoose';

const progressUpdateSchema = new mongoose.Schema({
  deptLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Department Lead ID is required'],
    index: true
  },
  deptLeadName: {
    type: String,
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  department: {
    type: String,
    required: true,
    index: true
  },
  updateDate: {
    type: Date,
    required: [true, 'Update date is required'],
    default: Date.now,
    index: true
  },
  // Period covered by this update
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  // Summary metrics
  totalEmployees: {
    type: Number,
    default: 0
  },
  activeEmployees: {
    type: Number,
    default: 0
  },
  reportsSubmitted: {
    type: Number,
    default: 0
  },
  reportsPending: {
    type: Number,
    default: 0
  },
  // Team performance summary
  tasksCompleted: {
    type: Number,
    default: 0
  },
  tasksInProgress: {
    type: Number,
    default: 0
  },
  tasksOverdue: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Key highlights
  highlights: [{
    title: String,
    description: String,
    impact: String,
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    employeeName: String
  }],
  // Challenges and blockers
  challenges: [{
    title: String,
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved'],
      default: 'open'
    },
    resolution: String
  }],
  // Resource needs
  resourceNeeds: [{
    type: {
      type: String,
      enum: ['personnel', 'budget', 'equipment', 'training', 'other']
    },
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  }],
  // Next period goals
  nextPeriodGoals: [{
    title: String,
    description: String,
    targetDate: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  }],
  // Status and visibility
  status: {
    type: String,
    enum: ['draft', 'submitted', 'acknowledged'],
    default: 'draft',
    index: true
  },
  // Recipients (managers and admins who should see this)
  recipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'manager']
    },
    viewedAt: Date
  }],
  // Acknowledgment
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: {
    type: Date
  },
  acknowledgmentComments: {
    type: String,
    maxlength: 1000
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
  submittedAt: {
    type: Date
  }
}, {
  timestamps: false,
  collection: 'progressupdates'
});

// Indexes for efficient queries
progressUpdateSchema.index({ deptLeadId: 1, updateDate: -1 });
progressUpdateSchema.index({ departmentId: 1, updateDate: -1 });
progressUpdateSchema.index({ status: 1, updateDate: -1 });
progressUpdateSchema.index({ updateDate: -1 });
progressUpdateSchema.index({ 'recipients.userId': 1, status: 1 });

// Update updatedAt before saving
progressUpdateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'submitted' && !this.submittedAt) {
    this.submittedAt = Date.now();
  }
  next();
});

const ProgressUpdate = mongoose.model('ProgressUpdate', progressUpdateSchema);

export default ProgressUpdate;
