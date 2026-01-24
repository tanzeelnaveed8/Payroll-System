import { leaveApi, type LeaveRequest, type LeaveBalance } from '@/lib/api/leave';

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';
export type LeaveType = 'paid' | 'unpaid' | 'sick' | 'annual' | 'casual' | 'maternity' | 'paternity' | 'emergency';

export type { LeaveRequest, LeaveBalance } from '@/lib/api/leave';

export interface LeaveRequestFilter {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  search?: string;
  employeeName?: string;
  department?: string;
  leaveType?: LeaveType;
  dateFrom?: string;
  dateTo?: string;
  status?: LeaveRequestStatus;
}

// Alias for compatibility with components
export type LeaveFilters = LeaveRequestFilter;

export interface LeaveSort {
  field: string;
  direction: 'asc' | 'desc';
}

export const leaveService = {
  // Main method for admin page with pagination and sorting
  async getLeaveRequests(filters: LeaveRequestFilter = {}, sort: LeaveSort = { field: 'submittedDate', direction: 'desc' }, page: number = 1, pageSize: number = 10): Promise<{ data: LeaveRequest[]; total: number }> {
    const response = await leaveApi.getLeaveRequests({
      ...filters,
      page,
      limit: pageSize,
      sort: sort.field,
      order: sort.direction,
    });
    return {
      data: response.data,
      total: response.pagination.total,
    };
  },

  async getLeaveRequest(id: string): Promise<LeaveRequest | null> {
    try {
      const response = await leaveApi.getLeaveRequestById(id);
      return response.data.request;
    } catch {
      return null;
    }
  },

  async getLeaveRequestById(id: string): Promise<LeaveRequest> {
    const response = await leaveApi.getLeaveRequestById(id);
    return response.data.request;
  },

  async createLeaveRequest(data: {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason?: string;
    totalDays: number;
    employeeId: string;
  }): Promise<LeaveRequest> {
    const response = await leaveApi.createLeaveRequest(data);
    return response.data.request;
  },

  async updateLeaveRequest(id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const response = await leaveApi.updateLeaveRequest(id, data);
    return response.data.request;
  },

  async approveLeaveRequest(id: string, comments?: string): Promise<void> {
    await leaveApi.approveLeaveRequest(id, comments);
  },

  async rejectLeaveRequest(id: string, comments: string): Promise<void> {
    await leaveApi.rejectLeaveRequest(id, comments);
  },

  async bulkApprove(ids: string[], comments?: string): Promise<void> {
    await leaveApi.bulkApproveLeaveRequests(ids, comments);
  },

  async bulkReject(ids: string[], comments: string): Promise<void> {
    await leaveApi.bulkRejectLeaveRequests(ids, comments);
  },

  async getAllLeaveBalances(filters: {
    page?: number;
    limit?: number;
    year?: number;
  } = {}): Promise<LeaveBalance[]> {
    const response = await leaveApi.getAllLeaveBalances(filters);
    return response.data;
  },

  async getEmployeeLeaveBalance(employeeId: string, year?: number): Promise<LeaveBalance | null> {
    try {
      const response = await leaveApi.getEmployeeLeaveBalance(employeeId, year);
      return response.data.balance;
    } catch (error) {
      console.error('Failed to fetch employee leave balance:', error);
      return null;
    }
  },

  async getYearSpecificBalance(employeeId: string, year: number): Promise<LeaveBalance> {
    const response = await leaveApi.getYearSpecificBalance(employeeId, year);
    return response.data.balance;
  },

  async getEmployeeLeaveRequests(employeeId: string, filters: {
    page?: number;
    limit?: number;
    status?: LeaveRequestStatus;
    leaveType?: LeaveType;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<LeaveRequest[]> {
    const response = await leaveApi.getEmployeeLeaveRequests(employeeId, filters);
    return response.data;
  },

  async getDepartments(): Promise<string[]> {
    try {
      const response = await leaveApi.getUniqueDepartments();
      return response.data.departments || [];
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      return [];
    }
  },
};
