import { body, param, validationResult } from 'express-validator';
import { InvalidInputError } from '../utils/errorHandler.js';

export const validateGetSettings = [
  param('type').optional().isIn(['company', 'payroll', 'attendance', 'leave']).withMessage('Invalid settings type'),
];

export const validateCompanySettings = [
  body('companyName').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Company name must be a string'),
  body('legalName').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Legal name must be a string'),
  body('logoUrl').optional({ nullable: true, checkFalsy: true }).custom((value) => {
    if (!value || value === '' || value === null || value === undefined) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }).withMessage('Logo URL must be a valid URL'),
  body('address').optional({ nullable: true }).custom((value) => {
    if (!value || value === null || value === undefined) return true;
    return typeof value === 'object';
  }).withMessage('Address must be an object'),
  body('address.street').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Street must be a string'),
  body('address.city').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('City must be a string'),
  body('address.state').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('State must be a string'),
  body('address.zipCode').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Zip code must be a string'),
  body('address.country').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Country must be a string'),
  body('contact').optional({ nullable: true }).custom((value) => {
    if (!value || value === null || value === undefined) return true;
    return typeof value === 'object';
  }).withMessage('Contact must be an object'),
  body('contact.phone').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Phone must be a string'),
  body('contact.email').optional({ nullable: true, checkFalsy: true }).custom((value) => {
    if (!value || value === '' || value === null || value === undefined) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }).withMessage('Contact email must be a valid email'),
  body('contact.website').optional({ nullable: true, checkFalsy: true }).custom((value) => {
    if (!value || value === '' || value === null || value === undefined) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }).withMessage('Website must be a valid URL'),
  body('taxId').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Tax ID must be a string'),
  body('registrationNumber').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Registration number must be a string'),
  body('timezone').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Timezone must be a string'),
  body('workingDays').optional({ nullable: true }).custom((value) => {
    if (!value || value === null || value === undefined) return true;
    return Array.isArray(value);
  }).withMessage('Working days must be an array'),
  body('workingDays.*').optional().isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).withMessage('Invalid working day'),
  body('fiscalYearStart').optional({ nullable: true, checkFalsy: true }).custom((value) => {
    // Handle null, undefined, empty string, or empty object
    if (!value || value === null || value === undefined || value === '' || (typeof value === 'object' && Object.keys(value).length === 0)) return true;
    // If it's a string, check if it's a valid date
    if (typeof value === 'string') {
      return !isNaN(Date.parse(value));
    }
    // If it's an object with date properties, allow it (will be handled by service)
    return typeof value === 'object';
  }).withMessage('Fiscal year start must be a valid date'),
];

export const validatePayrollSettings = [
  body('salaryCycle').optional({ nullable: true }).isIn(['monthly', 'bi-weekly', 'weekly', 'semi-monthly']).withMessage('Invalid salary cycle'),
  body('payDay').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 1 && num <= 31 && Number.isInteger(num);
  }).withMessage('Pay day must be between 1 and 31'),
  body('overtimeRules').optional({ nullable: true }).custom((value) => {
    if (!value || value === null || value === undefined) return true;
    return typeof value === 'object';
  }).withMessage('Overtime rules must be an object'),
  body('overtimeRules.enabled').optional({ nullable: true }).isBoolean().withMessage('Overtime enabled must be a boolean'),
  body('overtimeRules.rate').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 1 && num <= 3;
  }).withMessage('Overtime rate must be between 1 and 3'),
  body('overtimeRules.threshold').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= 168;
  }).withMessage('Overtime threshold must be between 0 and 168 hours'),
  body('overtimeRules.doubleTimeThreshold').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  }).withMessage('Double time threshold must be non-negative'),
  body('bonuses').optional({ nullable: true }).custom((value) => {
    if (!value || value === null || value === undefined) return true;
    return Array.isArray(value);
  }).withMessage('Bonuses must be an array'),
  body('bonuses.*.id').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Bonus ID must be a string'),
  body('bonuses.*.name').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Bonus name must be a string'),
  body('bonuses.*.type').optional({ nullable: true }).isIn(['fixed', 'percentage']).withMessage('Bonus type must be fixed or percentage'),
  body('bonuses.*.value').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  }).withMessage('Bonus value must be non-negative'),
  body('bonuses.*.enabled').optional({ nullable: true }).isBoolean().withMessage('Bonus enabled must be a boolean'),
  body('deductions').optional({ nullable: true }).custom((value) => {
    if (!value || value === null || value === undefined) return true;
    return Array.isArray(value);
  }).withMessage('Deductions must be an array'),
  body('deductions.*.id').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Deduction ID must be a string'),
  body('deductions.*.name').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Deduction name must be a string'),
  body('deductions.*.type').optional({ nullable: true }).isIn(['fixed', 'percentage']).withMessage('Deduction type must be fixed or percentage'),
  body('deductions.*.value').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  }).withMessage('Deduction value must be non-negative'),
  body('deductions.*.enabled').optional({ nullable: true }).isBoolean().withMessage('Deduction enabled must be a boolean'),
  body('taxSettings').optional({ nullable: true }).custom((value) => {
    if (!value || value === null || value === undefined) return true;
    return typeof value === 'object';
  }).withMessage('Tax settings must be an object'),
  body('taxSettings.federalRate').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  }).withMessage('Federal tax rate must be between 0 and 100'),
  body('taxSettings.stateRate').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  }).withMessage('State tax rate must be between 0 and 100'),
  body('taxSettings.localRate').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  }).withMessage('Local tax rate must be between 0 and 100'),
  body('taxSettings.socialSecurityRate').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  }).withMessage('Social Security rate must be between 0 and 100'),
  body('taxSettings.medicareRate').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  }).withMessage('Medicare rate must be between 0 and 100'),
];

export const validateAttendanceSettings = [
  body('dailyWorkingHours').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 1 && num <= 24;
  }).withMessage('Daily working hours must be between 1 and 24'),
  body('weeklyWorkingHours').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 1 && num <= 168;
  }).withMessage('Weekly working hours must be between 1 and 168'),
  body('lateArrivalThreshold').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
  }).withMessage('Late arrival threshold must be non-negative'),
  body('earlyDepartureThreshold').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
  }).withMessage('Early departure threshold must be non-negative'),
  body('overtimeEligibility').optional({ nullable: true }).custom((value) => {
    if (!value || value === null || value === undefined) return true;
    return typeof value === 'object';
  }).withMessage('Overtime eligibility must be an object'),
  body('overtimeEligibility.enabled').optional({ nullable: true }).isBoolean().withMessage('Overtime eligibility enabled must be a boolean'),
  body('overtimeEligibility.minimumHours').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  }).withMessage('Minimum hours must be non-negative'),
  body('breakRules').optional({ nullable: true }).custom((value) => {
    if (!value || value === null || value === undefined) return true;
    return typeof value === 'object';
  }).withMessage('Break rules must be an object'),
  body('breakRules.lunchDuration').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
  }).withMessage('Lunch duration must be non-negative'),
  body('breakRules.breakDuration').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
  }).withMessage('Break duration must be non-negative'),
  body('breakRules.mandatoryBreak').optional({ nullable: true }).isBoolean().withMessage('Mandatory break must be a boolean'),
  body('trackingMethod').optional({ nullable: true }).isIn(['manual', 'automatic', 'hybrid']).withMessage('Invalid tracking method'),
];

export const validateLeavePolicies = [
  body('leavePolicies').isArray({ min: 0 }).withMessage('Leave policies must be an array'),
  body('leavePolicies.*.id').optional({ nullable: true, checkFalsy: true }).isString().trim().withMessage('Leave policy ID must be a string'),
  body('leavePolicies.*.type').notEmpty().isIn(['paid', 'unpaid', 'sick', 'annual', 'casual', 'maternity', 'paternity', 'emergency']).withMessage('Invalid leave type'),
  body('leavePolicies.*.name').notEmpty().isString().trim().withMessage('Leave policy name is required'),
  body('leavePolicies.*.maxDays').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
  }).withMessage('Max days must be non-negative'),
  body('leavePolicies.*.accrualRate').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  }).withMessage('Accrual rate must be non-negative'),
  body('leavePolicies.*.carryForwardLimit').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
  }).withMessage('Carry forward limit must be non-negative'),
  body('leavePolicies.*.carryForwardEnabled').optional({ nullable: true }).isBoolean().withMessage('Carry forward enabled must be a boolean'),
  body('leavePolicies.*.maxAccrualLimit').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
  }).withMessage('Max accrual limit must be non-negative'),
  body('leavePolicies.*.enabled').optional({ nullable: true }).isBoolean().withMessage('Enabled must be a boolean'),
  body('leavePolicies.*.requiresApproval').optional({ nullable: true }).isBoolean().withMessage('Requires approval must be a boolean'),
  body('leavePolicies.*.noticePeriod').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
  }).withMessage('Notice period must be non-negative'),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.param || err.path || err.location,
      message: err.msg,
    }));
    console.error('Validation errors:', JSON.stringify(errorMessages, null, 2));
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    return next(new InvalidInputError('Validation failed', errorMessages));
  }
  next();
};
