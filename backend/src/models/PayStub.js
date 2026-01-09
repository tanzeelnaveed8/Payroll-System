import mongoose from 'mongoose';

const bonusSchema = new mongoose.Schema({
  name: { type: String },
  amount: { type: Number }
}, { _id: false });

const taxesSchema = new mongoose.Schema({
  federal: { type: Number },
  state: { type: Number },
  local: { type: Number },
  socialSecurity: { type: Number },
  medicare: { type: Number },
  total: { type: Number }
}, { _id: false });

const deductionSchema = new mongoose.Schema({
  name: { type: String },
  type: { type: String, enum: ['fixed', 'percentage'] },
  value: { type: Number },
  amount: { type: Number }
}, { _id: false });

const payStubSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payrollPeriodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PayrollPeriod',
    required: true
  },
  payPeriodStart: { type: Date, required: true },
  payPeriodEnd: { type: Date, required: true },
  payDate: { type: Date, required: true },
  status: {
    type: String,
    required: true,
    enum: ['paid', 'processing', 'pending']
  },
  grossPay: { type: Number, required: true },
  regularHours: { type: Number },
  regularRate: { type: Number },
  overtimeHours: { type: Number },
  overtimeRate: { type: Number },
  overtimePay: { type: Number },
  bonuses: [bonusSchema],
  totalEarnings: { type: Number },
  taxes: { type: taxesSchema },
  deductions: [deductionSchema],
  totalDeductions: { type: Number },
  netPay: { type: Number, required: true },
  ytdGrossPay: { type: Number },
  ytdNetPay: { type: Number },
  ytdTaxes: { type: Number },
  pdfUrl: { type: String },
  pdfGeneratedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'paystubs'
});

payStubSchema.index({ employeeId: 1, payDate: -1 });
payStubSchema.index({ payrollPeriodId: 1 });
payStubSchema.index({ status: 1 });
payStubSchema.index({ payDate: -1 });

payStubSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const PayStub = mongoose.model('PayStub', payStubSchema);

export default PayStub;

