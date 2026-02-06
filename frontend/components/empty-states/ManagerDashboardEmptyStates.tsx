"use client";

import EmptyState from "./EmptyState";
import { Card, CardContent } from "@/components/ui/Card";

/**
 * Empty State: No Manager Dashboard Data
 * 
 * Displayed when manager dashboard data cannot be loaded or is unavailable.
 */
export function NoManagerDashboardDataEmptyState({ onRefresh }: { onRefresh?: () => void }) {
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
      title="No Dashboard Data Available"
      message="We couldn't load your dashboard metrics at this time. This may be due to a temporary service issue or you may not have any team members assigned yet."
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
 * Empty State: No Team Members
 * 
 * Displayed when the manager has no team members assigned.
 */
export function NoTeamMembersEmptyState({ 
  onViewTeam,
  onAddEmployee 
}: { 
  onViewTeam?: () => void;
  onAddEmployee?: () => void;
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      }
      title="No Team Members"
      message="You don't have any team members assigned yet. Once employees are assigned to your team, they will appear here and you'll be able to manage their performance and approvals."
      action={
        onViewTeam
          ? {
              label: "View Team Page",
              onClick: onViewTeam,
              variant: "outline",
            }
          : undefined
      }
      secondaryAction={
        onAddEmployee
          ? {
              label: "Add Employee",
              onClick: onAddEmployee,
            }
          : undefined
      }
      size="md"
    />
  );
}

/**
 * Empty State: No Pending Approvals
 * 
 * Displayed when there are no pending approvals to show.
 */
export function NoPendingApprovalsEmptyState({ 
  onViewApprovals 
}: { 
  onViewApprovals?: () => void;
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      title="No Pending Approvals"
      message="Great news! You don't have any pending approvals at the moment. All timesheets and leave requests have been processed."
      action={
        onViewApprovals
          ? {
              label: "View Approvals Page",
              onClick: onViewApprovals,
              variant: "outline",
            }
          : undefined
      }
      size="sm"
    />
  );
}

/**
 * Empty State: No Performance Updates
 * 
 * Displayed when there are no performance updates to show.
 */
export function NoPerformanceUpdatesEmptyState({ 
  onAddUpdate 
}: { 
  onAddUpdate?: () => void;
}) {
  return (
    <div className="text-center py-12 text-[#64748B]">
      <div className="mb-4">
        <svg
          className="w-12 h-12 mx-auto text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold text-[#0F172A] mb-2">No performance updates found</p>
      <p className="text-xs text-[#64748B] mb-4">
        Add your first update to track team performance and provide feedback to your team members.
      </p>
      {onAddUpdate && (
        <button
          onClick={onAddUpdate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors"
          aria-label="Add performance update"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Update
        </button>
      )}
    </div>
  );
}

/**
 * Empty State: Manager Dashboard Unavailable
 * 
 * Displayed when the entire manager dashboard cannot be loaded.
 */
export function ManagerDashboardUnavailableEmptyState({
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
      message="We're unable to load your manager dashboard at this time. Please try refreshing the page or contact support if the problem persists."
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
