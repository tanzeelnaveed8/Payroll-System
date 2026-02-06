"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, CalendarDays, Wallet, CalendarClock, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { toast } from "@/lib/hooks/useToast";
import { useEmployeeDashboardQuery } from "@/lib/hooks/useEmployeeDashboardQuery";
import { useAnnouncement } from "@/lib/hooks/useAnnouncement";
import { EmployeeDashboardValidationError } from "@/lib/services/employeeService";
import type { EmployeeDashboardData } from "@/lib/validators/employeeDashboardSchema";
import DashboardErrorBoundary from "@/components/errors/DashboardErrorBoundary";
import EmployeeDashboardSkeleton from "@/components/skeletons/EmployeeDashboardSkeleton";
import {
  NoEmployeeDashboardDataEmptyState,
  NoTimesheetEntriesEmptyState,
  NoPayStubsEmptyState,
  NoLeaveRecordsEmptyState,
  EmployeeDashboardUnavailableEmptyState,
} from "@/components/empty-states/EmployeeDashboardEmptyStates";

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

const kpiIconMap: Record<string, React.ReactNode> = {
  "clock": <Clock className="w-7 h-7 text-blue-600" />,
  "calendar-days": <CalendarDays className="w-7 h-7 text-blue-600" />,
  "wallet": <Wallet className="w-7 h-7 text-blue-600" />,
  "calendar-clock": <CalendarClock className="w-7 h-7 text-blue-600" />,
};

function EmployeeDashboardContent() {
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
  } = useEmployeeDashboardQuery();

  const firstName = useMemo(() => user?.name?.split(" ")[0] || "Employee", [user?.name]);
  const payPeriodStatus = "Active";

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

  // Memoize navigation handlers
  const handleGoToTimesheet = useCallback(() => {
    router.push('/employee/timesheet');
  }, [router]);

  const handleGoToPaystubs = useCallback(() => {
    router.push('/employee/paystubs');
  }, [router]);

  const handleGoToLeave = useCallback(() => {
    router.push('/employee/leave');
  }, [router]);

  const handleGoToTasks = useCallback(() => {
    router.push('/employee/tasks');
  }, [router]);

  const handleGoToEmployeeDashboard = useCallback(() => {
    router.push('/employee');
  }, [router]);

  // Memoize refresh handler with announcement
  const handleRefresh = useCallback(() => {
    announce("Refreshing dashboard data");
    refresh();
  }, [refresh, announce]);

  // Memoize PDF download handler
  const handleDownloadPDF = useCallback(() => {
    if (dashboardData?.latestPaystub?.pdfUrl) {
      window.open(dashboardData.latestPaystub.pdfUrl, '_blank', 'noopener,noreferrer');
    }
  }, [dashboardData?.latestPaystub?.pdfUrl]);

  useEffect(() => {
    // Ensure user is an employee - redirect if not
    if (!authLoading && user) {
      const userRole = user.role?.toLowerCase().trim();
      if (userRole !== 'employee') {
        if (userRole === 'admin' || userRole === 'manager') {
          router.push('/admin');
        } else if (userRole === 'dept_lead' || userRole === 'department_lead') {
          router.push('/department_lead');
        }
        return;
      }
    }
  }, [user, authLoading, router]);

  // Show error toast if there's an error with enhanced logging
  useEffect(() => {
    if (error) {
      const isValidationError = error instanceof EmployeeDashboardValidationError || 
        (error instanceof Error && error.message.includes('Invalid dashboard data'));
      
      // Enhanced error logging with user context
      console.error('[Employee Dashboard] Error occurred:', {
        error: error.message,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined,
        userId: user?.id,
        userEmail: user?.email,
        isValidationError,
        timestamp: new Date().toISOString(),
        pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
        ...(isValidationError && error instanceof EmployeeDashboardValidationError && {
          validationDetails: error.validationDetails,
        }),
      });
      
      const errorMessage = isValidationError
        ? "The dashboard data received from the server doesn't match the expected format. Please refresh or contact support if this problem persists."
        : error.message || 'Failed to load dashboard';
      
      toast.error(errorMessage);
    }
  }, [error, user?.id, user?.email]);

  // Memoize computed values to prevent unnecessary recalculations
  const kpis = useMemo(() => {
    if (!dashboardData) return [];
    
    return [
      {
        label: "Hours Logged",
        value: dashboardData.kpis.hoursLogged.toFixed(1),
        sublabel: "This month",
        icon: "clock",
      },
      {
        label: "Available Leave",
        value: dashboardData.kpis.availableLeave.toFixed(0),
        sublabel: "Days remaining",
        icon: "calendar-days",
      },
      {
        label: "Latest Pay",
        value: dashboardData.kpis.latestPay > 0 ? `Rs ${dashboardData.kpis.latestPay.toLocaleString()}` : "Rs 0",
        sublabel: dashboardData.latestPaystub ? new Date(dashboardData.latestPaystub.payDate).toLocaleDateString() : "No pay yet",
        icon: "wallet",
      },
      {
        label: "Next Payday",
        value: dashboardData.kpis.nextPayday ? new Date(dashboardData.kpis.nextPayday).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A",
        sublabel: dashboardData.kpis.nextPayday ? new Date(dashboardData.kpis.nextPayday).getFullYear().toString() : "",
        icon: "calendar-clock",
      },
    ];
  }, [dashboardData]);

  const weeklyTimesheet = useMemo(() => dashboardData?.weeklyTimesheet?.entries || [], [dashboardData]);
  const totalHours = useMemo(() => dashboardData?.weeklyTimesheet?.hours || 0, [dashboardData]);

  const leaveData = useMemo(() => {
    if (!dashboardData?.leaveOverview) {
      return { total: 0, used: 0, remaining: 0, upcoming: [] };
    }
    
    return {
      total: (dashboardData.leaveOverview.balance?.annual?.total || 0) + 
             (dashboardData.leaveOverview.balance?.sick?.total || 0) + 
             (dashboardData.leaveOverview.balance?.casual?.total || 0),
      used: (dashboardData.leaveOverview.balance?.annual?.used || 0) + 
            (dashboardData.leaveOverview.balance?.sick?.used || 0) + 
            (dashboardData.leaveOverview.balance?.casual?.used || 0),
      remaining: dashboardData.kpis.availableLeave,
      upcoming: dashboardData.leaveOverview.upcomingLeaves.map((leave) => ({
        date: leave.startDate,
        type: leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1) + " Leave",
        days: leave.totalDays,
      })),
    };
  }, [dashboardData]);

  // Loading state
  if (isLoading && !dashboardData) {
    return (
      <DashboardErrorBoundary>
        <EmployeeDashboardSkeleton />
      </DashboardErrorBoundary>
    );
  }

  // Error state (only show if no cached data)
  if (error && !dashboardData) {
    const isValidationError = error instanceof EmployeeDashboardValidationError || 
      (error instanceof Error && error.message.includes('Invalid dashboard data'));
    
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">
              {isValidationError ? "Data Validation Error" : "Failed to Load Dashboard"}
            </h2>
            <p className="text-[#64748B] mb-6">
              {isValidationError
                ? "The dashboard data received from the server doesn't match the expected format. This may indicate a backend issue. Please contact support if this problem persists."
                : error.message || "We encountered an issue while loading your dashboard data. This may be due to a network issue or a temporary service problem."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleRefresh}
                aria-label="Retry loading dashboard"
              >
                Retry
              </Button>
              <Button 
                variant="outline" 
                onClick={handleGoToEmployeeDashboard}
                aria-label="Return to employee dashboard"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <DashboardErrorBoundary>
        <EmployeeDashboardUnavailableEmptyState
          onRefresh={handleRefresh}
          onGoHome={handleGoToEmployeeDashboard}
        />
      </DashboardErrorBoundary>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6" role="main" aria-label="Employee dashboard">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="fluid-h1 font-bold text-[#0F172A] mb-2" id="dashboard-title">
            Welcome back, {firstName}
          </h1>
          <p className="fluid-body text-[#64748B]">
            View your timesheet, pay stubs, and leave information
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isRefreshing) {
                  handleRefresh();
                }
              }
            }}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
          <Badge
            className={
              payPeriodStatus === "Active"
                ? "bg-[#16A34A]/10 text-[#16A34A] border-2 border-[#16A34A]/30 font-semibold w-full sm:w-auto text-center"
                : "bg-slate-100 text-slate-700 border-2 border-slate-300 font-semibold w-full sm:w-auto text-center"
            }
            aria-label={`Pay period status: ${payPeriodStatus}`}
          >
            {payPeriodStatus} Pay Period
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="region" aria-label="Dashboard key performance indicators">
        {kpis.map((kpi, idx) => (
          <Card
            key={idx}
            className="border-2 border-slate-300 bg-white hover:shadow-xl transition-all duration-300 shadow-sm focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:ring-offset-2"
            role="article"
            aria-label={`${kpi.label}: ${kpi.value}`}
            tabIndex={0}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div aria-hidden="true">{kpiIconMap[kpi.icon] || null}</div>
                <div className="h-2 w-2 rounded-full bg-[#2563EB]" aria-hidden="true"></div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-[#0F172A]" aria-label={`Value: ${kpi.value}`}>{kpi.value}</p>
                <p className="text-sm font-semibold text-[#0F172A]">{kpi.label}</p>
                <p className="text-xs text-[#64748B]">{kpi.sublabel}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-slate-300 bg-white shadow-sm" role="region" aria-label="Weekly timesheet summary">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]" id="timesheet-summary-title">Timesheet Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weeklyTimesheet.length > 0 ? (
              <>
                <div className="grid grid-cols-7 gap-2">
                  {weeklyTimesheet.map((entry, idx: number) => (
                    <div
                      key={idx}
                      className="text-center p-2 rounded-lg bg-slate-50 border-2 border-slate-300"
                    >
                      <p className="text-xs font-semibold text-[#0F172A] mb-1">{entry.day}</p>
                      <p className="text-xs text-[#64748B] mb-2">
                        {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                      <p className="text-sm font-bold text-[#2563EB]">{entry.hours}h</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Total Hours</p>
                    <p className="text-lg font-bold text-[#0F172A]" aria-label={`Total hours this week: ${totalHours} hours`}>{totalHours}h</p>
                  </div>
                  <Link href="/employee/timesheet">
                    <Button
                      variant="outline"
                      className="border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5 focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                      aria-label="View full timesheet page"
                    >
                      View Full Timesheet
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <NoTimesheetEntriesEmptyState
                onViewTimesheet={handleGoToTimesheet}
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-300 bg-white shadow-sm" role="region" aria-label="Latest pay stub information">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]" id="paystub-title">Latest Pay Stub</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData?.latestPaystub ? (
              <>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Net Pay</p>
                  <p className="text-3xl font-bold text-[#0F172A]">Rs {dashboardData.latestPaystub.netPay.toLocaleString()}</p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">Pay Date</span>
                    <span className="text-sm font-semibold text-[#0F172A]">
                      {new Date(dashboardData.latestPaystub.payDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">Pay Period</span>
                    <span className="text-sm font-semibold text-[#0F172A]">
                      {new Date(dashboardData.latestPaystub.payPeriodStart).toLocaleDateString()} - {new Date(dashboardData.latestPaystub.payPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Link href="/employee/paystubs" className="flex-1">
                    <Button
                      variant="gradient"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="View pay stub details"
                    >
                      View Details
                    </Button>
                  </Link>
                  {dashboardData.latestPaystub?.pdfUrl && (
                    <Button
                      variant="outline"
                      className="border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5 focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                      onClick={handleDownloadPDF}
                      aria-label="Download pay stub PDF"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleDownloadPDF();
                        }
                      }}
                    >
                      Download
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <NoPayStubsEmptyState
                onViewPaystubs={handleGoToPaystubs}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-slate-300 bg-white shadow-sm" role="region" aria-label="Leave balance and upcoming leaves">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]" id="leave-overview-title">Leave Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#0F172A]">Leave Balance</span>
              <span className="text-sm font-semibold text-[#0F172A]" aria-label={`Leave balance: ${leaveData.remaining} days remaining out of ${leaveData.total} total days`}>
                {leaveData.remaining} / {leaveData.total} days
              </span>
            </div>
            <div 
              className="w-full bg-slate-200 rounded-full h-3"
              role="progressbar"
              aria-valuenow={leaveData.total > 0 ? Math.round((leaveData.remaining / leaveData.total) * 100) : 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Leave balance: ${leaveData.remaining} of ${leaveData.total} days remaining`}
            >
              <div
                className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] h-3 rounded-full transition-all"
                style={{ width: `${leaveData.total > 0 ? (leaveData.remaining / leaveData.total) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-[#64748B] mt-2" aria-label={`${leaveData.used} days of leave used this year`}>
              {leaveData.used} days used this year
            </p>
          </div>

          {leaveData.upcoming.length > 0 ? (
            <div>
              <p className="text-sm font-semibold text-[#0F172A] mb-3">Upcoming Approved Leaves</p>
              <div className="space-y-2">
                {leaveData.upcoming.map((leave: { date: string; type: string; days: number }, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border-2 border-slate-300 hover:bg-blue-50 transition-colors focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:ring-offset-2"
                    role="listitem"
                    tabIndex={0}
                    aria-label={`${leave.type} starting ${new Date(leave.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} for ${leave.days} ${leave.days === 1 ? "day" : "days"}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">{leave.type}</p>
                      <p className="text-xs text-[#64748B]">
                        {new Date(leave.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-2 border-[#16A34A]/30 font-semibold" aria-label={`${leave.days} ${leave.days === 1 ? "day" : "days"}`}>
                      {leave.days} {leave.days === 1 ? "day" : "days"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <NoLeaveRecordsEmptyState
              onRequestLeave={handleGoToLeave}
            />
          )}

          <div className="flex flex-col gap-3" role="group" aria-label="Dashboard actions">
            <Link href="/employee/leave">
              <Button
                variant="gradient"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Request leave"
              >
                Request Leave
              </Button>
            </Link>
            <Link href="/employee/tasks">
              <Button
                variant="outline"
                className="w-full border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5 focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                aria-label="View my tasks"
              >
                View My Tasks
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  return (
    <DashboardErrorBoundary>
      <EmployeeDashboardContent />
    </DashboardErrorBoundary>
  );
}
