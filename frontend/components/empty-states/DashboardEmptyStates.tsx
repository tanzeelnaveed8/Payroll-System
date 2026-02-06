"use client";

import EmptyState from "./EmptyState";

/**
 * Empty State: No KPI Data
 * 
 * Displayed when dashboard KPIs cannot be loaded or are unavailable.
 */
export function NoKPIDataEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-10 h-10 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      }
      title="No Dashboard Metrics Available"
      message="We couldn't load your dashboard metrics at this time. This may be due to a temporary service issue or insufficient data in the system."
      action={
        onRefresh
          ? {
              label: "Refresh Dashboard",
              onClick: onRefresh,
            }
          : undefined
      }
      size="md"
    />
  );
}

/**
 * Empty State: No Recent Payroll Activity
 * 
 * Displayed when there's no recent payroll activity to show.
 */
export function NoPayrollActivityEmptyState({ onViewAll }: { onViewAll?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-10 h-10 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      title="No Recent Payroll Activity"
      message="There are no recent payroll periods to display. Payroll activity will appear here once payroll periods are created and processed."
      action={
        onViewAll
          ? {
              label: "View All Payroll",
              onClick: onViewAll,
              variant: "outline",
            }
          : undefined
      }
      size="sm"
    />
  );
}

/**
 * Empty State: No Department Breakdown
 * 
 * Displayed when there are no departments or department data is unavailable.
 */
export function NoDepartmentBreakdownEmptyState({
  onManageDepartments,
}: {
  onManageDepartments?: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-10 h-10 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      }
      title="No Department Data Available"
      message="Department breakdown information is not available. This may occur if no departments have been created or if there are no employees assigned to departments."
      action={
        onManageDepartments
          ? {
              label: "Manage Departments",
              onClick: onManageDepartments,
              variant: "outline",
            }
          : undefined
      }
      size="sm"
    />
  );
}

/**
 * Empty State: Dashboard Data Unavailable
 * 
 * Displayed when the entire dashboard cannot be loaded.
 */
export function DashboardUnavailableEmptyState({
  onRefresh,
  onGoHome,
}: {
  onRefresh?: () => void;
  onGoHome?: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      }
      title="Dashboard Unavailable"
      message="We're unable to load your dashboard at this time. Please try refreshing the page or contact support if the problem persists."
      action={
        onRefresh
          ? {
              label: "Refresh Dashboard",
              onClick: onRefresh,
            }
          : undefined
      }
      secondaryAction={
        onGoHome
          ? {
              label: "Go to Home",
              onClick: onGoHome,
            }
          : undefined
      }
      size="lg"
      showCard={true}
    />
  );
}
