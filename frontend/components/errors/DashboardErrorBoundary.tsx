"use client";

import React from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ErrorFallback from "./ErrorFallback";
import { useRouter } from "next/navigation";

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Dashboard-Specific Error Boundary
 * 
 * Wraps dashboard pages with error handling specific to dashboard context.
 * Provides appropriate error messaging and recovery options for dashboard failures.
 * 
 * Features:
 * - Catches React component errors
 * - Provides dashboard-specific error messaging
 * - Offers retry and navigation options
 * - Logs errors for monitoring with structured logging (userId, userEmail, timestamp, feature name)
 * - Works for admin, manager, employee, and department lead dashboards
 */
export default function DashboardErrorBoundary({
  children,
}: DashboardErrorBoundaryProps) {
  const router = useRouter();

  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => {
        // Determine dashboard type from current path
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        const isManagerDashboard = pathname.includes('/manager');
        const isEmployeeDashboard = pathname.includes('/employee');
        const isAdminDashboard = pathname.includes('/admin');
        const isDeptLeadDashboard = pathname.includes('/department_lead') || pathname.includes('/dept_lead');
        
        let dashboardPath = '/employee';
        let dashboardName = 'Employee';
        
        if (isManagerDashboard) {
          dashboardPath = '/manager';
          dashboardName = 'Manager';
        } else if (isAdminDashboard) {
          dashboardPath = '/admin';
          dashboardName = 'Admin';
        } else if (isDeptLeadDashboard) {
          dashboardPath = '/department_lead';
          dashboardName = 'Department Lead';
        }

        // Enhanced error logging with user context for observability
        // Try to get user info from localStorage or context if available
        let userId: string | undefined;
        let userEmail: string | undefined;
        try {
          const authData = typeof window !== 'undefined' ? localStorage.getItem('auth') : null;
          if (authData) {
            const parsed = JSON.parse(authData);
            userId = parsed.user?.id || parsed.user?._id;
            userEmail = parsed.user?.email;
          }
        } catch {
          // Ignore errors accessing localStorage
        }

        // Log error for observability with structured logging
        console.error(`[${dashboardName} Dashboard Error Boundary] Component error caught:`, {
          feature: `${dashboardName}Dashboard`,
          error: error.message,
          name: error.name,
          stack: error.stack,
          pathname: pathname,
          userId: userId,
          userEmail: userEmail,
          timestamp: new Date().toISOString(),
          errorType: 'render_error',
        });

        return (
          <div className="flex items-center justify-center min-h-screen p-4">
            <ErrorFallback
              error={error}
              resetErrorBoundary={resetErrorBoundary}
              title={`${dashboardName} Dashboard Error`}
              message="An error occurred while rendering the dashboard. This may be due to a data loading issue or a component error. Please try refreshing or contact support if the problem continues."
              actionLabel="Reload Dashboard"
              onSecondaryAction={() => router.push(dashboardPath)}
              secondaryActionLabel="Return to Dashboard"
            />
          </div>
        );
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
