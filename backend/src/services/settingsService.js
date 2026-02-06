import Setting from '../models/Setting.js';
import { InvalidInputError, ResourceNotFoundError } from '../utils/errorHandler.js';
import { cacheService } from '../utils/cache.js';

/**
 * Get default settings for a type
 */
export const getDefaultSettings = (type) => {
  const defaults = {
    company: {
      companyName: '',
      legalName: '',
      logoUrl: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Pakistan',
      },
      contact: {
        phone: '',
        email: '',
        website: '',
      },
      taxId: '',
      registrationNumber: '',
      timezone: 'Asia/Karachi',
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      fiscalYearStart: new Date(new Date().getFullYear(), 0, 1), // January 1st
    },
    payroll: {
      salaryCycle: 'bi-weekly',
      payDay: 15,
      overtimeRules: {
        enabled: true,
        rate: 1.5,
        threshold: 40,
        doubleTimeThreshold: null,
      },
      bonuses: [],
      deductions: [],
      taxSettings: {
        federalRate: 0,
        stateRate: 0,
        localRate: 0,
        socialSecurityRate: 6.2,
        medicareRate: 1.45,
      },
    },
    attendance: {
      dailyWorkingHours: 8,
      weeklyWorkingHours: 40,
      lateArrivalThreshold: 15,
      earlyDepartureThreshold: 15,
      overtimeEligibility: {
        enabled: true,
        minimumHours: 40,
      },
      breakRules: {
        lunchDuration: 60,
        breakDuration: 15,
        mandatoryBreak: true,
      },
      trackingMethod: 'manual',
    },
    leave: {
      leavePolicies: [
        {
          id: 'annual',
          type: 'annual',
          name: 'Annual Leave',
          maxDays: 20,
          accrualRate: 1.67,
          carryForwardLimit: 5,
          carryForwardEnabled: true,
          maxAccrualLimit: 25,
          enabled: true,
          applicableRoles: [],
          requiresApproval: true,
          noticePeriod: 7,
        },
        {
          id: 'sick',
          type: 'sick',
          name: 'Sick Leave',
          maxDays: 10,
          accrualRate: 0.83,
          carryForwardLimit: 0,
          carryForwardEnabled: false,
          maxAccrualLimit: 15,
          enabled: true,
          applicableRoles: [],
          requiresApproval: false,
          noticePeriod: 0,
        },
      ],
    },
  };

  return defaults[type] || null;
};

/**
 * Get settings with defaults merged
 */
export const getSettings = async (type = null) => {
  try {
    // Cache key
    const cacheKey = type ? `settings:${type}` : 'settings:all';
    
    // Try to get from cache
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    if (type) {
      // Get specific type
      const settings = await Setting.findOne({ type }).lean().exec();
      const defaults = getDefaultSettings(type);

    if (!settings) {
      if (type === 'leave') {
        return defaults?.leavePolicies || [];
      }
      return defaults;
    }

    // Return saved settings merged with defaults
    let result;
    if (type === 'leave') {
      const savedPolicies = settings.leavePolicies || [];
      const defaultPolicies = defaults?.leavePolicies || [];
      // Merge saved with defaults, ensuring IDs exist
      result = savedPolicies.map(policy => ({
        ...policy,
        id: policy.id || policy.type, // Ensure ID exists
      }));
      // If no saved policies, use defaults
      if (result.length === 0) {
        result = defaultPolicies.map(policy => ({
          ...policy,
          id: policy.id || policy.type,
        }));
      }
    } else {
      const savedData = settings[type] || {};
      result = deepMerge(defaults || {}, savedData);
    }
    
    // Cache for 5 minutes
    cacheService.set(cacheKey, result, 300);
    return result;
    } else {
      // Get all settings
      const allSettings = await Setting.find().lean().exec();
      const result = {};

      ['company', 'payroll', 'attendance', 'leave'].forEach(settingType => {
        const saved = allSettings.find(s => s.type === settingType);
        const defaults = getDefaultSettings(settingType);

        if (settingType === 'leave') {
          const savedPolicies = saved?.leavePolicies || [];
          const defaultPolicies = defaults?.leavePolicies || [];
          // Ensure all policies have IDs
          if (savedPolicies.length > 0) {
            result.leavePolicies = savedPolicies.map(policy => ({
              ...policy,
              id: policy.id || policy.type,
            }));
          } else {
            result.leavePolicies = defaultPolicies.map(policy => ({
              ...policy,
              id: policy.id || policy.type,
            }));
          }
        } else if (saved) {
          result[settingType] = deepMerge(defaults || {}, saved[settingType] || {});
        } else {
          result[settingType] = defaults || {};
        }
      });

      // Cache for 5 minutes
      cacheService.set(cacheKey, result, 300);
      return result;
    }
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
};

/**
 * Validate settings data based on type
 */
export const validateSettings = (type, data) => {
  const errors = [];

  switch (type) {
    case 'company':
      if (data.companyName && typeof data.companyName !== 'string') {
        errors.push({ field: 'companyName', message: 'Company name must be a string' });
      }
      if (data.timezone && typeof data.timezone !== 'string') {
        errors.push({ field: 'timezone', message: 'Timezone must be a string' });
      }
      if (data.workingDays && !Array.isArray(data.workingDays)) {
        errors.push({ field: 'workingDays', message: 'Working days must be an array' });
      }
      if (data.workingDays) {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        data.workingDays.forEach((day, index) => {
          if (!validDays.includes(day.toLowerCase())) {
            errors.push({ field: `workingDays[${index}]`, message: `Invalid working day: ${day}` });
          }
        });
      }
      break;

    case 'payroll':
      if (data.salaryCycle && !['monthly', 'bi-weekly', 'weekly', 'semi-monthly'].includes(data.salaryCycle)) {
        errors.push({ field: 'salaryCycle', message: 'Invalid salary cycle' });
      }
      if (data.payDay !== undefined && (data.payDay < 1 || data.payDay > 31)) {
        errors.push({ field: 'payDay', message: 'Pay day must be between 1 and 31' });
      }
      if (data.overtimeRules) {
        if (data.overtimeRules.enabled !== undefined && typeof data.overtimeRules.enabled !== 'boolean') {
          errors.push({ field: 'overtimeRules.enabled', message: 'Overtime enabled must be a boolean' });
        }
        if (data.overtimeRules.rate !== undefined && (isNaN(data.overtimeRules.rate) || data.overtimeRules.rate < 1 || data.overtimeRules.rate > 3)) {
          errors.push({ field: 'overtimeRules.rate', message: 'Overtime rate must be between 1 and 3' });
        }
        if (data.overtimeRules.threshold !== undefined && (isNaN(data.overtimeRules.threshold) || data.overtimeRules.threshold < 0 || data.overtimeRules.threshold > 168)) {
          errors.push({ field: 'overtimeRules.threshold', message: 'Overtime threshold must be between 0 and 168 hours' });
        }
        if (data.overtimeRules.doubleTimeThreshold !== undefined && data.overtimeRules.doubleTimeThreshold !== null && (isNaN(data.overtimeRules.doubleTimeThreshold) || data.overtimeRules.doubleTimeThreshold < 0)) {
          errors.push({ field: 'overtimeRules.doubleTimeThreshold', message: 'Double time threshold must be non-negative' });
        }
      }
      if (data.taxSettings) {
        Object.entries(data.taxSettings).forEach(([key, value]) => {
          if (value !== undefined && (value < 0 || value > 100)) {
            errors.push({ field: `taxSettings.${key}`, message: `Tax rate ${key} must be between 0 and 100` });
          }
        });
      }
      if (data.bonuses && Array.isArray(data.bonuses)) {
        // Filter out incomplete bonuses before validation (only keep items with valid names)
        const validBonuses = data.bonuses.filter(bonus => 
          bonus && 
          bonus.name && 
          typeof bonus.name === 'string' && 
          bonus.name.trim().length > 0
        );
        
        validBonuses.forEach((bonus, index) => {
          if (!bonus.name || typeof bonus.name !== 'string' || bonus.name.trim().length === 0) {
            errors.push({ field: `bonuses[${index}].name`, message: 'Bonus name is required' });
          }
          if (bonus.value === undefined || bonus.value === null || isNaN(bonus.value) || bonus.value < 0) {
            errors.push({ field: `bonuses[${index}].value`, message: 'Bonus value must be a positive number' });
          }
        });
        
        // Replace with filtered array if we filtered out invalid items
        if (validBonuses.length !== data.bonuses.length) {
          data.bonuses = validBonuses;
        }
      }
      
      if (data.deductions && Array.isArray(data.deductions)) {
        // Filter out incomplete deductions before validation (only keep items with valid names)
        const validDeductions = data.deductions.filter(deduction => 
          deduction && 
          deduction.name && 
          typeof deduction.name === 'string' && 
          deduction.name.trim().length > 0
        );
        
        validDeductions.forEach((deduction, index) => {
          if (!deduction.name || typeof deduction.name !== 'string' || deduction.name.trim().length === 0) {
            errors.push({ field: `deductions[${index}].name`, message: 'Deduction name is required' });
          }
          if (deduction.value === undefined || deduction.value === null || isNaN(deduction.value) || deduction.value < 0) {
            errors.push({ field: `deductions[${index}].value`, message: 'Deduction value must be a positive number' });
          }
        });
        
        // Replace with filtered array if we filtered out invalid items
        if (validDeductions.length !== data.deductions.length) {
          data.deductions = validDeductions;
        }
      }
      break;

    case 'attendance':
      if (data.dailyWorkingHours !== undefined && (data.dailyWorkingHours < 1 || data.dailyWorkingHours > 24)) {
        errors.push({ field: 'dailyWorkingHours', message: 'Daily working hours must be between 1 and 24' });
      }
      if (data.weeklyWorkingHours !== undefined && (data.weeklyWorkingHours < 1 || data.weeklyWorkingHours > 168)) {
        errors.push({ field: 'weeklyWorkingHours', message: 'Weekly working hours must be between 1 and 168' });
      }
      if (data.lateArrivalThreshold !== undefined && data.lateArrivalThreshold < 0) {
        errors.push({ field: 'lateArrivalThreshold', message: 'Late arrival threshold must be non-negative' });
      }
      if (data.trackingMethod && !['manual', 'automatic', 'hybrid'].includes(data.trackingMethod)) {
        errors.push({ field: 'trackingMethod', message: 'Invalid tracking method' });
      }
      break;

    case 'leave':
      if (data.leavePolicies && Array.isArray(data.leavePolicies)) {
        const validTypes = ['paid', 'unpaid', 'sick', 'annual', 'casual', 'maternity', 'paternity', 'emergency'];
        data.leavePolicies.forEach((policy, index) => {
          if (!policy.type || !validTypes.includes(policy.type)) {
            errors.push({ field: `leavePolicies[${index}].type`, message: 'Invalid leave type' });
          }
          if (!policy.name) {
            errors.push({ field: `leavePolicies[${index}].name`, message: 'Leave policy name is required' });
          }
          if (policy.maxDays !== undefined && policy.maxDays < 0) {
            errors.push({ field: `leavePolicies[${index}].maxDays`, message: 'Max days must be non-negative' });
          }
          if (policy.accrualRate !== undefined && policy.accrualRate < 0) {
            errors.push({ field: `leavePolicies[${index}].accrualRate`, message: 'Accrual rate must be non-negative' });
          }
        });
      }
      break;

    default:
      errors.push({ field: 'type', message: 'Invalid settings type' });
  }

  if (errors.length > 0) {
    throw new InvalidInputError('Settings validation failed', errors);
  }

  return true;
};

/**
 * Update settings by type
 */
export const updateSettings = async (type, data, updatedBy) => {
  try {
    // Validate settings
    await validateSettings(type, data);

    // Check if settings exist
    let settings = await Setting.findOne({ type });

    if (!settings) {
      // Create new settings
      const settingsData = {
        type,
        updatedBy,
      };
      
      if (type === 'leave') {
        // Ensure all policies have IDs (use type as fallback)
        const policiesWithIds = (data.leavePolicies || []).map(policy => ({
          ...policy,
          id: policy.id || policy.type, // Ensure ID exists
        }));
        settingsData.leavePolicies = policiesWithIds;
      } else {
        settingsData[type] = data;
      }
      
      settings = new Setting(settingsData);
    } else {
      // Update existing settings
      if (type === 'leave') {
        // Ensure all policies have IDs (use type as fallback)
        const policiesWithIds = (data.leavePolicies || []).map(policy => ({
          ...policy,
          id: policy.id || policy.type, // Ensure ID exists
        }));
        settings.leavePolicies = policiesWithIds.length > 0 ? policiesWithIds : settings.leavePolicies || [];
      } else {
        const defaults = getDefaultSettings(type);
        settings[type] = deepMerge(defaults || {}, deepMerge(settings[type] || {}, data));
      }
      settings.updatedBy = updatedBy;
    }

    await settings.save();
    
    // Clear cache for this settings type
    cacheService.del(`settings:${type}`);
    cacheService.del('settings:all');
    
    return settings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

/**
 * Deep merge utility function
 */
const deepMerge = (target, source) => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else if (Array.isArray(source[key])) {
        output[key] = source[key]; // Arrays are replaced, not merged
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Get timezone list
 */
export const getTimezoneList = () => {
  return [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
    { value: 'Asia/Kolkata', label: 'Indian Standard Time (IST)' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
  ];
};

