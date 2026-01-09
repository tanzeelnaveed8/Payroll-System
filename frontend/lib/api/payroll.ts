import { apiClient } from './client';

export interface PayrollPeriod {
  id: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  status: 'draft' | 'processing' | 'completed' | 'cancelled';
  department?: string;
  departmentId?: string;
  employeeCount?: number;
  totalAmount?: number;
  totalGrossPay?: number;
  totalDeductions?: number;
  totalNetPay?: number;
  totalTaxes?: number;
  processedBy?: { _id: string; name: string; email: string };
  processedAt?: string;
  approvedBy?: { _id: string; name: string; email: string };
  approvedAt?: string;
}

export interface Paystub {
  id: string;
  employeeId: { _id: string; name: string; email: string; employeeId?: string };
  payrollPeriodId: PayrollPeriod;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  status: 'paid' | 'processing' | 'pending';
  grossPay: number;
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
  deductions?: Array<{ name: string; type: string; value: number; amount: number }>;
  totalDeductions?: number;
  netPay: number;
  ytdGrossPay?: number;
  ytdNetPay?: number;
  ytdTaxes?: number;
}

export interface PayrollPeriodsResponse {
  success: boolean;
  message: string;
  data: PayrollPeriod[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PayrollPeriodResponse {
  success: boolean;
  message: string;
  data: { period: PayrollPeriod };
}

export interface PaystubsResponse {
  success: boolean;
  message: string;
  data: Paystub[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaystubResponse {
  success: boolean;
  message: string;
  data: { paystub: Paystub };
}

export interface NextPayDateResponse {
  success: boolean;
  message: string;
  data: { nextPayDate: string | null };
}

const transformPeriod = (period: any): PayrollPeriod => ({
  id: period._id || period.id,
  periodStart: period.periodStart,
  periodEnd: period.periodEnd,
  payDate: period.payDate,
  status: period.status,
  department: period.department,
  departmentId: period.departmentId?._id || period.departmentId,
  employeeCount: period.employeeCount,
  totalAmount: period.totalAmount || period.totalNetPay,
  totalGrossPay: period.totalGrossPay,
  totalDeductions: period.totalDeductions,
  totalNetPay: period.totalNetPay,
  totalTaxes: period.totalTaxes,
  processedBy: period.processedBy,
  processedAt: period.processedAt,
  approvedBy: period.approvedBy,
  approvedAt: period.approvedAt,
});

const transformPaystub = (paystub: any): Paystub => ({
  id: paystub._id || paystub.id,
  employeeId: paystub.employeeId,
  payrollPeriodId: paystub.payrollPeriodId,
  payPeriodStart: paystub.payPeriodStart,
  payPeriodEnd: paystub.payPeriodEnd,
  payDate: paystub.payDate,
  status: paystub.status,
  grossPay: paystub.grossPay,
  regularHours: paystub.regularHours,
  regularRate: paystub.regularRate,
  overtimeHours: paystub.overtimeHours,
  overtimeRate: paystub.overtimeRate,
  overtimePay: paystub.overtimePay,
  bonuses: paystub.bonuses,
  totalEarnings: paystub.totalEarnings,
  taxes: paystub.taxes,
  deductions: paystub.deductions,
  totalDeductions: paystub.totalDeductions,
  netPay: paystub.netPay,
  ytdGrossPay: paystub.ytdGrossPay,
  ytdNetPay: paystub.ytdNetPay,
  ytdTaxes: paystub.ytdTaxes,
});

export const payrollApi = {
  async getPayrollPeriods(filters: { status?: string; departmentId?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number } = {}): Promise<PayrollPeriodsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    const response = await apiClient.get<{ success: boolean; message: string; data: any[]; pagination: any }>(`/payroll/periods${query ? `?${query}` : ''}`);
    return {
      ...response,
      data: response.data.map(transformPeriod),
    };
  },

  async getPayrollPeriodById(id: string): Promise<PayrollPeriodResponse> {
    const response = await apiClient.get<{ success: boolean; message: string; data: { period: any } }>(`/payroll/periods/${id}`);
    return {
      ...response,
      data: { period: transformPeriod(response.data.period) },
    };
  },

  async createPayrollPeriod(data: { periodStart: string; periodEnd: string; payDate: string; departmentId?: string; department?: string }): Promise<PayrollPeriodResponse> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { period: any } }>('/payroll/periods', data);
    return {
      ...response,
      data: { period: transformPeriod(response.data.period) },
    };
  },

  async updatePayrollPeriod(id: string, data: Partial<PayrollPeriod>): Promise<PayrollPeriodResponse> {
    const response = await apiClient.put<{ success: boolean; message: string; data: { period: any } }>(`/payroll/periods/${id}`, data);
    return {
      ...response,
      data: { period: transformPeriod(response.data.period) },
    };
  },

  async processPayroll(periodId: string): Promise<{ success: boolean; message: string; data: any }> {
    return apiClient.post(`/payroll/periods/${periodId}/process`);
  },

  async approvePayroll(periodId: string): Promise<{ success: boolean; message: string; data: any }> {
    return apiClient.post(`/payroll/periods/${periodId}/approve`);
  },

  async getCurrentPeriod(): Promise<PayrollPeriodResponse> {
    const response = await apiClient.get<{ success: boolean; message: string; data: { period: any | null } }>('/payroll/periods/current');
    if (response.data.period) {
      return {
        ...response,
        data: { period: transformPeriod(response.data.period) },
      };
    }
    return response as PayrollPeriodResponse;
  },

  async getNextPayDate(): Promise<NextPayDateResponse> {
    return apiClient.get<NextPayDateResponse>('/payroll/next-date');
  },

  async getPaystubs(filters: { employeeId?: string; payrollPeriodId?: string; status?: string; page?: number; limit?: number } = {}): Promise<PaystubsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    const response = await apiClient.get<{ success: boolean; message: string; data: any[]; pagination: any }>(`/payroll/paystubs${query ? `?${query}` : ''}`);
    return {
      ...response,
      data: response.data.map(transformPaystub),
    };
  },

  async getPaystubById(id: string): Promise<PaystubResponse> {
    const response = await apiClient.get<{ success: boolean; message: string; data: { paystub: any } }>(`/payroll/paystubs/${id}`);
    return {
      ...response,
      data: { paystub: transformPaystub(response.data.paystub) },
    };
  },

  async getPaystubPDF(id: string): Promise<void> {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    const response = await fetch(`${API_BASE_URL}/payroll/paystubs/${id}/pdf`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch PDF' }));
      throw new Error(error.message || 'Failed to fetch PDF');
    }
    
    const html = await response.text();
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paystub-${id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async getEmployeePaystubs(employeeId: string, page = 1, limit = 10): Promise<PaystubsResponse> {
    const response = await apiClient.get<{ success: boolean; message: string; data: any[]; pagination: any }>(`/payroll/paystubs/employee/${employeeId}?page=${page}&limit=${limit}`);
    return {
      ...response,
      data: response.data.map(transformPaystub),
    };
  },

  async calculatePayroll(periodId: string): Promise<{ success: boolean; message: string; data: any }> {
    return apiClient.post('/payroll/calculate', { periodId });
  },
};

