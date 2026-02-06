import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { employeeService, EmployeeDashboardValidationError } from "@/lib/services/employeeService";
import type { EmployeeDashboardData } from "@/lib/validators/employeeDashboardSchema";
import { useAuth } from "@/lib/contexts/AuthContext";

/**
 * Query key for employee dashboard data
 * Using array format for better cache invalidation and organization
 */
export const EMPLOYEE_DASHBOARD_QUERY_KEY = ["employee", "dashboard"] as const;

/**
 * Custom hook for fetching employee dashboard data with React Query
 * 
 * Features:
 * - Automatic refetching every 5 minutes
 * - Request deduplication (multiple components can use this hook without duplicate requests)
 * - Background refetching (refetches in background when data becomes stale)
 * - Stale-while-revalidate (shows cached data while fetching fresh data)
 * - Refetch on window focus (if data is stale)
 * 
 * Query Configuration:
 * - staleTime: 2 minutes - Data is considered fresh for 2 minutes
 * - refetchInterval: 5 minutes - Automatically refetch every 5 minutes
 * - refetchIntervalInBackground: true - Continue refetching even when tab is in background
 * - refetchOnWindowFocus: true - Refetch on tab focus if data is stale
 * - refetchOnMount: true - Refetch when component mounts (if data is stale)
 * 
 * @returns Query result with data, loading, error, and refetch function
 */
export function useEmployeeDashboardQuery(): UseQueryResult<EmployeeDashboardData, Error> & {
  /**
   * Manual refresh function
   * Forces an immediate refetch of the dashboard data
   */
  refresh: () => void;
  /**
   * Whether the query is currently refreshing in the background
   */
  isRefreshing: boolean;
  /**
   * Timestamp of when the data was last updated
   */
  dataUpdatedAt: number | undefined;
} {
  const { user } = useAuth();
  
  const query = useQuery({
    queryKey: EMPLOYEE_DASHBOARD_QUERY_KEY,
    queryFn: async () => {
      // Fetch dashboard data using the employee service
      // The service layer handles validation and will throw EmployeeDashboardValidationError
      // if the API response doesn't match the expected schema
      try {
        return await employeeService.getDashboard();
      } catch (error) {
        // Enhanced error logging with user context for observability
        if (error instanceof Error) {
          const isValidationError = error instanceof EmployeeDashboardValidationError;
          console.error(`[useEmployeeDashboardQuery] ${isValidationError ? 'Validation' : 'Failed to fetch'} dashboard data:`, {
            error: error.message,
            name: error.name,
            stack: error.stack,
            userId: user?.id,
            userEmail: user?.email,
            userRole: user?.role,
            timestamp: new Date().toISOString(),
            queryKey: EMPLOYEE_DASHBOARD_QUERY_KEY,
            ...(isValidationError && { validationDetails: (error as EmployeeDashboardValidationError).validationDetails }),
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
    
    // Refetch on window focus if data is stale
    // This ensures fresh data when user returns to the tab
    refetchOnWindowFocus: true,
    
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
     * Forces an immediate refetch by calling refetch
     */
    refresh: () => {
      query.refetch();
    },
    /**
     * Whether the query is currently refreshing
     * This is true when a background refetch is in progress
     */
    isRefreshing: query.isFetching && !query.isLoading,
    /**
     * Timestamp of when the data was last updated
     */
    dataUpdatedAt: query.dataUpdatedAt,
  };
}
