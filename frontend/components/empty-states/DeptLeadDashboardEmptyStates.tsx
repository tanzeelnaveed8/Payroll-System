"use client";

import EmptyState from "./EmptyState";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import Button from "@/components/ui/Button";

/**
 * Empty State: No Department Lead Dashboard Data
 * 
 * Displayed when department lead dashboard data cannot be loaded or is unavailable.
 */
export function NoDeptLeadDashboardDataEmptyState({ 
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
        message="We couldn't load your department dashboard information at this time. This may be due to a temporary service issue. Please try refreshing or contact support if the problem continues."
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
 * Empty State: No Team Members
 * 
 * Displayed when the department lead has no team members in their department.
 */
export function NoTeamMembersEmptyState({ 
  onViewTeam,
  onInviteTeam 
}: { 
  onViewTeam?: () => void;
  onInviteTeam?: () => void;
}) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
          title="No Team Members"
          message="You don't have any team members in your department yet. Once employees are assigned to your department, they will appear here and you'll be able to manage their tasks and track performance."
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
            onInviteTeam
              ? {
                  label: "Contact Admin",
                  onClick: onInviteTeam,
                }
              : undefined
          }
          size="sm"
        />
      </CardContent>
    </Card>
  );
}

/**
 * Empty State: No Tasks
 * 
 * Displayed when there are no tasks assigned to the department.
 * Note: This is used inside a CardContent, so it doesn't wrap itself in a Card.
 */
export function NoTasksEmptyState({ 
  onCreateTask,
  onViewAllTasks 
}: { 
  onCreateTask?: () => void;
  onViewAllTasks?: () => void;
}) {
  return (
    <div className="text-center py-16 text-[#64748B]" role="status" aria-live="polite">
      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center" aria-hidden="true">
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <p className="text-base font-semibold mb-2 text-[#0F172A]">No tasks found</p>
      <p className="text-sm mb-6">Tasks assigned to your department will appear here. Start by creating a new task or wait for tasks to be assigned from managers.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onCreateTask && (
          <Button
            variant="gradient"
            onClick={onCreateTask}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
            aria-label="Create a new task"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </Button>
        )}
        {onViewAllTasks && (
          <Button
            variant="outline"
            onClick={onViewAllTasks}
            className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50"
            aria-label="View all tasks"
          >
            View All Tasks
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Empty State: Department Lead Dashboard Unavailable
 * 
 * Displayed when the dashboard is completely unavailable (no data, no cached data).
 */
export function DeptLeadDashboardUnavailableEmptyState({ 
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
        message="We're unable to load your department dashboard at this time. Please try refreshing the page or contact support if the problem persists."
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
