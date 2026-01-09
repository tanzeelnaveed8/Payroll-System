import mongoose from 'mongoose';

const timesheetSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payrollPeriodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PayrollPeriod'
  },
  date: { type: Date, required: true },
  day: {
    type: String,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  clockIn: { type: String },
  clockOut: { type: String },
  hours: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  regularHours: { type: Number },
  overtimeHours: { type: Number },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'submitted', 'approved', 'rejected']
  },
  submittedAt: { type: Date },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: { type: Date },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: { type: Date },
  comments: { type: String },
  employeeName: { type: String },
  department: { type: String },
  role: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'timesheets'
});

timesheetSchema.index({ employeeId: 1, date: -1 });
timesheetSchema.index({ payrollPeriodId: 1 });
timesheetSchema.index({ status: 1 });
timesheetSchema.index({ date: -1 });
timesheetSchema.index({ department: 1 });

timesheetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Timesheet = mongoose.model('Timesheet', timesheetSchema);

export default Timesheet;

