import { apiClient } from './client';

export interface Timesheet {
  id: string;
  employeeId: string | { _id: string; name: string; email: string; employeeId?: string };
  payrollPeriodId?: string | { _id: string; periodStart: string; periodEnd: string; payDate: string };
  date: string;
  day?: string;
  clockIn?: string;
  clockOut?: string;
  hours: number;
  regularHours?: number;
  overtimeHours?: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  approvedBy?: string | { _id: string; name: string; email: string };
  approvedAt?: string;
  rejectedBy?: string | { _id: string; name: string; email: string };
  rejectedAt?: string;
  comments?: string;
  employeeName?: string;
  department?: string;
  role?: string;
}

export interface TimesheetsResponse {
  success: boolean;
  message: string;
  data: Timesheet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TimesheetResponse {
  success: boolean;
  message: string;
  data: { timesheet: Timesheet };
}

export interface DepartmentsResponse {
  success: boolean;
  message: string;
  data: { departments: string[] };
}

export interface RolesResponse {
  success: boolean;
  message: string;
  data: { roles: string[] };
}

const transformTimesheet = (timesheet: any): Timesheet => ({
  id: timesheet._id || timesheet.id,
  employeeId: timesheet.employeeId?._id || timesheet.employeeId || '',
  payrollPeriodId: timesheet.payrollPeriodId?._id || timesheet.payrollPeriodId,
  date: timesheet.date,
  day: timesheet.day,
  clockIn: timesheet.clockIn,
  clockOut: timesheet.clockOut,
  hours: timesheet.hours,
  regularHours: timesheet.regularHours,
  overtimeHours: timesheet.overtimeHours,
  status: timesheet.status,
  submittedAt: timesheet.submittedAt,
  approvedBy: timesheet.approvedBy,
  approvedAt: timesheet.approvedAt,
  rejectedBy: timesheet.rejectedBy,
  rejectedAt: timesheet.rejectedAt,
  comments: timesheet.comments,
  employeeName: timesheet.employeeName || timesheet.employeeId?.name,
  department: timesheet.department || timesheet.employeeId?.department,
  role: timesheet.role || timesheet.employeeId?.role,
});

export const timesheetApi = {
  async getTimesheets(filters: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
    search?: string;
    employeeName?: string;
    department?: string;
    role?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    employeeId?: string;
  } = {}): Promise<TimesheetsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    const response = await apiClient.get<{ success: boolean; message: string; data: any[]; pagination: any }>(
      `/timesheets${query ? `?${query}` : ''}`
    );
    return {
      ...response,
      data: response.data.map(transformTimesheet),
    };
  },

  async getTimesheetById(id: string): Promise<TimesheetResponse> {
    const response = await apiClient.get<{ success: boolean; message: string; data: { timesheet: any } }>(
      `/timesheets/${id}`
    );
    return {
      ...response,
      data: { timesheet: transformTimesheet(response.data.timesheet) },
    };
  },

  async createTimesheet(data: {
    date: string;
    hours: number;
    clockIn?: string;
    clockOut?: string;
    payrollPeriodId?: string;
    comments?: string;
  }): Promise<TimesheetResponse> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { timesheet: any } }>(
      '/timesheets',
      data
    );
    return {
      ...response,
      data: { timesheet: transformTimesheet(response.data.timesheet) },
    };
  },

  async updateTimesheet(id: string, data: {
    date?: string;
    hours?: number;
    clockIn?: string;
    clockOut?: string;
    comments?: string;
  }): Promise<TimesheetResponse> {
    const response = await apiClient.put<{ success: boolean; message: string; data: { timesheet: any } }>(
      `/timesheets/${id}`,
      data
    );
    return {
      ...response,
      data: { timesheet: transformTimesheet(response.data.timesheet) },
    };
  },

  async submitTimesheet(id: string): Promise<TimesheetResponse> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { timesheet: any } }>(
      `/timesheets/${id}/submit`
    );
    return {
      ...response,
      data: { timesheet: transformTimesheet(response.data.timesheet) },
    };
  },

  async approveTimesheet(id: string, comments?: string): Promise<TimesheetResponse> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { timesheet: any } }>(
      `/timesheets/${id}/approve`,
      { comments }
    );
    return {
      ...response,
      data: { timesheet: transformTimesheet(response.data.timesheet) },
    };
  },

  async rejectTimesheet(id: string, reason: string): Promise<TimesheetResponse> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { timesheet: any } }>(
      `/timesheets/${id}/reject`,
      { reason }
    );
    return {
      ...response,
      data: { timesheet: transformTimesheet(response.data.timesheet) },
    };
  },

  async bulkApproveTimesheets(timesheetIds: string[], comments?: string): Promise<{ success: boolean; message: string; data: any }> {
    return apiClient.post('/timesheets/bulk/approve', { timesheetIds, comments });
  },

  async bulkRejectTimesheets(timesheetIds: string[], reason: string): Promise<{ success: boolean; message: string; data: any }> {
    return apiClient.post('/timesheets/bulk/reject', { timesheetIds, reason });
  },

  async getEmployeeTimesheets(employeeId: string, filters: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  } = {}): Promise<TimesheetsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    const response = await apiClient.get<{ success: boolean; message: string; data: any[]; pagination: any }>(
      `/timesheets/employee/${employeeId}${query ? `?${query}` : ''}`
    );
    return {
      ...response,
      data: response.data.map(transformTimesheet),
    };
  },

  async getEmployeePeriodTimesheet(employeeId: string, periodId: string): Promise<{ success: boolean; message: string; data: { period: any; timesheets: any[] } }> {
    const response = await apiClient.get<{ success: boolean; message: string; data: { period: any; timesheets: any[] } }>(
      `/timesheets/employee/${employeeId}/period/${periodId}`
    );
    return {
      ...response,
      data: {
        period: response.data.period,
        timesheets: response.data.timesheets.map(transformTimesheet),
      },
    };
  },

  async getUniqueDepartments(): Promise<DepartmentsResponse> {
    return apiClient.get<DepartmentsResponse>('/timesheets/departments');
  },

  async getUniqueRoles(): Promise<RolesResponse> {
    return apiClient.get<RolesResponse>('/timesheets/roles');
  },
};

