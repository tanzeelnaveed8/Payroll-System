import { adminApi } from '../api/admin';
import { 
  validateAdminDashboardData, 
  type AdminDashboardData 
} from '../validators/adminDashboardSchema';

/**
 * Custom error class for validation failures
 */
export class DashboardValidationError extends Error {
  constructor(
    message: string,
    public readonly validationDetails?: unknown
  ) {
    super(message);
    this.name = 'DashboardValidationError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DashboardValidationError);
    }
  }
}

/**
 * Map _id to id for consistency
 * This is applied AFTER validation to ensure data structure is correct
 */
const mapId = <T extends { _id?: string; id?: string }>(item: T): T & { id: string } => {
  if (item._id && !item.id) {
    return { ...item, id: item._id };
  }
  return item as T & { id: string };
};

export const adminService = {
  /**
   * Get admin dashboard data with validation
   * 
   * This method:
   * 1. Fetches raw data from API
   * 2. Validates against AdminDashboardSchema
   * 3. Maps _id to id for consistency
   * 4. Returns validated, type-safe data
   * 
   * If validation fails:
   * - Logs detailed error information for observability
   * - Throws user-friendly error message
   * - Prevents invalid data from reaching components
   * 
   * @throws {DashboardValidationError} If API response doesn't match schema
   */
  async getDashboardData(): Promise<AdminDashboardData> {
    try {
      // Fetch raw data from API (unknown type for safety)
      const rawData = await adminApi.getDashboard();
      
      // Validate against schema - this is the critical safety check
      const validationResult = validateAdminDashboardData(rawData);
      
      if (!validationResult.success) {
        // Log validation error with full context for observability
        console.error('[Admin Service] Dashboard data validation failed:', {
          error: validationResult.error,
          details: validationResult.details,
          rawData: rawData,
          timestamp: new Date().toISOString(),
        });

        // Throw user-friendly error that will be caught by React Query
        throw new DashboardValidationError(
          validationResult.error,
          validationResult.details
        );
      }

      // At this point, data is guaranteed to match AdminDashboardSchema
      const validatedData = validationResult.data;
      
      // Map IDs in recent payroll activity (after validation)
      const recentPayrollActivity = validatedData.recentPayrollActivity.map(mapId);
      
      // Map IDs in department breakdown (after validation)
      const departmentBreakdown = {
        ...validatedData.departmentBreakdown,
        departments: validatedData.departmentBreakdown.departments.map(mapId)
      };

      // Return validated and transformed data
      return {
        ...validatedData,
        recentPayrollActivity,
        departmentBreakdown
      };
    } catch (error) {
      // Re-throw validation errors as-is
      if (error instanceof DashboardValidationError) {
        throw error;
      }

      // Log and re-throw other errors (network, etc.)
      console.error('[Admin Service] Error fetching admin dashboard data:', {
        error: error,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },

  /**
   * Format currency in PKR
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('PKR', 'Rs');
  },

  /**
   * Format large currency (in millions) in PKR
   */
  formatLargeCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `Rs ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `Rs ${(amount / 1000).toFixed(1)}K`;
    }
    return this.formatCurrency(amount);
  },

  /**
   * Format date
   */
  formatDate(date: string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
};

