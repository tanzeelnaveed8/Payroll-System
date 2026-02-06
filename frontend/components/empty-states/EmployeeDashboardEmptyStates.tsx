"use client";

import EmptyState from "./EmptyState";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import Button from "@/components/ui/Button";

/**
 * Empty State: No Employee Dashboard Data
 * 
 * Displayed when employee dashboard data cannot be loaded or is unavailable.
 */
export function NoEmployeeDashboardDataEmptyState({ 
  onRefresh,
  onGoHome 
}: { 
  onRefresh?: () => void;
  onGoHome?: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
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
        message="We couldn't load your dashboard information at this time. This may be due to a temporary service issue. Please try refreshing or contact support if the problem continues."
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
                label: "Return to Dashboard",
                onClick: onGoHome,
              }
            : undefined
        }
        size="md"
      />
    </div>
  );
}

/**
 * Empty State: No Timesheet Entries
 * 
 * Displayed when there are no timesheet entries for the current week.
 * Note: This is used inside a CardContent, so it doesn't wrap itself in a Card.
 */
export function NoTimesheetEntriesEmptyState({ 
  onViewTimesheet 
}: { 
  onViewTimesheet?: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-8 h-8 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      title="No Timesheet Entries"
      message="You haven't logged any hours for this week yet. Start tracking your time to see your weekly summary here."
      action={
        onViewTimesheet
          ? {
              label: "View Full Timesheet",
              onClick: onViewTimesheet,
              variant: "outline",
            }
          : {
              label: "View Full Timesheet",
              onClick: () => window.location.href = '/employee/timesheet',
              variant: "outline",
            }
      }
      size="sm"
    />
  );
}

/**
 * Empty State: No Pay Stubs
 * 
 * Displayed when there are no pay stubs available.
 */
export function NoPayStubsEmptyState({ 
  onViewPaystubs 
}: { 
  onViewPaystubs?: () => void;
}) {
  return (
    <Card className="border-2 border-slate-300 bg-white shadow-sm">
      <CardContent className="py-8">
        <EmptyState
          icon={
            <svg
              className="w-8 h-8 text-slate-400"
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
          title="No Pay Stubs Available"
          message="Your pay stubs will appear here once they are processed. If you're expecting a pay stub, please contact your administrator or check back later."
          action={
            onViewPaystubs
              ? {
                  label: "View All Paystubs",
                  onClick: onViewPaystubs,
                  variant: "outline",
                }
              : {
                  label: "View All Paystubs",
                  onClick: () => window.location.href = '/employee/paystubs',
                  variant: "outline",
                }
          }
          size="sm"
        />
      </CardContent>
    </Card>
  );
}

/**
 * Empty State: No Leave Records
 * 
 * Displayed when there are no upcoming leave records.
 */
export function NoLeaveRecordsEmptyState({ 
  onRequestLeave 
}: { 
  onRequestLeave?: () => void;
}) {
  return (
    <Card className="border-2 border-slate-300 bg-white shadow-sm">
      <CardContent className="py-8">
        <EmptyState
          icon={
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          title="No Upcoming Leaves"
          message="You don't have any approved leave requests scheduled. Request time off to see your upcoming leaves here."
          action={
            onRequestLeave
              ? {
                  label: "Request Leave",
                  onClick: onRequestLeave,
                }
              : {
                  label: "Request Leave",
                  onClick: () => window.location.href = '/employee/leave',
                }
          }
          size="sm"
        />
      </CardContent>
    </Card>
  );
}

/**
 * Empty State: Employee Dashboard Unavailable
 * 
 * Displayed when the dashboard is completely unavailable (no data, no cached data).
 */
export function EmployeeDashboardUnavailableEmptyState({ 
  onRefresh,
  onGoHome 
}: { 
  onRefresh?: () => void;
  onGoHome?: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
                label: "Return to Dashboard",
                onClick: onGoHome,
              }
            : undefined
        }
        size="md"
      />
    </div>
  );
}
