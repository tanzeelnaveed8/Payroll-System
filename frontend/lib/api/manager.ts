import { apiClient } from './client';

export interface DashboardData {
  teamMembers: number;
  directReports: number;
  pendingApprovals: number;
  timesheetsSubmitted: number;
  leaveRequestsPending: number;
}

export interface TeamMember {
  _id: string;
  id?: string;
  name: string;
  email: string;
  employeeId?: string;
  department?: string;
  position?: string;
  status?: string;
}

export interface PendingApprovals {
  timesheets: number;
  leaveRequests: number;
  total: number;
}

export interface PerformanceUpdate {
  _id: string;
  id?: string;
  employeeId: string | { _id: string; name: string; email: string; employeeId?: string; department?: string };
  managerId: string;
  date: string;
  rating: number;
  summary: string;
  achievements?: string;
  issues?: string;
  blockers?: string;
  nextDayFocus?: string;
  employeeName?: string;
  employeeDepartment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePerformanceUpdateData {
  employeeId: string;
  date: string;
  rating: number;
  summary: string;
  achievements?: string;
  issues?: string;
  blockers?: string;
  nextDayFocus?: string;
}

export interface UpdatePerformanceUpdateData extends Partial<CreatePerformanceUpdateData> {}

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

export const managerApi = {
  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    return apiClient.get<ApiResponse<DashboardData>>('/manager/dashboard');
  },

  async getTeam(): Promise<ApiResponse<{ team: TeamMember[] }>> {
    return apiClient.get<ApiResponse<{ team: TeamMember[] }>>('/manager/team');
  },

  async getTeamMember(id: string): Promise<ApiResponse<{ member: TeamMember }>> {
    return apiClient.get<ApiResponse<{ member: TeamMember }>>(`/manager/team/${id}`);
  },

  async getPendingApprovals(): Promise<ApiResponse<PendingApprovals>> {
    return apiClient.get<ApiResponse<PendingApprovals>>('/manager/pending-approvals');
  },

  async getPendingTimesheets(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString();
    return apiClient.get<PaginatedResponse<any>>(`/manager/timesheets/pending${queryString ? `?${queryString}` : ''}`);
  },

  async getPendingLeaveRequests(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString();
    return apiClient.get<PaginatedResponse<any>>(`/manager/leave-requests/pending${queryString ? `?${queryString}` : ''}`);
  },

  async getPerformanceUpdates(params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<PerformanceUpdate>> {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString();
    return apiClient.get<PaginatedResponse<PerformanceUpdate>>(`/manager/performance-updates${queryString ? `?${queryString}` : ''}`);
  },

  async createPerformanceUpdate(data: CreatePerformanceUpdateData): Promise<ApiResponse<{ update: PerformanceUpdate }>> {
    return apiClient.post<ApiResponse<{ update: PerformanceUpdate }>>('/manager/performance-updates', data);
  },

  async getPerformanceUpdate(id: string): Promise<ApiResponse<{ update: PerformanceUpdate }>> {
    return apiClient.get<ApiResponse<{ update: PerformanceUpdate }>>(`/manager/performance-updates/${id}`);
  },

  async updatePerformanceUpdate(id: string, data: UpdatePerformanceUpdateData): Promise<ApiResponse<{ update: PerformanceUpdate }>> {
    return apiClient.put<ApiResponse<{ update: PerformanceUpdate }>>(`/manager/performance-updates/${id}`, data);
  },
};

