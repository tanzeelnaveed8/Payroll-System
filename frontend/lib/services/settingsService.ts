import { settingsApi, type CompanySettings, type PayrollSettings, type AttendanceRules, type LeavePolicy, type AllSettings, type Timezone } from '@/lib/api/settings';

export type { CompanySettings, PayrollSettings, AttendanceRules, LeavePolicy };

export interface Settings {
  company: CompanySettings;
  payroll: PayrollSettings;
  attendance: AttendanceRules;
  leavePolicies: LeavePolicy[];
}

/**
 * Clean settings object by removing empty objects, null values, and empty strings
 * Special handling for overtimeRules to preserve all fields even when disabled
 */
function cleanSettings<T extends Record<string, any>>(settings: T): Partial<T> {
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(settings)) {
    // Skip null, undefined, empty strings
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    // Special handling for overtimeRules - always preserve if it exists
    if (key === 'overtimeRules' && typeof value === 'object' && value !== null) {
      const overtimeRules: any = {};
      if (value.enabled !== undefined && value.enabled !== null) {
        overtimeRules.enabled = value.enabled;
      }
      if (value.rate !== undefined && value.rate !== null) {
        overtimeRules.rate = value.rate;
      }
      if (value.threshold !== undefined && value.threshold !== null) {
        overtimeRules.threshold = value.threshold;
      }
      if (value.doubleTimeThreshold !== undefined && value.doubleTimeThreshold !== null) {
        overtimeRules.doubleTimeThreshold = value.doubleTimeThreshold;
      }
      // Only add if at least enabled is present
      if (Object.keys(overtimeRules).length > 0) {
        cleaned[key] = overtimeRules;
      }
      continue;
    }
    
    // Special handling for bonuses and deductions arrays - filter out incomplete items
    if ((key === 'bonuses' || key === 'deductions') && Array.isArray(value)) {
      // Filter out incomplete items (those without names) and clean valid items
      const cleanedArray = value
        .filter((item: any) => {
          // Only keep items that have a name (required field)
          return item && item.name && typeof item.name === 'string' && item.name.trim().length > 0;
        })
        .map((item: any) => {
          const cleanedItem: any = {};
          // Preserve all fields that exist
          if (item.id !== undefined && item.id !== null && item.id !== '') {
            cleanedItem.id = item.id;
          }
          // Name is required and already validated by filter
          cleanedItem.name = item.name.trim();
          
          if (item.type !== undefined && item.type !== null) {
            cleanedItem.type = item.type;
          }
          if (item.value !== undefined && item.value !== null && !isNaN(item.value)) {
            cleanedItem.value = Number(item.value);
          }
          if (item.enabled !== undefined && item.enabled !== null) {
            cleanedItem.enabled = Boolean(item.enabled);
          }
          // For bonuses
          if (key === 'bonuses') {
            if (item.applicableRoles !== undefined && Array.isArray(item.applicableRoles)) {
              cleanedItem.applicableRoles = item.applicableRoles;
            }
          }
          // For deductions
          if (key === 'deductions') {
            if (item.mandatory !== undefined && item.mandatory !== null) {
              cleanedItem.mandatory = Boolean(item.mandatory);
            }
          }
          return cleanedItem;
        });
      // Only include the array if it has valid items
      if (cleanedArray.length > 0) {
        cleaned[key] = cleanedArray;
      }
      continue;
    }
    
    // Skip empty objects (except overtimeRules, bonuses, deductions which are handled above)
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      continue;
    }
    
    // Recursively clean nested objects
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      const cleanedNested = cleanSettings(value);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

export const settingsService = {
  /**
   * Get all settings
   */
  async getSettings(): Promise<Settings> {
    try {
      const response = await settingsApi.getAllSettings();
      if (response.success && response.data.settings) {
        const settings = response.data.settings as AllSettings;
        // Ensure overtimeRules has default values if missing
        const payroll = settings.payroll || {};
        if (!payroll.overtimeRules) {
          payroll.overtimeRules = {
            enabled: true,
            rate: 1.5,
            threshold: 40,
          };
        } else {
          // Ensure all required fields exist
          payroll.overtimeRules = {
            enabled: payroll.overtimeRules.enabled ?? true,
            rate: payroll.overtimeRules.rate ?? 1.5,
            threshold: payroll.overtimeRules.threshold ?? 40,
            doubleTimeThreshold: payroll.overtimeRules.doubleTimeThreshold,
          };
        }
        // Ensure bonuses array exists and has all required fields
        if (!Array.isArray(payroll.bonuses)) {
          payroll.bonuses = [];
        } else {
          payroll.bonuses = payroll.bonuses.map((bonus: any) => ({
            id: bonus.id || `bonus-${Date.now()}`,
            name: bonus.name || "",
            type: bonus.type || "fixed",
            value: bonus.value ?? 0,
            enabled: bonus.enabled ?? true,
            applicableRoles: bonus.applicableRoles || [],
          }));
        }
        // Ensure deductions array exists and has all required fields
        if (!Array.isArray(payroll.deductions)) {
          payroll.deductions = [];
        } else {
          payroll.deductions = payroll.deductions.map((deduction: any) => ({
            id: deduction.id || `ded-${Date.now()}`,
            name: deduction.name || "",
            type: deduction.type || "fixed",
            value: deduction.value ?? 0,
            enabled: deduction.enabled ?? true,
            mandatory: deduction.mandatory ?? false,
          }));
        }
        // Ensure leave policies have stable IDs
        const leavePolicies = (settings.leavePolicies || []).map((policy: any) => ({
          ...policy,
          id: policy.id || policy.type, // Use type as ID if ID is missing
          enabled: policy.enabled ?? true,
          maxDays: policy.maxDays ?? 0,
          accrualRate: policy.accrualRate ?? 0,
          carryForwardLimit: policy.carryForwardLimit ?? 0,
          name: policy.name || policy.type.charAt(0).toUpperCase() + policy.type.slice(1) + ' Leave',
        }));

        // Normalize working days to lowercase for consistency
        const company = settings.company || {};
        if (company.workingDays && Array.isArray(company.workingDays)) {
          company.workingDays = company.workingDays.map((day: string) => day.toLowerCase().trim());
        }

        return {
          company: company,
          payroll: payroll,
          attendance: settings.attendance || {},
          leavePolicies: leavePolicies,
        };
      }
      throw new Error('Failed to load settings');
    } catch (error) {
      console.error('Failed to get settings:', error);
      throw error;
    }
  },

  /**
   * Get settings by type
   */
  async getSettingsByType(type: 'company' | 'payroll' | 'attendance' | 'leave'): Promise<CompanySettings | PayrollSettings | AttendanceRules | LeavePolicy[]> {
    try {
      const response = await settingsApi.getSettingsByType(type);
      if (response.success && response.data.settings) {
        if (type === 'leave') {
          return (response.data.settings as { leavePolicies: LeavePolicy[] }).leavePolicies || [];
        }
        return response.data.settings as CompanySettings | PayrollSettings | AttendanceRules;
      }
      throw new Error('Failed to load settings');
    } catch (error) {
      console.error('Failed to get settings by type:', error);
      throw error;
    }
  },

  /**
   * Update company settings
   */
  async updateCompanySettings(settings: CompanySettings): Promise<void> {
    try {
      // Clean settings before sending (remove empty objects, null values)
      const cleanedSettings = cleanSettings(settings) as CompanySettings;
      const response = await settingsApi.updateCompanySettings(cleanedSettings);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update company settings');
      }
    } catch (error) {
      console.error('Failed to update company settings:', error);
      throw error;
    }
  },

  /**
   * Update payroll settings
   */
  async updatePayrollSettings(settings: PayrollSettings): Promise<void> {
    try {
      // Clean settings before sending (remove empty objects, null values)
      const cleanedSettings = cleanSettings(settings) as PayrollSettings;
      const response = await settingsApi.updatePayrollSettings(cleanedSettings);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update payroll settings');
      }
    } catch (error) {
      console.error('Failed to update payroll settings:', error);
      throw error;
    }
  },

  /**
   * Update attendance rules
   */
  async updateAttendanceRules(rules: AttendanceRules): Promise<void> {
    try {
      // Clean settings before sending (remove empty objects, null values)
      const cleanedRules = cleanSettings(rules) as AttendanceRules;
      const response = await settingsApi.updateAttendanceSettings(cleanedRules);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update attendance rules');
      }
    } catch (error) {
      console.error('Failed to update attendance rules:', error);
      throw error;
    }
  },

  /**
   * Update leave policies
   */
  async updateLeavePolicies(policies: LeavePolicy[]): Promise<void> {
    try {
      // Ensure all policies have IDs (use type as fallback)
      const policiesWithIds = policies.map(policy => ({
        ...policy,
        id: policy.id || policy.type, // Ensure ID exists
      }));
      
      const response = await settingsApi.updateLeavePolicies(policiesWithIds);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update leave policies');
      }
    } catch (error) {
      console.error('Failed to update leave policies:', error);
      throw error;
    }
  },

  /**
   * Get timezone list
   */
  async getTimezones(): Promise<Timezone[]> {
    try {
      const response = await settingsApi.getTimezones();
      if (response.success && response.data.timezones) {
        return response.data.timezones;
      }
      // Fallback to default list
      return [
        { value: 'America/New_York', label: 'Eastern Time (ET)' },
        { value: 'America/Chicago', label: 'Central Time (CT)' },
        { value: 'America/Denver', label: 'Mountain Time (MT)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
        { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
      ];
    } catch (error) {
      console.error('Failed to get timezones:', error);
      // Return fallback list
      return [
        { value: 'America/New_York', label: 'Eastern Time (ET)' },
        { value: 'America/Chicago', label: 'Central Time (CT)' },
        { value: 'America/Denver', label: 'Mountain Time (MT)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
        { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
      ];
    }
  },
};
