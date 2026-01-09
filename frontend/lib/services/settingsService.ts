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
 */
function cleanSettings<T extends Record<string, any>>(settings: T): Partial<T> {
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(settings)) {
    // Skip null, undefined, empty strings
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    // Skip empty objects
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
        return {
          company: response.data.settings.company || {},
          payroll: response.data.settings.payroll || {},
          attendance: response.data.settings.attendance || {},
          leavePolicies: response.data.settings.leavePolicies || [],
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
      const response = await settingsApi.updateLeavePolicies(policies);
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
