import { apiClient } from './client';
import type { AdminDashboardData } from '@/lib/validators/adminDashboardSchema';

/**
 * Re-export AdminDashboardData type from schema
 * This ensures single source of truth - types are derived from validation schema
 */
export type { AdminDashboardData };

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const adminApi = {
  /**
   * Get admin dashboard data
   * 
   * Note: This method does NOT validate the response.
   * Validation should be done in the service layer using validateAdminDashboardData.
   * This separation allows for better error handling and logging.
   * 
   * Returns raw, unvalidated data from the API for validation in the service layer.
   */
  async getDashboard(): Promise<unknown> {
    try {
      const response = await apiClient.get<ApiResponse<unknown>>('/admin/dashboard');
      // Extract data from API response wrapper
      // The API may return { success, message, data } or just the data directly
      if (response && typeof response === 'object' && 'data' in response) {
        return (response as ApiResponse<unknown>).data;
      }
      // If response is the data directly, return it
      return response;
    } catch (error) {
      // Log API errors for observability
      console.error('[Admin API] Failed to fetch dashboard data:', {
        error: error,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
};

