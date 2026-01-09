import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema({
  paid: { type: Number },
  unpaid: { type: Number },
  sick: { type: Number },
  annual: { type: Number }
}, { _id: false });

const leaveRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveType: {
    type: String,
    required: true,
    enum: ['paid', 'unpaid', 'sick', 'annual', 'casual', 'maternity', 'paternity']
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  reason: { type: String },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected']
  },
  submittedDate: { type: Date, required: true, default: Date.now },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedDate: { type: Date },
  comments: { type: String },
  leaveBalanceBefore: { type: leaveBalanceSchema },
  leaveBalanceAfter: { type: leaveBalanceSchema },
  employeeName: { type: String },
  employeeEmail: { type: String },
  employeeDepartment: { type: String },
  employeeRole: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'leaverequests'
});

leaveRequestSchema.index({ employeeId: 1, startDate: -1 });
leaveRequestSchema.index({ status: 1 });
leaveRequestSchema.index({ leaveType: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });
leaveRequestSchema.index({ employeeDepartment: 1 });

leaveRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

export default LeaveRequest;

