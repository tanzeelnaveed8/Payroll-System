import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { adminService } from "@/lib/services/adminService";
import type { AdminDashboardData } from "@/lib/api/admin";

/**
 * Query key for admin dashboard data
 * Using array format for better cache invalidation and organization
 */
export const ADMIN_DASHBOARD_QUERY_KEY = ["admin", "dashboard"] as const;

/**
 * Custom hook for fetching admin dashboard data with React Query
 * 
 * Features:
 * - Automatic refetching every 5 minutes
 * - Request deduplication (multiple components can use this hook without duplicate requests)
 * - Background refetching (refetches in background when data becomes stale)
 * - Stale-while-revalidate (shows cached data while fetching fresh data)
 * - Prevents unnecessary refetch on tab focus unless data is stale
 * 
 * Query Configuration:
 * - staleTime: 2 minutes - Data is considered fresh for 2 minutes
 * - refetchInterval: 5 minutes - Automatically refetch every 5 minutes
 * - refetchIntervalInBackground: true - Continue refetching even when tab is in background
 * - refetchOnWindowFocus: false - Don't refetch on tab focus (only if stale)
 * - refetchOnMount: true - Refetch when component mounts (if data is stale)
 * 
 * @returns Query result with data, loading, error, and refetch function
 */
export function useAdminDashboardQuery(): UseQueryResult<AdminDashboardData, Error> & {
  /**
   * Manual refresh function
   * Forces an immediate refetch of the dashboard data
   */
  refresh: () => void;
  /**
   * Whether the query is currently refreshing in the background
   */
  isRefreshing: boolean;
} {
  const query = useQuery({
    queryKey: ADMIN_DASHBOARD_QUERY_KEY,
    queryFn: async () => {
      // Fetch dashboard data using the admin service
      // The service layer handles validation and will throw DashboardValidationError
      // if the API response doesn't match the expected schema
      try {
        return await adminService.getDashboardData();
      } catch (error) {
        // Log error for observability
        if (error instanceof Error) {
          console.error('[useAdminDashboardQuery] Failed to fetch dashboard data:', {
            error: error.message,
            name: error.name,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          });
        }
        // Re-throw to let React Query handle it
        throw error;
      }
    },
    // Data is considered fresh for 2 minutes
    // During this time, no refetch will occur unless manually triggered
    staleTime: 2 * 60 * 1000, // 2 minutes
    
    // Automatically refetch every 5 minutes to keep data up-to-date
    // This ensures the dashboard shows recent information without manual refresh
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    
    // Continue refetching even when tab is in background
    // This ensures data is fresh when user returns to the tab
    refetchIntervalInBackground: true,
    
    // Don't refetch on window focus unless data is stale
    // This prevents unnecessary network requests when switching tabs
    refetchOnWindowFocus: false,
    
    // Refetch when component mounts if data is stale
    // This ensures fresh data when navigating to the dashboard
    refetchOnMount: true,
    
    // Keep data in cache for 5 minutes after component unmounts
    // This allows instant display when navigating back
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    
    // Retry failed requests 3 times with exponential backoff
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch when network reconnects
    refetchOnReconnect: true,
  });

  return {
    ...query,
    /**
     * Manual refresh function
     * Forces an immediate refetch by invalidating the query
     */
    refresh: () => {
      query.refetch();
    },
    /**
     * Whether the query is currently refreshing
     * This is true when a background refetch is in progress
     */
    isRefreshing: query.isFetching && !query.isLoading,
  };
}
