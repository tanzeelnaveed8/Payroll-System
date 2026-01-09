import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  used: { type: Number, default: 0 },
  remaining: { type: Number },
  accrued: { type: Number },
  carryForward: { type: Number }
}, { _id: false });

const casualLeaveSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  used: { type: Number, default: 0 },
  remaining: { type: Number }
}, { _id: false });

const accrualRateSchema = new mongoose.Schema({
  annual: { type: Number },
  sick: { type: Number }
}, { _id: false });

const leaveBalanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  year: { type: Number, required: true },
  annual: { type: leaveTypeSchema },
  sick: { type: leaveTypeSchema },
  casual: { type: casualLeaveSchema },
  paid: { type: casualLeaveSchema },
  unpaid: { type: casualLeaveSchema },
  maternity: { type: casualLeaveSchema },
  paternity: { type: casualLeaveSchema },
  accrualRate: { type: accrualRateSchema },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'leavebalances'
});

leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });
leaveBalanceSchema.index({ employeeId: 1 });

leaveBalanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

export default LeaveBalance;

