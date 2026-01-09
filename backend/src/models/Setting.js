import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String }
}, { _id: false });

const contactSchema = new mongoose.Schema({
  phone: { type: String },
  email: { type: String },
  website: { type: String }
}, { _id: false });

const companySchema = new mongoose.Schema({
  companyName: { type: String },
  legalName: { type: String },
  logoUrl: { type: String },
  address: { type: addressSchema },
  contact: { type: contactSchema },
  taxId: { type: String },
  registrationNumber: { type: String },
  timezone: { type: String },
  workingDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  fiscalYearStart: { type: Date }
}, { _id: false });

const overtimeRulesSchema = new mongoose.Schema({
  enabled: { type: Boolean },
  rate: { type: Number, default: 1.5 },
  threshold: { type: Number, default: 40 },
  doubleTimeThreshold: { type: Number }
}, { _id: false });

const bonusSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String },
  type: { type: String, enum: ['fixed', 'percentage'] },
  value: { type: Number },
  enabled: { type: Boolean },
  applicableRoles: [{ type: String }]
}, { _id: false });

const deductionSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String },
  type: { type: String, enum: ['fixed', 'percentage'] },
  value: { type: Number },
  enabled: { type: Boolean },
  mandatory: { type: Boolean }
}, { _id: false });

const taxSettingsSchema = new mongoose.Schema({
  federalRate: { type: Number },
  stateRate: { type: Number },
  localRate: { type: Number },
  socialSecurityRate: { type: Number },
  medicareRate: { type: Number }
}, { _id: false });

const payrollSchema = new mongoose.Schema({
  salaryCycle: {
    type: String,
    enum: ['monthly', 'bi-weekly', 'weekly', 'semi-monthly']
  },
  payDay: { type: Number },
  overtimeRules: { type: overtimeRulesSchema },
  bonuses: [bonusSchema],
  deductions: [deductionSchema],
  taxSettings: { type: taxSettingsSchema }
}, { _id: false });

const overtimeEligibilitySchema = new mongoose.Schema({
  enabled: { type: Boolean },
  minimumHours: { type: Number }
}, { _id: false });

const breakRulesSchema = new mongoose.Schema({
  lunchDuration: { type: Number },
  breakDuration: { type: Number },
  mandatoryBreak: { type: Boolean }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  dailyWorkingHours: { type: Number, default: 8 },
  weeklyWorkingHours: { type: Number, default: 40 },
  lateArrivalThreshold: { type: Number, default: 15 },
  earlyDepartureThreshold: { type: Number, default: 15 },
  overtimeEligibility: { type: overtimeEligibilitySchema },
  breakRules: { type: breakRulesSchema },
  trackingMethod: {
    type: String,
    enum: ['manual', 'automatic', 'hybrid']
  }
}, { _id: false });

const leavePolicySchema = new mongoose.Schema({
  id: { type: String },
  type: {
    type: String,
    enum: ['paid', 'unpaid', 'sick', 'annual', 'casual', 'maternity', 'paternity', 'emergency']
  },
  name: { type: String },
  maxDays: { type: Number },
  accrualRate: { type: Number },
  carryForwardLimit: { type: Number },
  carryForwardEnabled: { type: Boolean },
  maxAccrualLimit: { type: Number },
  enabled: { type: Boolean },
  applicableRoles: [{ type: String }],
  requiresApproval: { type: Boolean },
  noticePeriod: { type: Number }
}, { _id: false });

const settingSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['company', 'payroll', 'attendance', 'leave']
  },
  company: { type: companySchema },
  payroll: { type: payrollSchema },
  attendance: { type: attendanceSchema },
  leavePolicies: [leavePolicySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: false,
  collection: 'settings'
});

settingSchema.index({ type: 1 }, { unique: true });

settingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;

