"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Link from "next/link";
import { managerService, ManagerDashboardValidationError } from "@/lib/services/managerService";
import type { PerformanceUpdate, TeamMember } from "@/lib/api/manager";
import { toast } from "@/lib/hooks/useToast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useManagerDashboardQuery } from "@/lib/hooks/useManagerDashboardQuery";
import DashboardErrorBoundary from "@/components/errors/DashboardErrorBoundary";
import ErrorFallback from "@/components/errors/ErrorFallback";
import { useAnnouncement } from "@/lib/hooks/useAnnouncement";
import ManagerDashboardSkeleton from "@/components/skeletons/ManagerDashboardSkeleton";
import {
  NoManagerDashboardDataEmptyState,
  NoTeamMembersEmptyState,
  NoPendingApprovalsEmptyState,
  NoPerformanceUpdatesEmptyState,
  ManagerDashboardUnavailableEmptyState,
} from "@/components/empty-states/ManagerDashboardEmptyStates";
import { Users, BarChart3, Timer, FileEdit, RefreshCw, X } from "lucide-react";

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
function formatLastUpdated(timestamp: Date | null): string {
  if (!timestamp) return 'Never';
  
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  
  return timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export default function ManagerDashboardPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [updates, setUpdates] = useState<PerformanceUpdate[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    rating: 3,
    summary: "",
    achievements: "",
    issues: "",
    blockers: "",
    nextDayFocus: "",
  });
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
  } = useManagerDashboardQuery();

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

  useEffect(() => {
    // Ensure user is manager or admin - redirect if not
    if (!authLoading && user) {
      const userRole = user.role?.toLowerCase().trim();
      if (userRole !== 'manager' && userRole !== 'admin') {
        if (userRole === 'employee') {
          router.push('/employee');
        } else if (userRole === 'dept_lead' || userRole === 'department_lead') {
          router.push('/department_lead');
        }
        return;
      }
    }
  }, [user, authLoading, router]);

  // Load team members separately (not part of dashboard data)
  useEffect(() => {
    const loadTeam = async () => {
      try {
        const team = await managerService.getTeam();
        setTeamMembers(team);
      } catch (error: any) {
        // Log error for observability
        console.error('[ManagerDashboard] Failed to load team members:', {
          error: error?.message,
          stack: error?.stack,
          timestamp: new Date().toISOString(),
        });
        // Show user-friendly error message - team members are needed for performance updates
        toast.error('Failed to load team members. Some features may be limited.');
        // Set empty array to prevent crashes
        setTeamMembers([]);
      }
    };
    if (user) {
      loadTeam();
    }
  }, [user]);

  const loadPerformanceUpdates = useCallback(async () => {
    try {
      const params: any = { limit: 100 };
      if (filterEmployee !== "all") {
        params.employeeId = filterEmployee;
      }
      if (filterDate !== "all") {
        const today = new Date();
        if (filterDate === "today") {
          params.startDate = today.toISOString().split("T")[0];
          params.endDate = today.toISOString().split("T")[0];
        } else if (filterDate === "yesterday") {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          params.startDate = yesterday.toISOString().split("T")[0];
          params.endDate = yesterday.toISOString().split("T")[0];
        } else if (filterDate === "this-week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          params.startDate = weekAgo.toISOString().split("T")[0];
          params.endDate = today.toISOString().split("T")[0];
        }
      }
      const result = await managerService.getPerformanceUpdates(params);
      setUpdates(result.updates);
    } catch (error: any) {
      // Log error for observability instead of silently failing
      console.error('[ManagerDashboard] Failed to load performance updates:', {
        error: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
      });
      // Show user-friendly error message
      toast.error('Failed to load performance updates. Please try again.');
    }
  }, [filterEmployee, filterDate]);

  useEffect(() => {
    loadPerformanceUpdates();
  }, [loadPerformanceUpdates]);

  const getRatingColor = (rating: number) => {
    if (rating === 1) return "bg-[#DC2626]/10 text-[#DC2626] border-2 border-[#DC2626]/30 font-semibold";
    if (rating === 2) return "bg-[#F59E0B]/10 text-[#F59E0B] border-2 border-[#F59E0B]/30 font-semibold";
    if (rating === 3) return "bg-[#2563EB]/10 text-[#2563EB] border-2 border-[#2563EB]/30 font-semibold";
    if (rating === 4) return "bg-[#16A34A]/10 text-[#16A34A] border-2 border-[#16A34A]/30 font-semibold";
    return "bg-[#16A34A]/20 text-[#16A34A] border-2 border-[#16A34A]/40 font-semibold";
  };

  const handleSave = async () => {
    if (!formData.employeeId || !formData.summary) return;
    try {
      setSaving(true);
      await managerService.createPerformanceUpdate({
        employeeId: formData.employeeId,
        date: formData.date,
        rating: formData.rating,
        summary: formData.summary,
        achievements: formData.achievements || undefined,
        issues: formData.issues || undefined,
        blockers: formData.blockers || undefined,
        nextDayFocus: formData.nextDayFocus || undefined,
      });
      setFormData({
        employeeId: "",
        date: new Date().toISOString().split("T")[0],
        rating: 3,
        summary: "",
        achievements: "",
        issues: "",
        blockers: "",
        nextDayFocus: "",
      });
      setShowAddModal(false);
      toast.success('Performance update saved successfully!');
      await loadPerformanceUpdates();
    } catch (error: any) {
      // Log error for observability
      console.error('[ManagerDashboard] Failed to save performance update:', {
        error: error?.message,
        stack: error?.stack,
        formData: {
          employeeId: formData.employeeId,
          date: formData.date,
          rating: formData.rating,
        },
        timestamp: new Date().toISOString(),
      });
      // Show user-friendly error message
      const errorMessage = error?.message || 'Failed to save performance update. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Calculate last updated timestamp
  const lastUpdated = useMemo(() => {
    return dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  }, [dataUpdatedAt]);

  // State: Loading (initial load with no cached data)
  // Show skeleton loader that matches the dashboard layout to prevent CLS
  if (isLoading && !dashboardData) {
    return (
      <DashboardErrorBoundary>
        <ManagerDashboardSkeleton />
      </DashboardErrorBoundary>
    );
  }

  // State: Error (with no cached data to show)
  if (error && !dashboardData) {
    // Check if it's a validation error for more specific messaging
    const isValidationError = error instanceof ManagerDashboardValidationError || 
      (error instanceof Error && error.message.includes('Invalid dashboard data'));
    
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <ErrorFallback
          error={error instanceof Error ? error : new Error(String(error))}
          resetErrorBoundary={() => refresh()}
          title={isValidationError ? "Data Validation Error" : "Failed to Load Dashboard"}
          message={
            isValidationError
              ? "The dashboard data received from the server doesn't match the expected format. This may indicate a backend issue. Please contact support if this problem persists."
              : "We encountered an issue while loading your dashboard data. This may be due to a network issue or a temporary service problem."
          }
          actionLabel="Retry"
          onSecondaryAction={() => router.push("/manager")}
          secondaryActionLabel="Return to Dashboard"
        />
      </div>
    );
  }

  // State: Empty (no data available)
  if (!dashboardData) {
    return (
      <DashboardErrorBoundary>
        <div className="flex items-center justify-center min-h-screen p-4">
          <ManagerDashboardUnavailableEmptyState
            onRefresh={() => refresh()}
            onGoHome={() => router.push("/manager")}
          />
        </div>
      </DashboardErrorBoundary>
    );
  }

  // Use safe defaults to prevent null/undefined errors
  const safeDashboardData = {
    teamMembers: dashboardData.teamMembers || 0,
    directReports: dashboardData.directReports || 0,
    pendingApprovals: dashboardData.pendingApprovals || 0,
    timesheetsSubmitted: dashboardData.timesheetsSubmitted || 0,
    leaveRequestsPending: dashboardData.leaveRequestsPending || 0,
  };

  const kpis = [
    {
      label: "Team Members",
      value: safeDashboardData.teamMembers.toString(),
      sublabel: "Direct reports",
      icon: "users",
    },
    {
      label: "Direct Reports",
      value: safeDashboardData.directReports.toString(),
      sublabel: "Active team",
      icon: "bar-chart",
    },
    {
      label: "Pending Approvals",
      value: safeDashboardData.pendingApprovals.toString(),
      sublabel: "Requires action",
      icon: "timer",
    },
    {
      label: "Timesheets Submitted",
      value: safeDashboardData.timesheetsSubmitted.toString(),
      sublabel: "This period",
      icon: "file-edit",
    },
  ];

  return (
    <DashboardErrorBoundary>
      <main id="main-content" tabIndex={-1} className="space-y-6 p-4 sm:p-6 relative" role="main" aria-label="Manager Dashboard">
      {/* Background refresh indicator - subtle overlay when refreshing */}
      {isRefreshing && dashboardData && (
        <div 
          className="absolute inset-0 bg-white/30 backdrop-blur-[2px] z-40 flex items-start justify-center pt-8 rounded-lg pointer-events-none"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="bg-white border-2 border-blue-200 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" aria-hidden="true"></div>
            <span className="text-sm text-[#2563EB] font-medium">Refreshing data...</span>
          </div>
        </div>
      )}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="fluid-h1 font-bold text-[#0F172A] mb-2">Welcome back, Manager</h1>
          <p className="fluid-body text-[#64748B]">
            Overview of your team and pending approvals
          </p>
          {/* Last updated timestamp */}
          {lastUpdated && (
            <p className="text-xs text-[#64748B] mt-1" aria-live="polite" aria-atomic="true">
              <span className="sr-only">Dashboard last updated</span>
              Last updated: {formatLastUpdated(lastUpdated)}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Manual Refresh Button */}
          <Button
            onClick={() => {
              refresh();
              announce("Refreshing dashboard data");
            }}
            disabled={isRefreshing}
            variant="outline"
            size="default"
            className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#2563EB] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isRefreshing ? "Refreshing dashboard data, please wait" : "Refresh dashboard data"}
            aria-busy={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
        {(() => {
          const kpiIconMap: Record<string, React.ReactNode> = {
            "users": <Users className="w-7 h-7 text-blue-600" />,
            "bar-chart": <BarChart3 className="w-7 h-7 text-blue-600" />,
            "timer": <Timer className="w-7 h-7 text-blue-600" />,
            "file-edit": <FileEdit className="w-7 h-7 text-blue-600" />,
          };
          return kpis.map((kpi, idx) => (
          <Card
            key={idx}
            className="border-2 border-slate-300 bg-white hover:shadow-xl transition-all duration-300 cursor-default shadow-sm"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div aria-hidden="true">{kpiIconMap[kpi.icon] || null}</div>
                <div className="h-2 w-2 rounded-full bg-[#2563EB]"></div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-[#0F172A]">{kpi.value}</p>
                <p className="text-sm font-semibold text-[#0F172A]">{kpi.label}</p>
                <p className="text-xs text-[#64748B]">{kpi.sublabel}</p>
              </div>
            </CardContent>
          </Card>
        ));
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Team Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.length === 0 ? (
              <NoTeamMembersEmptyState
                onViewTeam={() => router.push("/manager/team")}
                onAddEmployee={() => router.push("/admin/employees")}
              />
            ) : (
              <>
                <p className="text-sm text-[#64748B]">
                  Your team has shown consistent performance this period. Review detailed analytics and metrics to track progress and identify areas for improvement.
                </p>
                <Link href="/manager/team">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
                  >
                    View Details
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Approval Overview</CardTitle>
              {safeDashboardData.pendingApprovals > 0 && (
                <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20">
                  {safeDashboardData.pendingApprovals} Pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {safeDashboardData.pendingApprovals === 0 && safeDashboardData.timesheetsSubmitted === 0 && safeDashboardData.leaveRequestsPending === 0 ? (
              <NoPendingApprovalsEmptyState
                onViewApprovals={() => router.push("/manager/approvals")}
              />
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#0F172A]">Timesheets</span>
                    <span className="text-sm font-semibold text-[#0F172A]">{safeDashboardData.timesheetsSubmitted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#0F172A]">Leave Requests</span>
                    <span className="text-sm font-semibold text-[#0F172A]">{safeDashboardData.leaveRequestsPending}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link href="/manager/approvals" className="w-full">
                    <Button
                      variant="gradient"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:opacity-90"
                    >
                      Review Approvals
                    </Button>
                  </Link>
                  <Link href="/manager/tasks" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
                    >
                      View Tasks Report
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-bold text-[#0F172A]">Daily Team Performance</CardTitle>
            <Button
              variant="gradient"
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              onClick={() => setShowAddModal(true)}
            >
              Add Update
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="w-full sm:w-auto min-w-[160px]"
            >
              <option value="all">All Employees</option>
              {teamMembers.map((report) => (
                <option key={report.id || report._id} value={report.id || report._id}>
                  {report.name}
                </option>
              ))}
            </Select>
            <Select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full sm:w-auto min-w-[160px]"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this-week">This Week</option>
            </Select>
          </div>

          {updates.length === 0 ? (
            <NoPerformanceUpdatesEmptyState
              onAddUpdate={() => setShowAddModal(true)}
            />
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <div
                  key={update.id || update._id}
                  className="p-4 border-2 border-slate-300 rounded-lg hover:shadow-lg transition-all bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold text-sm">
                        {(update.employeeName || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{update.employeeName || 'Unknown'}</p>
                        <p className="text-xs text-[#64748B]">
                          {new Date(update.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge className={getRatingColor(update.rating)}>
                      {update.rating}/5
                    </Badge>
                  </div>
                  <p className="text-sm text-[#0F172A] mb-2">{update.summary}</p>
                  {update.achievements && (
                    <p className="text-xs text-[#64748B] mb-1">
                      <span className="font-semibold">Achievements:</span> {update.achievements}
                    </p>
                  )}
                  {update.issues && (
                    <p className="text-xs text-[#64748B] mb-1">
                      <span className="font-semibold">Issues:</span> {update.issues}
                    </p>
                  )}
                  {update.blockers && (
                    <p className="text-xs text-[#64748B] mb-1">
                      <span className="font-semibold">Blockers:</span> {update.blockers}
                    </p>
                  )}
                  {update.nextDayFocus && (
                    <p className="text-xs text-[#64748B]">
                      <span className="font-semibold">Next Day:</span> {update.nextDayFocus}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-slate-400 bg-white shadow-2xl">
            <CardHeader className="flex items-center justify-between sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-slate-300">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Add Performance Update</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Employee <span className="text-[#DC2626]">*</span>
                </label>
                <Select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                >
                  <option value="">Select employee</option>
                  {teamMembers.length === 0 ? (
                    <option value="" disabled>No employees found</option>
                  ) : (
                    teamMembers.map((report) => (
                      <option key={report.id || report._id} value={report.id || report._id}>
                        {report.name}
                      </option>
                    ))
                  )}
                </Select>
                {teamMembers.length === 0 && (
                  <p className="text-xs text-[#64748B] mt-1">No employees available. Please ensure employees are registered in the system.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Date <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Performance Rating <span className="text-[#DC2626]">*</span>
                </label>
                <Select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                >
                  <option value="1">1 - Needs Improvement</option>
                  <option value="2">2 - Below Expectations</option>
                  <option value="3">3 - Meets Expectations</option>
                  <option value="4">4 - Exceeds Expectations</option>
                  <option value="5">5 - Outstanding</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Work Summary <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full min-h-[80px] rounded-xl border-2 border-[#2563EB]/30 bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:border-[#2563EB] transition-all"
                  placeholder="Brief summary of work completed..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">Achievements (Optional)</label>
                <Input
                  value={formData.achievements}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                  placeholder="Key achievements or milestones"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">Issues / Blockers (Optional)</label>
                <Input
                  value={formData.issues}
                  onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                  placeholder="Any blockers or challenges"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">Blockers (Optional)</label>
                <Input
                  value={formData.blockers}
                  onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                  placeholder="Specific blockers"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">Next-Day Focus (Optional)</label>
                <Input
                  value={formData.nextDayFocus}
                  onChange={(e) => setFormData({ ...formData, nextDayFocus: e.target.value })}
                  placeholder="Planned focus for next day"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="gradient"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                  onClick={handleSave}
                  disabled={!formData.employeeId || !formData.summary || saving}
                >
                  {saving ? 'Saving...' : 'Save Update'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-slate-200"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </main>
    </DashboardErrorBoundary>
  );
}
