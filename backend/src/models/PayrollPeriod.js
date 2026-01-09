import mongoose from 'mongoose';

const payrollPeriodSchema = new mongoose.Schema({
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'processing', 'completed', 'cancelled']
  },
  department: { type: String },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  employeeCount: { type: Number },
  totalAmount: { type: Number },
  totalGrossPay: { type: Number },
  totalDeductions: { type: Number },
  totalNetPay: { type: Number },
  totalTaxes: { type: Number },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: { type: Date },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: { type: Date },
  payDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: false,
  collection: 'payrollperiods'
});

payrollPeriodSchema.index({ periodStart: 1, periodEnd: 1 });
payrollPeriodSchema.index({ status: 1 });
payrollPeriodSchema.index({ department: 1 });
payrollPeriodSchema.index({ departmentId: 1 });
payrollPeriodSchema.index({ payDate: 1 });
payrollPeriodSchema.index({ createdAt: -1 });

payrollPeriodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const PayrollPeriod = mongoose.model('PayrollPeriod', payrollPeriodSchema);

export default PayrollPeriod;

