import mongoose from 'mongoose';

const dailyReportSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee ID is required'],
    index: true
  },
  reportDate: {
    type: Date,
    required: [true, 'Report date is required'],
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    index: true
  },
  department: {
    type: String,
    index: true
  },
  // Daily activities and accomplishments
  tasksCompleted: [{
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    taskTitle: String,
    description: String,
    hoursSpent: Number
  }],
  accomplishments: [{
    title: String,
    description: String,
    impact: String // Impact or outcome
  }],
  challenges: [{
    title: String,
    description: String,
    resolution: String // How it was or will be resolved
  }],
  // Time tracking
  hoursWorked: {
    type: Number,
    min: 0,
    max: 24,
    default: 0
  },
  overtimeHours: {
    type: Number,
    min: 0,
    default: 0
  },
  // Status and notes
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed'],
    default: 'draft',
    index: true
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  // Review information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewComments: {
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
  collection: 'dailyreports'
});

// Compound index for efficient queries
dailyReportSchema.index({ employeeId: 1, reportDate: -1 }, { unique: true });
dailyReportSchema.index({ departmentId: 1, reportDate: -1 });
dailyReportSchema.index({ status: 1, reportDate: -1 });
dailyReportSchema.index({ reportDate: -1 });

// Update updatedAt before saving
dailyReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'submitted' && !this.submittedAt) {
    this.submittedAt = Date.now();
  }
  next();
});

const DailyReport = mongoose.model('DailyReport', dailyReportSchema);

export default DailyReport;
