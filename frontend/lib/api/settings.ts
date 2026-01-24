import { apiClient } from './client';

export type SettingsType = 'company' | 'payroll' | 'attendance' | 'leave';

export interface CompanySettings {
  companyName?: string;
  legalName?: string;
  logoUrl?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  taxId?: string;
  registrationNumber?: string;
  timezone?: string;
  workingDays?: string[];
  fiscalYearStart?: string;
}

export interface PayrollSettings {
  salaryCycle?: 'monthly' | 'bi-weekly' | 'weekly' | 'semi-monthly';
  payDay?: number;
  overtimeRules?: {
    enabled?: boolean;
    rate?: number;
    threshold?: number;
    doubleTimeThreshold?: number;
  };
  bonuses?: Array<{
    id?: string;
    name?: string;
    type?: 'fixed' | 'percentage';
    value?: number;
    enabled?: boolean;
    applicableRoles?: string[];
  }>;
  deductions?: Array<{
    id?: string;
    name?: string;
    type?: 'fixed' | 'percentage';
    value?: number;
    enabled?: boolean;
    mandatory?: boolean;
  }>;
  taxSettings?: {
    federalRate?: number;
    stateRate?: number;
    localRate?: number;
    socialSecurityRate?: number;
    medicareRate?: number;
  };
}

export interface AttendanceRules {
  dailyWorkingHours?: number;
  weeklyWorkingHours?: number;
  lateArrivalThreshold?: number;
  earlyDepartureThreshold?: number;
  overtimeEligibility?: {
    enabled?: boolean;
    minimumHours?: number;
  };
  breakRules?: {
    lunchDuration?: number;
    breakDuration?: number;
    mandatoryBreak?: boolean;
  };
  trackingMethod?: 'manual' | 'automatic' | 'hybrid';
}

export interface LeavePolicy {
  id?: string;
  type: 'paid' | 'unpaid' | 'sick' | 'annual' | 'casual' | 'maternity' | 'paternity' | 'emergency';
  name: string;
  maxDays?: number;
  accrualRate?: number;
  carryForwardLimit?: number;
  carryForwardEnabled?: boolean;
  maxAccrualLimit?: number;
  enabled?: boolean;
  applicableRoles?: string[];
  requiresApproval?: boolean;
  noticePeriod?: number;
}

export interface AllSettings {
  company: CompanySettings;
  payroll: PayrollSettings;
  attendance: AttendanceRules;
  leavePolicies: LeavePolicy[];
}

export interface SettingsResponse {
  success: boolean;
  message: string;
  data: {
    settings?: AllSettings | CompanySettings | PayrollSettings | AttendanceRules | { leavePolicies: LeavePolicy[] };
    type?: SettingsType;
  };
}

export interface Timezone {
  value: string;
  label: string;
}

export interface TimezonesResponse {
  success: boolean;
  message: string;
  data: {
    timezones: Timezone[];
  };
}

export const settingsApi = {
  /**
   * GET /api/settings - Get all settings
   */
  async getAllSettings(): Promise<SettingsResponse> {
    return apiClient.get<SettingsResponse>('/settings');
  },

  /**
   * GET /api/settings/:type - Get settings by type
   */
  async getSettingsByType(type: SettingsType): Promise<SettingsResponse> {
    return apiClient.get<SettingsResponse>(`/settings/${type}`);
  },

  /**
   * PUT /api/settings/company - Update company settings
   */
  async updateCompanySettings(settings: CompanySettings): Promise<SettingsResponse> {
    return apiClient.put<SettingsResponse>('/settings/company', settings);
  },

  /**
   * PUT /api/settings/payroll - Update payroll settings
   */
  async updatePayrollSettings(settings: PayrollSettings): Promise<SettingsResponse> {
    return apiClient.put<SettingsResponse>('/settings/payroll', settings);
  },

  /**
   * PUT /api/settings/attendance - Update attendance settings
   */
  async updateAttendanceSettings(settings: AttendanceRules): Promise<SettingsResponse> {
    return apiClient.put<SettingsResponse>('/settings/attendance', settings);
  },

  /**
   * PUT /api/settings/leave-policies - Update leave policies
   */
  async updateLeavePolicies(leavePolicies: LeavePolicy[]): Promise<SettingsResponse> {
    return apiClient.put<SettingsResponse>('/settings/leave-policies', { leavePolicies });
  },

  /**
   * GET /api/settings/timezones - Get timezone list
   */
  async getTimezones(): Promise<TimezonesResponse> {
    return apiClient.get<TimezonesResponse>('/settings/timezones');
  },
};

