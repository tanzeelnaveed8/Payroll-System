"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, ClipboardList, Hourglass, CheckCircle2, Zap, AlertTriangle, RefreshCw, Plus, FileBarChart, FileText, Clock, BarChart3, User, Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { taskService, type Task } from "@/lib/services/taskService";
import { useDeptLeadDashboardQuery } from "@/lib/hooks/useDeptLeadDashboardQuery";
import { DeptLeadDashboardValidationError } from "@/lib/services/deptLeadService";
import { toast } from "@/lib/hooks/useToast";
import DashboardErrorBoundary from "@/components/errors/DashboardErrorBoundary";
import ErrorFallback from "@/components/errors/ErrorFallback";
import { useAnnouncement } from "@/lib/hooks/useAnnouncement";
import DeptLeadDashboardSkeleton from "@/components/skeletons/DeptLeadDashboardSkeleton";
import {
  NoDeptLeadDashboardDataEmptyState,
  NoTeamMembersEmptyState,
  NoTasksEmptyState,
  DeptLeadDashboardUnavailableEmptyState,
} from "@/components/empty-states/DeptLeadDashboardEmptyStates";

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
function formatLastUpdated(timestamp: number | undefined): string {
  if (!timestamp) return 'Never';
  
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function DepartmentLeadDashboardPage() {
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const announce = useAnnouncement();

  // Use React Query hook for dashboard data fetching with automatic caching and refetching
  const {
    data: dashboardData,
    isLoading,
    isRefreshing,
    error,
    refresh,
    dataUpdatedAt,
  } = useDeptLeadDashboardQuery();

  const firstName = useMemo(() => user?.name?.split(" ")[0] || "Department Lead", [user?.name]);

  // Memoized handlers for performance optimization
  const handleRefresh = useCallback(() => {
    announce("Refreshing dashboard data");
    refresh();
  }, [refresh, announce]);

  const handleRefreshKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isRefreshing) {
        announce("Refreshing dashboard data");
        refresh();
      }
    }
  }, [isRefreshing, refresh, announce]);

  const handleGoToTasks = useCallback(() => {
    router.push('/department_lead/tasks');
  }, [router]);

  const handleGoToTeam = useCallback(() => {
    router.push('/department_lead/team');
  }, [router]);

  const handleGoToTimesheets = useCallback(() => {
    router.push('/department_lead/timesheets');
  }, [router]);

  const handleGoToReports = useCallback(() => {
    router.push('/department_lead/reports');
  }, [router]);

  const handleCreateTask = useCallback(() => {
    router.push('/department_lead/tasks/new');
  }, [router]);

  const handleViewAllTasks = useCallback(() => {
    router.push('/department_lead/tasks');
  }, [router]);

  const handleRetry = useCallback(() => {
    announce("Retrying dashboard load");
    refresh();
  }, [refresh, announce]);

  const handleGoHome = useCallback(() => {
    router.push('/department_lead');
  }, [router]);

  // Announce data refresh to screen readers
  useEffect(() => {
    if (isRefreshing) {
      announce("Refreshing dashboard data");
    }
  }, [isRefreshing, announce]);

  // Announce successful data load
  useEffect(() => {
    if (dashboardData && !isLoading && !isRefreshing) {
      announce("Dashboard data loaded successfully");
    }
  }, [dashboardData, isLoading, isRefreshing, announce]);

  // Fetch recent tasks on mount and when dashboard data loads
  useEffect(() => {
    const loadRecentTasks = async () => {
      try {
        const tasksResult = await taskService.getTasks({}, { field: "assignedDate", direction: "desc" }, 1, 10);
        const tasks = Array.isArray(tasksResult?.data) ? tasksResult.data : [];
        setRecentTasks(tasks.slice(0, 5));
      } catch (taskError: unknown) {
        // Log task loading error with full context
        const errorMessage = taskError instanceof Error ? taskError.message : 'Unknown error';
        const errorName = taskError instanceof Error ? taskError.name : 'UnknownError';
        console.error('[Department Lead Dashboard] Failed to load recent tasks:', {
          feature: 'DeptLeadDashboard',
          errorType: 'api_error',
          error: errorMessage,
          name: errorName,
          stack: taskError instanceof Error ? taskError.stack : undefined,
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
          timestamp: new Date().toISOString(),
          pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
          component: 'DepartmentLeadDashboardPage',
          method: 'loadRecentTasks',
        });
        // Use empty array as fallback
        setRecentTasks([]);
      }
    };

    // Only load tasks if dashboard data is available (to avoid unnecessary calls)
    if (dashboardData) {
      loadRecentTasks();
    }
  }, [dashboardData, user?.id, user?.email, user?.role]);

  // Role-based redirect
  useEffect(() => {
    if (!authLoading && user) {
      const userRole = user.role?.toLowerCase().trim();
      if (userRole !== 'dept_lead' && userRole !== 'department_lead') {
        if (userRole === 'employee') {
          router.push('/employee');
        } else if (userRole === 'admin' || userRole === 'manager') {
          router.push('/admin');
        }
      }
    }
  }, [user, authLoading, router]);

  // Show error toast if there's an error with enhanced logging and screen reader announcement
  useEffect(() => {
    if (error) {
      const isValidationError = error instanceof DeptLeadDashboardValidationError || 
        (error instanceof Error && error.message.includes('Invalid dashboard data'));
      
      // Enhanced error logging with user context
      console.error('[Department Lead Dashboard] Error occurred:', {
        feature: 'DeptLeadDashboard',
        errorType: isValidationError ? 'validation_error' : 'api_error',
        error: error.message,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined,
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
        isValidationError,
        timestamp: new Date().toISOString(),
        pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
        ...(isValidationError && error instanceof DeptLeadDashboardValidationError && {
          validationDetails: error.validationDetails,
        }),
      });
      
      const errorMessage = isValidationError
        ? "The dashboard data received from the server doesn't match the expected format. Please refresh or contact support if this problem persists."
        : error.message || 'Failed to load dashboard';
      
      // Announce error to screen readers
      announce(`Error: ${errorMessage}`, "assertive");
      
      toast.error(errorMessage);
    }
  }, [error, user?.id, user?.email, user?.role, announce]);

  // Memoize KPIs to prevent unnecessary recalculations
  const kpis = useMemo(() => {
    if (!dashboardData) return [];
    
    return [
      {
        label: "Department Employees",
        value: dashboardData.departmentEmployees.toString(),
        sublabel: "Active in department",
        icon: "users",
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-50",
        textColor: "text-blue-600",
      },
      {
        label: "Active Tasks",
        value: dashboardData.activeTasks.toString(),
        sublabel: "Total assigned",
        icon: "clipboard-list",
        color: "from-purple-500 to-purple-600",
        bgColor: "bg-purple-50",
        textColor: "text-purple-600",
      },
      {
        label: "Pending Tasks",
        value: dashboardData.pendingTasks.toString(),
        sublabel: "Requires action",
        icon: "hourglass",
        color: "from-amber-500 to-amber-600",
        bgColor: "bg-amber-50",
        textColor: "text-amber-600",
      },
      {
        label: "Completed Tasks",
        value: dashboardData.completedTasks.toString(),
        sublabel: "This period",
        icon: "check-circle",
        color: "from-green-500 to-green-600",
        bgColor: "bg-green-50",
        textColor: "text-green-600",
      },
      {
        label: "In Progress",
        value: dashboardData.inProgressTasks.toString(),
        sublabel: "Currently working",
        icon: "zap",
        color: "from-indigo-500 to-indigo-600",
        bgColor: "bg-indigo-50",
        textColor: "text-indigo-600",
      },
      {
        label: "Overdue Tasks",
        value: dashboardData.overdueTasks.toString(),
        sublabel: "Needs attention",
        icon: "alert-triangle",
        color: "from-red-500 to-red-600",
        bgColor: "bg-red-50",
        textColor: "text-red-600",
      },
    ];
  }, [dashboardData]);

  const kpiIconMap: Record<string, React.ReactNode> = {
    "users": <Users className="w-6 h-6 text-white" />,
    "clipboard-list": <ClipboardList className="w-6 h-6 text-white" />,
    "hourglass": <Hourglass className="w-6 h-6 text-white" />,
    "check-circle": <CheckCircle2 className="w-6 h-6 text-white" />,
    "zap": <Zap className="w-6 h-6 text-white" />,
    "alert-triangle": <AlertTriangle className="w-6 h-6 text-white" />,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20";
      case "in-progress":
        return "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20";
      case "pending":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
      default:
        return "bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20";
      case "medium":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
      case "low":
        return "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20";
      default:
        return "bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20";
    }
  };

  // Always render something, even if there's no data
  if (!user && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-[#64748B] mb-4">Please log in to view your dashboard</p>
        </div>
      </div>
    );
  }

  // Loading state with layout-aware skeleton loader
  if (isLoading && !dashboardData) {
    return (
      <DashboardErrorBoundary>
        <DeptLeadDashboardSkeleton />
      </DashboardErrorBoundary>
    );
  }

  // Error state (only show if no cached data)
  if (error && !dashboardData) {
    const isValidationError = error instanceof DeptLeadDashboardValidationError || 
      (error instanceof Error && error.message.includes('Invalid dashboard data'));
    
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4" role="alert" aria-live="assertive">
        <ErrorFallback
          error={error instanceof Error ? error : new Error(String(error))}
          resetErrorBoundary={handleRetry}
          title={isValidationError ? "Data Validation Error" : "Failed to Load Dashboard"}
          message={
            isValidationError
              ? "The dashboard data received from the server doesn't match the expected format. This may indicate a backend issue. Please contact support if this problem persists."
              : error.message || "We encountered an issue while loading your dashboard data. This may be due to a network issue or a temporary service problem."
          }
          actionLabel="Retry"
          onSecondaryAction={handleGoHome}
          secondaryActionLabel="Return to Dashboard"
        />
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <DashboardErrorBoundary>
        <DeptLeadDashboardUnavailableEmptyState
          onRefresh={handleRefresh}
          onGoHome={handleGoHome}
        />
      </DashboardErrorBoundary>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8" role="main" aria-label="Department Lead dashboard">
      {/* Screen reader only live region for status updates */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isRefreshing && "Refreshing dashboard data"}
        {!isRefreshing && dashboardData && "Dashboard data loaded"}
      </div>
      {/* Header Section */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] mb-2" id="dashboard-title">
            Welcome back, {firstName}! <span aria-hidden="true">👋</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-[#64748B]">
            Manage your department team, tasks, and track performance metrics
          </p>
          {/* Last updated timestamp */}
          {dataUpdatedAt && (
            <p className="text-xs text-[#64748B] mt-1" aria-live="polite" aria-atomic="true">
              <span className="sr-only">Dashboard last updated</span>
              Last updated: {formatLastUpdated(dataUpdatedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Manual Refresh Button */}
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="default"
            className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#2563EB] font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
            aria-label={isRefreshing ? "Refreshing dashboard data, please wait" : "Refresh dashboard data"}
            aria-busy={isRefreshing}
            onKeyDown={handleRefreshKeyDown}
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
          <Link href="/department_lead/tasks">
            <Button 
              variant="gradient" 
              size="default"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Assign a new task to team members"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-semibold">Assign Task</span>
            </Button>
          </Link>
          <Link href="/department_lead/reports">
            <Button 
              variant="outline" 
              size="default"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#2563EB] font-semibold focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
              aria-label="View department reports and analytics"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>View Reports</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" role="region" aria-label="Dashboard key performance indicators">
        {kpis.map((kpi, idx) => (
          <Card
            key={idx}
            className="border border-slate-200 bg-white hover:shadow-xl transition-all duration-300 cursor-default group focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:ring-offset-2"
            role="article"
            aria-label={`${kpi.label}: ${kpi.value}`}
            tabIndex={0}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.color} shadow-lg group-hover:scale-110 transition-transform duration-300`} aria-hidden="true">
                  {kpiIconMap[kpi.icon] || null}
                </div>
                <div className="h-2 w-2 rounded-full bg-[#2563EB] animate-pulse" aria-hidden="true"></div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-[#0F172A]" aria-label={`Value: ${kpi.value}`}>{kpi.value}</p>
                <p className="text-sm font-semibold text-[#0F172A]">{kpi.label}</p>
                <p className="text-xs text-[#64748B]">{kpi.sublabel}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Performance Card */}
        <Card className="border border-slate-200 bg-white lg:col-span-2" role="region" aria-label="Team performance overview">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-[#0F172A]" id="team-performance-title">Team Performance Overview</CardTitle>
              <Link href="/department_lead/team">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[#2563EB] hover:text-[#1D4ED8] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                  aria-label="View all team members"
                >
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div>
                <p className="text-sm text-[#64748B] mb-1">Overall Completion Rate</p>
                <p className="text-3xl font-bold text-[#0F172A]" aria-label={`Overall completion rate: ${dashboardData.teamPerformance} percent`}>{dashboardData.teamPerformance}%</p>
              </div>
              <div className="w-24 h-24 relative">
                <svg 
                  className="w-24 h-24 transform -rotate-90" 
                  role="img" 
                  aria-label={`Team performance: ${dashboardData.teamPerformance} percent`}
                  aria-valuenow={dashboardData.teamPerformance}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#E2E8F0"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#2563EB"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(dashboardData.teamPerformance / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <span className="text-lg font-bold text-[#2563EB]">{dashboardData.teamPerformance}%</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4" role="list" aria-label="Task status breakdown">
              <div className="text-center p-4 bg-slate-50 rounded-lg" role="listitem">
                <p className="text-2xl font-bold text-[#0F172A]" aria-label={`Pending tasks: ${dashboardData.pendingTasks}`}>{dashboardData.pendingTasks}</p>
                <p className="text-xs text-[#64748B] mt-1">Pending</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg" role="listitem">
                <p className="text-2xl font-bold text-[#2563EB]" aria-label={`In progress tasks: ${dashboardData.inProgressTasks}`}>{dashboardData.inProgressTasks}</p>
                <p className="text-xs text-[#64748B] mt-1">In Progress</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg" role="listitem">
                <p className="text-2xl font-bold text-[#16A34A]" aria-label={`Completed tasks: ${dashboardData.completedTasks}`}>{dashboardData.completedTasks}</p>
                <p className="text-xs text-[#64748B] mt-1">Completed</p>
              </div>
            </div>
            <Link href="/department_lead/team">
              <Button
                variant="outline"
                className="w-full border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5 focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                aria-label="Manage team members"
              >
                Manage Team
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="border border-slate-200 bg-white shadow-sm" role="region" aria-label="Quick actions">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-[#0F172A]" id="quick-actions-title">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5" role="group" aria-labelledby="quick-actions-title">
            <Link href="/department_lead/tasks" className="block">
              <button
                className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ease-in-out border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Assign a new task to team members"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleGoToTasks();
                  }
                }}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg" aria-hidden="true">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-base font-bold text-white">Assign New Task</span>
              </button>
            </Link>
            <Link href="/department_lead/team" className="block">
              <button
                className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ease-in-out border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="View team members"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleGoToTeam();
                  }
                }}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg" aria-hidden="true">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-base font-bold text-white">View Team</span>
              </button>
            </Link>
            <Link href="/department_lead/timesheets" className="block">
              <button
                className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ease-in-out border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Review team timesheets"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleGoToTimesheets();
                  }
                }}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg" aria-hidden="true">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-base font-bold text-white">Review Timesheets</span>
              </button>
            </Link>
            <Link href="/department_lead/reports" className="block">
              <button
                className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ease-in-out border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="View department reports"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleGoToReports();
                  }
                }}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg" aria-hidden="true">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-base font-bold text-white">View Reports</span>
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card className="border border-slate-200 bg-white shadow-sm" role="region" aria-label="Recent tasks">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-[#0F172A] mb-1" id="recent-tasks-title">Recent Tasks</CardTitle>
              <p className="text-sm text-[#64748B]">Track and manage your department&apos;s active tasks</p>
            </div>
            <Link href="/department_lead/tasks">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[#2563EB] hover:text-[#1D4ED8] hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg transition-colors focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                aria-label="View all tasks"
              >
                View All Tasks
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <NoTasksEmptyState
              onCreateTask={handleCreateTask}
              onViewAllTasks={handleViewAllTasks}
            />
          ) : (
            <ul className="space-y-5" role="list" aria-labelledby="recent-tasks-title">
              {recentTasks.map((task) => (
                <li key={task.id} role="listitem">
                  <Link 
                    href={`/department_lead/tasks/${task.id}`}
                    className="block"
                    aria-label={`Task: ${task.title}, Status: ${task.status}, Priority: ${task.priority}, Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                  >
                    <div className="group relative p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:ring-offset-2">
                      {/* Gradient accent bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
                    
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        {/* Title and Badges Row */}
                        <div className="flex items-start gap-3 mb-3 flex-wrap">
                          <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors duration-200 flex-shrink-0">
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge 
                              className={`${getStatusColor(task.status)} font-semibold text-xs px-2.5 py-1 border`}
                              aria-label={`Task status: ${task.status}`}
                            >
                              {task.status}
                            </Badge>
                            <Badge 
                              className={`${getPriorityColor(task.priority)} font-semibold text-xs px-2.5 py-1 border`}
                              aria-label={`Task priority: ${task.priority}`}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Description */}
                        {task.description && (
                          <p className="text-sm text-[#64748B] mb-4 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                        
                        {/* Task Details Row */}
                        <div className="flex items-center gap-6 flex-wrap">
                          <div className="flex items-center gap-2 text-sm text-[#64748B] bg-slate-50 px-3 py-1.5 rounded-lg">
                            <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium" aria-label={`Assigned to: ${task.employeeName || "Unassigned"}`}>{task.employeeName || "Unassigned"}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-[#64748B] bg-slate-50 px-3 py-1.5 rounded-lg">
                            <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium" aria-label={`Due date: ${new Date(task.dueDate).toLocaleDateString()}`}>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                          
                          {task.progress !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-[#64748B] bg-slate-50 px-3 py-1.5 rounded-lg">
                              <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <span className="font-medium" aria-label={`Progress: ${task.progress} percent`}>{task.progress}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Arrow Icon */}
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 group-hover:bg-blue-100 transition-colors duration-200" aria-hidden="true">
                        <svg className="w-5 h-5 text-[#64748B] group-hover:text-[#2563EB] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Main export with error boundary protection
 * This ensures component crashes don't break the entire app
 */
export default function DepartmentLeadDashboardPageWithErrorBoundary() {
  return (
    <DashboardErrorBoundary>
      <DepartmentLeadDashboardPage />
    </DashboardErrorBoundary>
  );
}
