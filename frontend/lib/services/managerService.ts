import { managerApi, type DashboardData, type TeamMember, type PerformanceUpdate, type CreatePerformanceUpdateData, type UpdatePerformanceUpdateData, type ManagerSettings, type UpdateManagerSettingsData, type Session } from '@/lib/api/manager';
import { 
  validateManagerDashboardData, 
  type ManagerDashboardData 
} from '../validators/managerDashboardSchema';

/**
 * Custom error class for validation failures
 */
export class ManagerDashboardValidationError extends Error {
  constructor(
    message: string,
    public readonly validationDetails?: unknown
  ) {
    super(message);
    this.name = 'ManagerDashboardValidationError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ManagerDashboardValidationError);
    }
  }
}

export const managerService = {
  /**
   * Get manager dashboard data with validation
   * 
   * This method:
   * 1. Fetches raw data from API
   * 2. Validates against ManagerDashboardSchema
   * 3. Returns validated, type-safe data
   * 
   * If validation fails:
   * - Logs detailed error information for observability
   * - Throws user-friendly error message
   * - Prevents invalid data from reaching components
   * 
   * @throws {ManagerDashboardValidationError} If API response doesn't match schema
   */
  async getDashboardData(): Promise<ManagerDashboardData> {
    try {
      // Fetch raw data from API (unknown type for safety)
      const response = await managerApi.getDashboard();
      
      // Extract data from API response wrapper
      let rawData: unknown;
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        rawData = (response as { success: boolean; data: unknown }).data;
      } else {
        rawData = response;
      }
      
      // Validate against schema - this is the critical safety check
      const validationResult = validateManagerDashboardData(rawData);
      
      if (!validationResult.success) {
        // Log validation error with full context for observability
        console.error('[Manager Service] Dashboard data validation failed:', {
          error: validationResult.error,
          details: validationResult.details,
          rawData: rawData,
          timestamp: new Date().toISOString(),
        });

        // Throw user-friendly error that will be caught by React Query
        throw new ManagerDashboardValidationError(
          validationResult.error,
          validationResult.details
        );
      }

      // At this point, data is guaranteed to match ManagerDashboardSchema
      return validationResult.data;
    } catch (error) {
      // Re-throw validation errors as-is
      if (error instanceof ManagerDashboardValidationError) {
        throw error;
      }

      // Log and re-throw other errors (network, etc.)
      console.error('[Manager Service] Error fetching manager dashboard data:', {
        error: error,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },

  /**
   * Legacy method for backward compatibility
   * @deprecated Use getDashboardData() instead
   */
  async getDashboard(): Promise<DashboardData> {
    const data = await this.getDashboardData();
    return {
      teamMembers: data.teamMembers,
      directReports: data.directReports,
      pendingApprovals: data.pendingApprovals,
      timesheetsSubmitted: data.timesheetsSubmitted,
      leaveRequestsPending: data.leaveRequestsPending,
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

  async getSettings(): Promise<ManagerSettings> {
    const response = await managerApi.getSettings();
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('Failed to load settings');
  },

  async updateSettings(data: UpdateManagerSettingsData): Promise<ManagerSettings> {
    const response = await managerApi.updateSettings(data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('Failed to update settings');
  },

  async getSessions(): Promise<Session[]> {
    const response = await managerApi.getSessions();
    if (response.success && response.data?.sessions) {
      return response.data.sessions;
    }
    return [];
  },
};

