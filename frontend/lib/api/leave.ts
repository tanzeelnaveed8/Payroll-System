import { apiClient } from './client';

export interface LeaveRequest {
  id: string;
  employeeId: string | { _id: string; name: string; email: string; employeeId?: string };
  leaveType: 'paid' | 'unpaid' | 'sick' | 'annual' | 'casual' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  reviewedBy?: string | { _id: string; name: string; email: string };
  reviewedDate?: string;
  comments?: string;
  leaveBalanceBefore?: {
    paid?: number;
    unpaid?: number;
    sick?: number;
    annual?: number;
  };
  leaveBalanceAfter?: {
    paid?: number;
    unpaid?: number;
    sick?: number;
    annual?: number;
  };
  employeeName?: string;
  employeeEmail?: string;
  employeeDepartment?: string;
  employeeRole?: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string | { _id: string; name: string; email: string; employeeId?: string };
  year: number;
  annual?: {
    total: number;
    used: number;
    remaining: number;
    accrued: number;
    carryForward: number;
  };
  sick?: {
    total: number;
    used: number;
    remaining: number;
    accrued: number;
    carryForward: number;
  };
  casual?: {
    total: number;
    used: number;
    remaining: number;
  };
  paid?: {
    total: number;
    used: number;
    remaining: number;
  };
  unpaid?: {
    total: number;
    used: number;
    remaining: number;
  };
  maternity?: {
    total: number;
    used: number;
    remaining: number;
  };
  paternity?: {
    total: number;
    used: number;
    remaining: number;
  };
  accrualRate?: {
    annual: number;
    sick: number;
  };
}

export interface LeaveRequestsResponse {
  success: boolean;
  message: string;
  data: LeaveRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LeaveRequestResponse {
  success: boolean;
  message: string;
  data: { request: LeaveRequest };
}

export interface LeaveBalanceResponse {
  success: boolean;
  message: string;
  data: { balance: LeaveBalance };
}

export interface LeaveBalancesResponse {
  success: boolean;
  message: string;
  data: LeaveBalance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DepartmentsResponse {
  success: boolean;
  message: string;
  data: { departments: string[] };
}

const transformLeaveRequest = (request: any): LeaveRequest => ({
  id: request._id || request.id,
  employeeId: request.employeeId?._id || request.employeeId || '',
  leaveType: request.leaveType,
  startDate: request.startDate,
  endDate: request.endDate,
  totalDays: request.totalDays,
  reason: request.reason,
  status: request.status,
  submittedDate: request.submittedDate,
  reviewedBy: request.reviewedBy?._id || request.reviewedBy,
  reviewedDate: request.reviewedDate,
  comments: request.comments,
  leaveBalanceBefore: request.leaveBalanceBefore,
  leaveBalanceAfter: request.leaveBalanceAfter,
  employeeName: request.employeeName || request.employeeId?.name,
  employeeEmail: request.employeeEmail || request.employeeId?.email,
  employeeDepartment: request.employeeDepartment || request.employeeId?.department,
  employeeRole: request.employeeRole || request.employeeId?.role,
});

const transformLeaveBalance = (balance: any): LeaveBalance => ({
  id: balance._id || balance.id,
  employeeId: balance.employeeId?._id || balance.employeeId || '',
  year: balance.year,
  annual: balance.annual,
  sick: balance.sick,
  casual: balance.casual,
  paid: balance.paid,
  unpaid: balance.unpaid,
  maternity: balance.maternity,
  paternity: balance.paternity,
  accrualRate: balance.accrualRate,
});

export const leaveApi = {
  async getLeaveRequests(filters: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
    search?: string;
    employeeName?: string;
    department?: string;
    leaveType?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  } = {}): Promise<LeaveRequestsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== ('' as any)) {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    const response = await apiClient.get<{ success: boolean; message: string; data: any[]; pagination: any }>(`/leave/requests${query ? `?${query}` : ''}`);
    return {
      ...response,
      data: Array.isArray(response.data) ? response.data.map(transformLeaveRequest) : [],
    };
  },

  async getLeaveRequestById(id: string): Promise<LeaveRequestResponse> {
    const response = await apiClient.get<{ success: boolean; message: string; data: { request: any } }>(`/leave/requests/${id}`);
    return {
      ...response,
      data: { request: transformLeaveRequest(response.data.request) },
    };
  },

  async createLeaveRequest(data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }): Promise<LeaveRequestResponse> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { request: any } }>('/leave/requests', data);
    return {
      ...response,
      data: { request: transformLeaveRequest(response.data.request) },
    };
  },

  async updateLeaveRequest(id: string, data: {
    startDate?: string;
    endDate?: string;
    leaveType?: string;
    reason?: string;
  }): Promise<LeaveRequestResponse> {
    const response = await apiClient.put<{ success: boolean; message: string; data: { request: any } }>(`/leave/requests/${id}`, data);
    return {
      ...response,
      data: { request: transformLeaveRequest(response.data.request) },
    };
  },

  async approveLeaveRequest(id: string, comments?: string): Promise<LeaveRequestResponse> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { request: any } }>(`/leave/requests/${id}/approve`, { comments });
    return {
      ...response,
      data: { request: transformLeaveRequest(response.data.request) },
    };
  },

  async rejectLeaveRequest(id: string, comments: string): Promise<LeaveRequestResponse> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { request: any } }>(`/leave/requests/${id}/reject`, { comments });
    return {
      ...response,
      data: { request: transformLeaveRequest(response.data.request) },
    };
  },

  async bulkApproveLeaveRequests(requestIds: string[], comments?: string): Promise<{ success: boolean; message: string; data: any }> {
    // Backend accepts both requestIds and ids
    return apiClient.post('/leave/requests/bulk/approve', { requestIds, ids: requestIds, comments });
  },

  async bulkRejectLeaveRequests(requestIds: string[], comments: string): Promise<{ success: boolean; message: string; data: any }> {
    // Backend accepts both requestIds and ids
    return apiClient.post('/leave/requests/bulk/reject', { requestIds, ids: requestIds, comments });
  },

  async getAllLeaveBalances(filters: {
    page?: number;
    limit?: number;
    year?: number;
  } = {}): Promise<LeaveBalancesResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== ('' as any)) {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    const response = await apiClient.get<{ success: boolean; message: string; data: any[]; pagination: any }>(`/leave/balances${query ? `?${query}` : ''}`);
    return {
      ...response,
      data: Array.isArray(response.data) ? response.data.map(transformLeaveBalance) : [],
    };
  },

  async getEmployeeLeaveBalance(employeeId: string, year?: number): Promise<LeaveBalanceResponse> {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    const query = params.toString();
    const response = await apiClient.get<{ success: boolean; message: string; data: { balance: any } }>(`/leave/balances/${employeeId}${query ? `?${query}` : ''}`);
    return {
      ...response,
      data: { balance: transformLeaveBalance(response.data.balance) },
    };
  },

  async getYearSpecificBalance(employeeId: string, year: number): Promise<LeaveBalanceResponse> {
    const response = await apiClient.get<{ success: boolean; message: string; data: { balance: any } }>(`/leave/balances/${employeeId}/${year}`);
    return {
      ...response,
      data: { balance: transformLeaveBalance(response.data.balance) },
    };
  },

  async getEmployeeLeaveRequests(employeeId: string, filters: {
    page?: number;
    limit?: number;
    status?: string;
    leaveType?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<LeaveRequestsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== ('' as any)) {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    const response = await apiClient.get<{ success: boolean; message: string; data: any[]; pagination: any }>(`/leave/requests/employee/${employeeId}${query ? `?${query}` : ''}`);
    return {
      ...response,
      data: Array.isArray(response.data) ? response.data.map(transformLeaveRequest) : [],
    };
  },

  async getUniqueDepartments(): Promise<DepartmentsResponse> {
    return apiClient.get('/leave/departments');
  },
};

