import { apiClient } from './client';

export interface AdminDashboardData {
  kpis: {
    totalEmployees: number;
    employeeGrowth: number;
    newHiresLast30Days: number;
    payrollStatus: {
      total: number;
      status: string;
      nextPayday: string | null;
    };
    pendingApprovals: number;
    pendingTimesheets: number;
    pendingLeaveRequests: number;
    pendingPayroll: number;
    totalDepartments: number;
    averageSalary: number;
    leaveRequestsThisMonth: number;
    timesheetCompletionRate: number;
    compliance: number;
  };
  recentPayrollActivity: Array<{
    id: string;
    period: string;
    amount: number;
    status: string;
    date: string;
    employees: number;
  }>;
  departmentBreakdown: {
    departments: Array<{
      id: string;
      name: string;
      employees: number;
      payroll: number;
      bgColor: string;
      barColor: string;
    }>;
    largestDepartment: string | null;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const adminApi = {
  async getDashboard(): Promise<AdminDashboardData> {
    const response = await apiClient.get<ApiResponse<AdminDashboardData>>('/admin/dashboard');
    return response.data;
  }
};

