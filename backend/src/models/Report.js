import mongoose from 'mongoose';

const payrollSummarySchema = new mongoose.Schema({
  totalPayroll: { type: Number },
  employeeCount: { type: Number },
  averageSalary: { type: Number },
  period: { type: String }
}, { _id: false });

const attendanceOverviewSchema = new mongoose.Schema({
  totalDays: { type: Number },
  presentDays: { type: Number },
  absentDays: { type: Number },
  lateArrivals: { type: Number },
  attendanceRate: { type: Number }
}, { _id: false });

const leaveTypeCountSchema = new mongoose.Schema({
  type: { type: String },
  count: { type: Number }
}, { _id: false });

const leaveAnalyticsSchema = new mongoose.Schema({
  totalLeaves: { type: Number },
  approvedLeaves: { type: Number },
  pendingLeaves: { type: Number },
  rejectedLeaves: { type: Number },
  leaveTypes: [leaveTypeCountSchema]
}, { _id: false });

const departmentCostSchema = new mongoose.Schema({
  department: { type: String },
  departmentId: { type: mongoose.Schema.Types.ObjectId },
  employeeCount: { type: Number },
  totalCost: { type: Number },
  percentage: { type: Number }
}, { _id: false });

const reportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    required: true,
    enum: ['payroll', 'attendance', 'leave', 'department', 'employee', 'financial']
  },
  period: { type: String, required: true },
  dateFrom: { type: Date, required: true },
  dateTo: { type: Date, required: true },
  department: { type: String },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  payrollSummary: { type: payrollSummarySchema },
  attendanceOverview: { type: attendanceOverviewSchema },
  leaveAnalytics: { type: leaveAnalyticsSchema },
  departmentCosts: [departmentCostSchema],
  reportData: { type: mongoose.Schema.Types.Mixed },
  pdfFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileAttachment'
  },
  excelFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileAttachment'
  },
  generatedAt: { type: Date, default: Date.now },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'reports'
});

reportSchema.index({ reportType: 1, dateFrom: 1, dateTo: 1 });
reportSchema.index({ department: 1 });
reportSchema.index({ departmentId: 1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
reportSchema.index({ generatedAt: -1 });
reportSchema.index({ reportType: 1, generatedBy: 1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;

