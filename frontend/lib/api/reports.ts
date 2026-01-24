import { apiClient } from './client';

export type ReportType = 'payroll' | 'attendance' | 'leave' | 'department' | 'employee' | 'financial';

export type ReportData = any;

export interface PayrollSummary {
  totalPayroll: number;
  employeeCount: number;
  averageSalary: number;
  period: string;
}

export interface AttendanceOverview {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateArrivals: number;
  attendanceRate: number;
}

export interface LeaveTypeCount {
  type: string;
  count: number;
}

export interface LeaveAnalytics {
  totalLeaves: number;
  approvedLeaves: number;
  pendingLeaves: number;
  rejectedLeaves: number;
  leaveTypes: LeaveTypeCount[];
}

export interface DepartmentCost {
  department: string;
  departmentId?: string;
  employeeCount: number;
  totalCost: number;
  percentage: number;
}

export interface Report {
  _id: string;
  reportType: ReportType;
  period: string;
  dateFrom: string;
  dateTo: string;
  department?: string;
  departmentId?: string;
  payrollSummary?: PayrollSummary;
  attendanceOverview?: AttendanceOverview;
  leaveAnalytics?: LeaveAnalytics;
  departmentCosts?: DepartmentCost[];
  reportData?: any;
  pdfFileId?: string;
  excelFileId?: string;
  generatedAt: string;
  generatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  expiresAt?: string;
  createdAt: string;
}

export interface ReportsResponse {
  success: boolean;
  message: string;
  data: {
    items: Report[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ReportResponse {
  success: boolean;
  message: string;
  data: {
    report: Report;
  };
}

export interface GenerateReportRequest {
  type: ReportType;
  dateFrom: string;
  dateTo: string;
  departmentId?: string;
  employeeId?: string;
  expiresInDays?: number;
}

export interface GenerateReportResponse {
  success: boolean;
  message: string;
  data: {
    report: Report;
  };
}

export interface QuickReportResponse {
  success: boolean;
  message: string;
  data: {
    payrollSummary?: PayrollSummary;
    attendanceOverview?: AttendanceOverview;
    leaveAnalytics?: LeaveAnalytics;
    departmentCosts?: DepartmentCost[];
  };
}

export const reportsApi = {
  /**
   * GET /api/reports - List reports with filters
   */
  async getReports(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    type?: ReportType;
    dateFrom?: string;
    dateTo?: string;
    departmentId?: string;
    createdBy?: string;
  }): Promise<ReportsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== ('' as any)) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return apiClient.get<ReportsResponse>(`/reports${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * GET /api/reports/:id - Get report by ID
   */
  async getReportById(id: string): Promise<ReportResponse> {
    return apiClient.get<ReportResponse>(`/reports/${id}`);
  },

  /**
   * POST /api/reports/generate - Generate a new report
   */
  async generateReport(data: GenerateReportRequest): Promise<GenerateReportResponse> {
    return apiClient.post<GenerateReportResponse>('/reports/generate', data);
  },

  /**
   * GET /api/reports/:id/pdf - Download PDF
   */
  async downloadPDF(id: string): Promise<Blob> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/reports/${id}/pdf`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }
    return response.blob();
  },

  /**
   * GET /api/reports/:id/excel - Download Excel
   */
  async downloadExcel(id: string): Promise<Blob> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/reports/${id}/excel`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    if (!response.ok) {
      throw new Error('Failed to download Excel');
    }
    return response.blob();
  },

  /**
   * GET /api/reports/payroll-summary - Quick payroll summary
   */
  async getPayrollSummary(dateFrom: string, dateTo: string, departmentId?: string): Promise<QuickReportResponse> {
    const params = new URLSearchParams();
    params.append('dateFrom', dateFrom);
    params.append('dateTo', dateTo);
    if (departmentId) {
      params.append('departmentId', departmentId);
    }
    return apiClient.get<QuickReportResponse>(`/reports/payroll-summary?${params.toString()}`);
  },

  /**
   * GET /api/reports/attendance-overview - Quick attendance overview
   */
  async getAttendanceOverview(dateFrom: string, dateTo: string, departmentId?: string): Promise<QuickReportResponse> {
    const params = new URLSearchParams();
    params.append('dateFrom', dateFrom);
    params.append('dateTo', dateTo);
    if (departmentId) {
      params.append('departmentId', departmentId);
    }
    return apiClient.get<QuickReportResponse>(`/reports/attendance-overview?${params.toString()}`);
  },

  /**
   * GET /api/reports/leave-analytics - Quick leave analytics
   */
  async getLeaveAnalytics(dateFrom: string, dateTo: string, departmentId?: string): Promise<QuickReportResponse> {
    const params = new URLSearchParams();
    params.append('dateFrom', dateFrom);
    params.append('dateTo', dateTo);
    if (departmentId) {
      params.append('departmentId', departmentId);
    }
    return apiClient.get<QuickReportResponse>(`/reports/leave-analytics?${params.toString()}`);
  },

  /**
   * GET /api/reports/department-costs - Quick department costs
   */
  async getDepartmentCosts(dateFrom: string, dateTo: string): Promise<QuickReportResponse> {
    const params = new URLSearchParams();
    params.append('dateFrom', dateFrom);
    params.append('dateTo', dateTo);
    return apiClient.get<QuickReportResponse>(`/reports/department-costs?${params.toString()}`);
  },

  /**
   * GET /api/reports/executive - Get executive report (all summaries)
   */
  async getExecutiveReport(dateFrom: string, dateTo: string, departmentId?: string): Promise<QuickReportResponse> {
    const params = new URLSearchParams();
    params.append('dateFrom', dateFrom);
    params.append('dateTo', dateTo);
    if (departmentId) {
      params.append('departmentId', departmentId);
    }
    return apiClient.get<QuickReportResponse>(`/reports/executive?${params.toString()}`);
  },
};
