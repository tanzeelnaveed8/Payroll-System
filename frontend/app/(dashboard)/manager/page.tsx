"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Link from "next/link";
import { managerService } from "@/lib/services/managerService";
import type { PerformanceUpdate, TeamMember } from "@/lib/api/manager";

export default function ManagerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    teamMembers: 0,
    directReports: 0,
    pendingApprovals: 0,
    timesheetsSubmitted: 0,
    leaveRequestsPending: 0,
  });
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadPerformanceUpdates();
  }, [filterEmployee, filterDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboard, team] = await Promise.all([
        managerService.getDashboard(),
        managerService.getTeam(),
      ]);
      setDashboardData(dashboard);
      setTeamMembers(team);
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      alert(error?.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceUpdates = async () => {
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
      console.error('Failed to load performance updates:', error);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating === 1) return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20";
    if (rating === 2) return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
    if (rating === 3) return "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20";
    if (rating === 4) return "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20";
    return "bg-[#16A34A]/20 text-[#16A34A] border-[#16A34A]/30";
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
      await loadPerformanceUpdates();
    } catch (error: any) {
      alert(error.message || 'Failed to save performance update');
    } finally {
      setSaving(false);
    }
  };

  const kpis = [
    {
      label: "Team Members",
      value: dashboardData.teamMembers.toString(),
      sublabel: "Direct reports",
      icon: "👥",
    },
    {
      label: "Direct Reports",
      value: dashboardData.directReports.toString(),
      sublabel: "Active team",
      icon: "📊",
    },
    {
      label: "Pending Approvals",
      value: dashboardData.pendingApprovals.toString(),
      sublabel: "Requires action",
      icon: "⏱️",
    },
    {
      label: "Timesheets Submitted",
      value: dashboardData.timesheetsSubmitted.toString(),
      sublabel: "This period",
      icon: "📝",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Welcome back, Manager</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Overview of your team and pending approvals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card
            key={idx}
            className="border border-slate-200 bg-white hover:shadow-lg transition-all duration-300 cursor-default"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{kpi.icon}</div>
                <div className="h-2 w-2 rounded-full bg-[#2563EB]"></div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-[#0F172A]">{kpi.value}</p>
                <p className="text-sm font-semibold text-[#0F172A]">{kpi.label}</p>
                <p className="text-xs text-[#64748B]">{kpi.sublabel}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Team Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Approval Overview</CardTitle>
              <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20">
                {dashboardData.pendingApprovals} Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#0F172A]">Timesheets</span>
                <span className="text-sm font-semibold text-[#0F172A]">{dashboardData.timesheetsSubmitted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#0F172A]">Leave Requests</span>
                <span className="text-sm font-semibold text-[#0F172A]">{dashboardData.leaveRequestsPending}</span>
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
            <div className="text-center py-12 text-[#64748B]">
              <p className="text-sm mb-2">No performance updates found</p>
              <p className="text-xs">Add your first update to track team performance</p>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <div
                  key={update.id || update._id}
                  className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-all"
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
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 bg-white">
            <CardHeader className="flex items-center justify-between sticky top-0 bg-white border-b border-slate-200">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Add Performance Update</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                ✕
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
    </div>
  );
}
