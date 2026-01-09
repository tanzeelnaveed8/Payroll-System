import mongoose from 'mongoose';

const hoursSchema = new mongoose.Schema({
  regular: { type: Number },
  overtime: { type: Number },
  doubleTime: { type: Number },
  total: { type: Number }
}, { _id: false });

const bonusSchema = new mongoose.Schema({
  name: { type: String },
  amount: { type: Number }
}, { _id: false });

const allowanceSchema = new mongoose.Schema({
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

const benefitSchema = new mongoose.Schema({
  name: { type: String },
  type: { type: String, enum: ['fixed', 'percentage'] },
  value: { type: Number },
  amount: { type: Number }
}, { _id: false });

const otherDeductionSchema = new mongoose.Schema({
  name: { type: String },
  amount: { type: Number }
}, { _id: false });

const earningsSchema = new mongoose.Schema({
  baseSalary: { type: Number },
  hourlyRate: { type: Number },
  regularPay: { type: Number },
  overtimePay: { type: Number },
  bonuses: [bonusSchema],
  allowances: [allowanceSchema],
  totalEarnings: { type: Number }
}, { _id: false });

const deductionsSchema = new mongoose.Schema({
  taxes: { type: taxesSchema },
  benefits: [benefitSchema],
  other: [otherDeductionSchema],
  totalDeductions: { type: Number }
}, { _id: false });

const payrollCalculationSchema = new mongoose.Schema({
  paystubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PayStub',
    required: true
  },
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
  hours: { type: hoursSchema },
  earnings: { type: earningsSchema },
  deductions: { type: deductionsSchema },
  netPay: { type: Number, required: true },
  calculationDate: { type: Date, default: Date.now },
  calculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  calculationVersion: { type: String },
  calculationRules: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'payrollcalculations'
});

payrollCalculationSchema.index({ paystubId: 1 }, { unique: true });
payrollCalculationSchema.index({ employeeId: 1, payrollPeriodId: 1 });
payrollCalculationSchema.index({ payrollPeriodId: 1 });

payrollCalculationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const PayrollCalculation = mongoose.model('PayrollCalculation', payrollCalculationSchema);

export default PayrollCalculation;

