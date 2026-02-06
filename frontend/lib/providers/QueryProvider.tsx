"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, ReactNode } from "react";

/**
 * QueryClientProvider wrapper for React Query
 * 
 * Design decisions:
 * - Create QueryClient inside component to avoid sharing state between requests in SSR
 * - Default staleTime: 2 minutes - Dashboard data is considered fresh for 2 minutes
 * - Default cacheTime: 5 minutes - Keep unused data in cache for 5 minutes
 * - RefetchOnWindowFocus: false - Prevent refetch on tab focus unless data is stale
 * - Retry: 3 - Retry failed requests 3 times with exponential backoff
 * - RefetchOnReconnect: true - Refetch when network reconnects
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 2 minutes
            staleTime: 2 * 60 * 1000, // 2 minutes
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            // Don't refetch on window focus unless data is stale
            refetchOnWindowFocus: false,
            // Retry failed requests 3 times
            retry: 3,
            // Retry with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch when network reconnects
            refetchOnReconnect: true,
            // Don't refetch on mount if data exists and is fresh
            refetchOnMount: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
