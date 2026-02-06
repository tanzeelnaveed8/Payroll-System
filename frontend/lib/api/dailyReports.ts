import { apiClient } from './client';

export interface TaskCompleted {
  taskId?: string;
  taskTitle: string;
  description: string;
  hoursSpent?: number;
}

export interface Accomplishment {
  title: string;
  description: string;
  impact?: string;
}

export interface Challenge {
  title: string;
  description: string;
  resolution?: string;
}

export interface DailyReport {
  _id?: string;
  id?: string;
  employeeId: string | { _id: string; name: string; email: string; employeeId?: string; position?: string };
  reportDate: string;
  departmentId?: string;
  department?: string;
  tasksCompleted: TaskCompleted[];
  accomplishments: Accomplishment[];
  challenges: Challenge[];
  hoursWorked: number;
  overtimeHours: number;
  status: 'draft' | 'submitted' | 'reviewed';
  notes?: string;
  reviewedBy?: string | { _id: string; name: string; email: string };
  reviewedAt?: string;
  reviewComments?: string;
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
}

export interface DepartmentReportsData {
  reports: DailyReport[];
  employees: Array<{
    employee: {
      _id: string;
      name: string;
      email: string;
      employeeId?: string;
      position?: string;
    };
    reports: DailyReport[];
  }>;
  summary: {
    totalEmployees: number;
    employeesWithReports: number;
    totalReports: number;
    submittedReports: number;
    pendingReports: number;
  };
}

export interface ReportStats {
  totalEmployees: number;
  employeesWithReports: number;
  submissionRate: number;
  averageHoursWorked: number;
  totalHoursWorked: number;
  totalReports: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const dailyReportsApi = {
  async createReport(report: Partial<DailyReport>): Promise<ApiResponse<DailyReport>> {
    return apiClient.post<ApiResponse<DailyReport>>('/daily-reports', report);
  },

  async getMyReports(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
  }): Promise<ApiResponse<{ reports: DailyReport[] }>> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const query = params.toString();
    return apiClient.get<ApiResponse<{ reports: DailyReport[] }>>(
      `/daily-reports/employee${query ? `?${query}` : ''}`
    );
  },

  async getDepartmentReports(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    employeeId?: string;
    limit?: number;
  }): Promise<ApiResponse<DepartmentReportsData>> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const query = params.toString();
    return apiClient.get<ApiResponse<DepartmentReportsData>>(
      `/daily-reports/department${query ? `?${query}` : ''}`
    );
  },

  async getReportById(reportId: string): Promise<ApiResponse<DailyReport>> {
    return apiClient.get<ApiResponse<DailyReport>>(`/daily-reports/${reportId}`);
  },

  async reviewReport(reportId: string, comments: string): Promise<ApiResponse<DailyReport>> {
    return apiClient.post<ApiResponse<DailyReport>>(`/daily-reports/${reportId}/review`, { comments });
  },

  async getReportStats(period: 'week' | 'month' | '30days' = 'week'): Promise<ApiResponse<ReportStats>> {
    return apiClient.get<ApiResponse<ReportStats>>(`/daily-reports/department/stats?period=${period}`);
  },
};
