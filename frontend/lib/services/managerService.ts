import { managerApi, type DashboardData, type TeamMember, type PerformanceUpdate, type CreatePerformanceUpdateData, type UpdatePerformanceUpdateData } from '@/lib/api/manager';

export const managerService = {
  async getDashboard(): Promise<DashboardData> {
    const response = await managerApi.getDashboard();
    if (response.success && response.data) {
      return response.data;
    }
    return {
      teamMembers: 0,
      directReports: 0,
      pendingApprovals: 0,
      timesheetsSubmitted: 0,
      leaveRequestsPending: 0,
    };
  },

  async getTeam(): Promise<TeamMember[]> {
    const response = await managerApi.getTeam();
    if (response.success && response.data?.team) {
      return response.data.team.map(member => ({
        ...member,
        id: member._id || member.id,
      }));
    }
    return [];
  },

  async getTeamMember(id: string): Promise<TeamMember | null> {
    const response = await managerApi.getTeamMember(id);
    if (response.success && response.data?.member) {
      return {
        ...response.data.member,
        id: response.data.member._id || response.data.member.id,
      };
    }
    return null;
  },

  async getPendingApprovals() {
    const response = await managerApi.getPendingApprovals();
    if (response.success && response.data) {
      return response.data;
    }
    return { timesheets: 0, leaveRequests: 0, total: 0 };
  },

  async getPendingTimesheets(params?: { page?: number; limit?: number }) {
    const response = await managerApi.getPendingTimesheets(params);
    if (response.success && response.data) {
      return {
        timesheets: response.data,
        pagination: response.pagination,
      };
    }
    return { timesheets: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  },

  async getPendingLeaveRequests(params?: { page?: number; limit?: number }) {
    const response = await managerApi.getPendingLeaveRequests(params);
    if (response.success && response.data) {
      return {
        leaveRequests: response.data,
        pagination: response.pagination,
      };
    }
    return { leaveRequests: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  },

  async getPerformanceUpdates(params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await managerApi.getPerformanceUpdates(params);
    if (response.success && response.data) {
      return {
        updates: response.data.map(update => ({
          ...update,
          id: update._id || update.id,
          employeeId: typeof update.employeeId === 'object' ? update.employeeId._id : update.employeeId,
          employeeName: update.employeeName || (typeof update.employeeId === 'object' ? update.employeeId.name : ''),
        })),
        pagination: response.pagination,
      };
    }
    return { updates: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  },

  async createPerformanceUpdate(data: CreatePerformanceUpdateData): Promise<PerformanceUpdate> {
    const response = await managerApi.createPerformanceUpdate(data);
    if (response.success && response.data?.update) {
      return {
        ...response.data.update,
        id: response.data.update._id || response.data.update.id,
      };
    }
    throw new Error('Failed to create performance update');
  },

  async getPerformanceUpdate(id: string): Promise<PerformanceUpdate | null> {
    const response = await managerApi.getPerformanceUpdate(id);
    if (response.success && response.data?.update) {
      return {
        ...response.data.update,
        id: response.data.update._id || response.data.update.id,
      };
    }
    return null;
  },

  async updatePerformanceUpdate(id: string, data: UpdatePerformanceUpdateData): Promise<PerformanceUpdate> {
    const response = await managerApi.updatePerformanceUpdate(id, data);
    if (response.success && response.data?.update) {
      return {
        ...response.data.update,
        id: response.data.update._id || response.data.update.id,
      };
    }
    throw new Error('Failed to update performance update');
  },
};

