import { apiClient } from './client';

export interface EmployeeDashboardData {
  kpis: {
    hoursLogged: number;
    availableLeave: number;
    latestPay: number;
    nextPayday: string | null;
  };
  weeklyTimesheet: {
    hours: number;
    regularHours: number;
    overtimeHours: number;
    entries: Array<{
      date: string;
      day: string;
      hours: number;
      status: string;
      clockIn?: string;
      clockOut?: string;
    }>;
  };
  latestPaystub: {
    id: string;
    payDate: string;
    grossPay: number;
    netPay: number;
    status: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    pdfUrl?: string;
  } | null;
  leaveOverview: {
    balance: {
      annual: { total: number; used: number; remaining: number };
      sick: { total: number; used: number; remaining: number };
      casual: { total: number; used: number; remaining: number };
    } | null;
    upcomingLeaves: Array<{
      id: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      totalDays: number;
    }>;
  };
}

export interface CurrentTimesheet {
  period: {
    id: string;
    periodStart: string;
    periodEnd: string;
    payDate: string;
  } | null;
  timesheets: Array<{
    id: string;
    date: string;
    day: string;
    hours: number;
    regularHours: number;
    overtimeHours: number;
    clockIn?: string;
    clockOut?: string;
    status: string;
    comments?: string;
  }>;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  status: string;
}

export interface Paystub {
  id: string;
  payDate: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  grossPay: number;
  netPay: number;
  status: string;
  pdfUrl?: string;
}

export interface PaystubDetail extends Paystub {
  regularHours?: number;
  regularRate?: number;
  overtimeHours?: number;
  overtimeRate?: number;
  overtimePay?: number;
  bonuses?: Array<{ name: string; amount: number }>;
  totalEarnings?: number;
  taxes?: {
    federal: number;
    state: number;
    local: number;
    socialSecurity: number;
    medicare: number;
    total: number;
  };
  deductions?: Array<{
    name: string;
    type: string;
    value: number;
    amount: number;
  }>;
  totalDeductions?: number;
  ytdGrossPay?: number;
  ytdNetPay?: number;
  ytdTaxes?: number;
}

export interface LeaveBalance {
  year: number;
  annual: { total: number; used: number; remaining: number; accrued: number; carryForward: number };
  sick: { total: number; used: number; remaining: number; accrued: number; carryForward: number };
  casual: { total: number; used: number; remaining: number };
  paid: { total: number; used: number; remaining: number };
  unpaid: { total: number; used: number; remaining: number };
  maternity: { total: number; used: number; remaining: number };
  paternity: { total: number; used: number; remaining: number };
}

export interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: string;
  submittedDate: string;
  reviewedDate?: string;
  comments?: string;
}

export interface CreateLeaveRequestData {
  startDate: string;
  endDate: string;
  leaveType: string;
  reason?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const employeeApi = {
  async getDashboard(): Promise<ApiResponse<EmployeeDashboardData>> {
    return apiClient.get<ApiResponse<EmployeeDashboardData>>('/employee/dashboard');
  },

  async getCurrentTimesheet(): Promise<ApiResponse<CurrentTimesheet>> {
    return apiClient.get<ApiResponse<CurrentTimesheet>>('/employee/timesheet/current');
  },

  async submitTimesheet(timesheetIds: string[]): Promise<ApiResponse<{ message: string; submittedCount: number }>> {
    return apiClient.post<ApiResponse<{ message: string; submittedCount: number }>>('/employee/timesheet/submit', {
      timesheetIds,
    });
  },

  async getPaystubs(page = 1, limit = 10): Promise<PaginatedResponse<Paystub>> {
    return apiClient.get<PaginatedResponse<Paystub>>(`/employee/paystubs?page=${page}&limit=${limit}`);
  },

  async getPaystubById(id: string): Promise<ApiResponse<{ paystub: PaystubDetail }>> {
    return apiClient.get<ApiResponse<{ paystub: PaystubDetail }>>(`/employee/paystubs/${id}`);
  },

  async getLeaveBalance(): Promise<ApiResponse<LeaveBalance>> {
    return apiClient.get<ApiResponse<LeaveBalance>>('/employee/leave/balance');
  },

  async getLeaveRequests(page = 1, limit = 10): Promise<PaginatedResponse<LeaveRequest>> {
    return apiClient.get<PaginatedResponse<LeaveRequest>>(`/employee/leave/requests?page=${page}&limit=${limit}`);
  },

  async createLeaveRequest(data: CreateLeaveRequestData): Promise<ApiResponse<{ leaveRequest: LeaveRequest }>> {
    return apiClient.post<ApiResponse<{ leaveRequest: LeaveRequest }>>('/employee/leave/requests', data);
  },
};

