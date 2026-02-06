import { deptLeadApi, type TeamMember } from '@/lib/api/deptLead';
import {
  validateDeptLeadDashboardData,
  type DeptLeadDashboardData,
  DeptLeadDashboardValidationError,
} from '@/lib/validators/deptLeadDashboardSchema';

const mapId = (obj: unknown): unknown => {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(mapId);
  }
  if (typeof obj === 'object' && obj !== null) {
    const mapped = { ...obj } as Record<string, unknown>;
    if (mapped._id && !mapped.id) {
      mapped.id = mapped._id;
    }
    return mapped;
  }
  return obj;
};

export const deptLeadService = {
  /**
   * Get department lead dashboard data with validation
   * 
   * This method:
   * 1. Fetches raw data from API
   * 2. Validates against DeptLeadDashboardSchema
   * 3. Returns validated, type-safe data
   * 
   * If validation fails:
   * - Logs detailed error information for observability
   * - Throws user-friendly error message
   * - Prevents invalid data from reaching components
   * 
   * @throws {DeptLeadDashboardValidationError} If API response doesn't match schema
   */
  async getDashboard(): Promise<DeptLeadDashboardData> {
    try {
      // Fetch raw data from API (unknown type for safety)
      const response = await deptLeadApi.getDashboard();
      
      // Extract data from API response wrapper
      let rawData: unknown;
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        rawData = (response as { success: boolean; data: unknown }).data;
      } else {
        rawData = response;
      }
      
      // Validate against schema - this is the critical safety check
      const validationResult = validateDeptLeadDashboardData(rawData);
      
      if (!validationResult.success) {
        // Log validation error with full context for observability
        console.error('[Department Lead Service] Dashboard data validation failed:', {
          feature: 'DeptLeadDashboard',
          errorType: 'validation_error',
          error: validationResult.error,
          details: validationResult.details,
          rawData: rawData,
          timestamp: new Date().toISOString(),
          service: 'deptLeadService',
          method: 'getDashboard',
          pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
        });

        // Throw user-friendly error that will be caught by React Query
        throw new DeptLeadDashboardValidationError(
          validationResult.error,
          validationResult.details
        );
      }

      // At this point, data is guaranteed to match DeptLeadDashboardSchema
      return validationResult.data;
    } catch (error) {
      // Re-throw validation errors as-is
      if (error instanceof DeptLeadDashboardValidationError) {
        throw error;
      }

      // Log and re-throw other errors (network, etc.)
      if (error instanceof Error) {
        console.error('[Department Lead Service] Failed to fetch dashboard data:', {
          feature: 'DeptLeadDashboard',
          errorType: 'api_error',
          error: error.message,
          name: error.name,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          service: 'deptLeadService',
          method: 'getDashboard',
          pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
        });
        throw error;
      }

      // Handle unexpected error types
      throw new Error('An unexpected error occurred while fetching dashboard data');
    }
  },

  async getTeam(): Promise<TeamMember[]> {
    const response = await deptLeadApi.getTeam();
    if (response.success && response.data?.team) {
      return response.data.team.map(mapId) as TeamMember[];
    }
    return [];
  },
};

export { DeptLeadDashboardValidationError };
export type { DeptLeadDashboardData, TeamMember };
