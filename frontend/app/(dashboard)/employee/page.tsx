"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { employeeService } from "@/lib/services/employeeService";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function EmployeeDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "Employee";
  const payPeriodStatus = "Active";

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getDashboard();
      setDashboardData(data);
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpis = dashboardData ? [
    {
      label: "Hours Logged",
      value: dashboardData.kpis.hoursLogged.toFixed(1),
      sublabel: "This month",
      icon: "⏰",
    },
    {
      label: "Available Leave",
      value: dashboardData.kpis.availableLeave.toFixed(0),
      sublabel: "Days remaining",
      icon: "📅",
    },
    {
      label: "Latest Pay",
      value: dashboardData.kpis.latestPay > 0 ? `$${dashboardData.kpis.latestPay.toLocaleString()}` : "$0",
      sublabel: dashboardData.latestPaystub ? new Date(dashboardData.latestPaystub.payDate).toLocaleDateString() : "No pay yet",
      icon: "💰",
    },
    {
      label: "Next Payday",
      value: dashboardData.kpis.nextPayday ? new Date(dashboardData.kpis.nextPayday).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A",
      sublabel: dashboardData.kpis.nextPayday ? new Date(dashboardData.kpis.nextPayday).getFullYear().toString() : "",
      icon: "📆",
    },
  ] : [];

  const weeklyTimesheet = dashboardData?.weeklyTimesheet?.entries || [];
  const totalHours = dashboardData?.weeklyTimesheet?.hours || 0;

  const leaveData = dashboardData?.leaveOverview ? {
    total: (dashboardData.leaveOverview.balance?.annual?.total || 0) + 
           (dashboardData.leaveOverview.balance?.sick?.total || 0) + 
           (dashboardData.leaveOverview.balance?.casual?.total || 0),
    used: (dashboardData.leaveOverview.balance?.annual?.used || 0) + 
          (dashboardData.leaveOverview.balance?.sick?.used || 0) + 
          (dashboardData.leaveOverview.balance?.casual?.used || 0),
    remaining: dashboardData.kpis.availableLeave,
    upcoming: dashboardData.leaveOverview.upcomingLeaves.map((leave: any) => ({
      date: leave.startDate,
      type: leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1) + " Leave",
      days: leave.totalDays,
    })),
  } : { total: 0, used: 0, remaining: 0, upcoming: [] };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            View your timesheet, pay stubs, and leave information
          </p>
        </div>
        <Badge
          className={
            payPeriodStatus === "Active"
              ? "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20"
              : "bg-slate-100 text-slate-700 border-slate-200"
          }
        >
          {payPeriodStatus} Pay Period
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card
            key={idx}
            className="border border-slate-200 bg-white hover:shadow-lg transition-all duration-300"
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
            <CardTitle className="text-lg font-bold text-[#0F172A]">Timesheet Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {weeklyTimesheet.length > 0 ? weeklyTimesheet.map((entry: any, idx: number) => (
                <div
                  key={idx}
                  className="text-center p-2 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <p className="text-xs font-semibold text-[#0F172A] mb-1">{entry.day}</p>
                  <p className="text-xs text-[#64748B] mb-2">
                    {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-sm font-bold text-[#2563EB]">{entry.hours}h</p>
                </div>
              )) : (
                <div className="col-span-7 text-center py-4 text-[#64748B] text-sm">
                  No timesheet entries for this week
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div>
                <p className="text-xs text-[#64748B] mb-1">Total Hours</p>
                <p className="text-lg font-bold text-[#0F172A]">{totalHours}h</p>
              </div>
              <Link href="/employee/timesheet">
                <Button
                  variant="outline"
                  className="border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
                >
                  View Full Timesheet
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Latest Pay Stub</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData?.latestPaystub ? (
              <>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Net Pay</p>
                  <p className="text-3xl font-bold text-[#0F172A]">${dashboardData.latestPaystub.netPay.toLocaleString()}</p>
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
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                    >
                      View Details
                    </Button>
                  </Link>
                  {dashboardData.latestPaystub.pdfUrl && (
                    <Button
                      variant="outline"
                      className="border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
                      onClick={() => {
                        window.open(dashboardData.latestPaystub.pdfUrl, '_blank');
                      }}
                    >
                      Download
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-[#64748B] mb-2">No pay stubs available</p>
                <p className="text-xs text-[#64748B]">Your pay stubs will appear here once processed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Leave Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#0F172A]">Leave Balance</span>
              <span className="text-sm font-semibold text-[#0F172A]">
                {leaveData.remaining} / {leaveData.total} days
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] h-3 rounded-full transition-all"
                style={{ width: `${leaveData.total > 0 ? (leaveData.remaining / leaveData.total) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-[#64748B] mt-2">
              {leaveData.used} days used this year
            </p>
          </div>

          {leaveData.upcoming.length > 0 ? (
            <div>
              <p className="text-sm font-semibold text-[#0F172A] mb-3">Upcoming Approved Leaves</p>
              <div className="space-y-2">
                {leaveData.upcoming.map((leave, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
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
                    <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20">
                      {leave.days} {leave.days === 1 ? "day" : "days"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-[#64748B]">No upcoming leaves scheduled</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link href="/employee/leave">
              <Button
                variant="gradient"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                Request Leave
              </Button>
            </Link>
            <Link href="/employee/tasks">
              <Button
                variant="outline"
                className="w-full border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
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
