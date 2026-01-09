'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { adminService } from "@/lib/services/adminService";
import type { AdminDashboardData } from "@/lib/api/admin";

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await adminService.getDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { kpis, recentPayrollActivity, departmentBreakdown } = dashboardData;
  const maxEmployees = departmentBreakdown.departments.length > 0
    ? Math.max(...departmentBreakdown.departments.map(d => d.employees))
    : 1;
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-0">
      {/* Header Section - Mobile First */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-[#64748B]">
            Comprehensive overview of your organization&apos;s payroll and workforce
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Link href="/admin/reports">
            <Button 
              variant="gradient" 
              size="default"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-semibold">Generate Report</span>
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button 
              variant="outline" 
              size="default"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#2563EB] font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics Grid - Mobile First Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Employees */}
        <Card className="relative overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base font-semibold text-[#0F172A]">
                Total Employees
              </CardTitle>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-3xl sm:text-4xl font-bold text-[#0F172A]">{kpis.totalEmployees}</p>
              {kpis.employeeGrowth !== 0 && (
                <Badge className={`${kpis.employeeGrowth > 0 ? 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20' : 'bg-red-100 text-red-700 border-red-200'} text-xs`}>
                  {kpis.employeeGrowth > 0 ? '+' : ''}{kpis.employeeGrowth}%
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-2">
              Active employees across all departments
            </p>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
              <p className="text-xs text-[#64748B]">Last 30 days: +{kpis.newHiresLast30Days} new hires</p>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Status */}
        <Card className="relative overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base font-semibold text-[#0F172A]">
                Payroll Status
              </CardTitle>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-3xl sm:text-4xl font-bold text-[#0F172A]">
                {adminService.formatLargeCurrency(kpis.payrollStatus.total)}
              </p>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                {kpis.payrollStatus.status}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-2">
              Total payroll for current period
            </p>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
              <p className="text-xs text-[#64748B]">
                {kpis.payrollStatus.nextPayday 
                  ? `Next payroll: ${adminService.formatDate(kpis.payrollStatus.nextPayday)}`
                  : 'No upcoming payroll'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="relative overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base font-semibold text-[#0F172A]">
                Pending Approvals
              </CardTitle>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-3xl sm:text-4xl font-bold text-[#0F172A]">{kpis.pendingApprovals}</p>
              {kpis.pendingApprovals > 0 && (
                <Badge className="bg-[#F59E0B] text-white border-[#F59E0B] text-xs">
                  Urgent
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-2">
              Requires immediate attention
            </p>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
              <p className="text-xs text-[#64748B]">
                {kpis.pendingTimesheets} time sheets • {kpis.pendingLeaveRequests} leave requests • {kpis.pendingPayroll} payroll
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Department Count */}
        <Card className="relative overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base font-semibold text-[#0F172A]">
                Departments
              </CardTitle>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-3xl sm:text-4xl font-bold text-[#0F172A]">{kpis.totalDepartments}</p>
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                Active
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-2">
              Active departments in organization
            </p>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
              <p className="text-xs text-[#64748B]">
                {departmentBreakdown.largestDepartment || 'No departments'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics Row - Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border border-slate-200 bg-white hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-[#64748B]">Average Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">
              {adminService.formatCurrency(kpis.averageSalary)}
            </p>
            <p className="text-xs text-[#64748B] mt-1">Per employee annually</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-[#64748B]">Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{kpis.leaveRequestsThisMonth}</p>
            <p className="text-xs text-[#64748B] mt-1">Pending this month</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-[#64748B]">Time Sheets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{kpis.timesheetCompletionRate}%</p>
            <p className="text-xs text-[#64748B] mt-1">Completion rate</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-[#64748B]">Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-[#16A34A]">{kpis.compliance}%</p>
            <p className="text-xs text-[#64748B] mt-1">Regulatory compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - Responsive */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Recent Payroll Activity */}
        <Card className="lg:col-span-2 border border-slate-200 bg-white">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-lg sm:text-xl font-bold text-[#0F172A]">Recent Payroll Activity</CardTitle>
              <Link href="/admin/payroll">
                <Button variant="ghost" size="sm" className="text-[#2563EB] hover:text-[#1D4ED8] w-full sm:w-auto font-medium">
                  View All →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {recentPayrollActivity.length === 0 ? (
                <div className="text-center py-8 text-[#64748B]">
                  <p className="text-sm">No payroll activity found</p>
                </div>
              ) : (
                recentPayrollActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.status === "Completed" ? "bg-[#16A34A]/10" : "bg-blue-100"
                      }`}>
                        {item.status === "Completed" ? (
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#16A34A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm sm:text-base text-[#0F172A] truncate">{item.period}</p>
                        <p className="text-xs sm:text-sm text-[#64748B]">{item.employees} employees • {item.date}</p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-start sm:items-end gap-2 sm:gap-1">
                      <p className="font-bold text-sm sm:text-base text-[#0F172A]">
                        {adminService.formatLargeCurrency(item.amount)}
                      </p>
                      <Badge
                        className={item.status === "Completed" ? "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20" : "bg-[#2563EB] text-white border-[#2563EB]"}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-bold text-[#0F172A]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/admin/payroll" className="w-full block">
                <Button 
                  variant="gradient" 
                  className="w-full justify-start text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:opacity-90" 
                  size="default"
                >
                  💰 Process Payroll
                </Button>
              </Link>
              <Link href="/admin/employees" className="w-full block">
                <Button 
                  variant="gradient" 
                  className="w-full justify-start text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:opacity-90" 
                  size="default"
                >
                  👤 Add Employee
                </Button>
              </Link>
              <Link href="/admin/reports" className="w-full block">
                <Button 
                  variant="gradient" 
                  className="w-full justify-start text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:opacity-90" 
                  size="default"
                >
                  📊 Generate Report
                </Button>
              </Link>
              <div className="h-6"></div>
              <Link href="/admin/timesheets" className="w-full block">
                <Button 
                  variant="gradient" 
                  className="w-full justify-start text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:opacity-90" 
                  size="default"
                >
                  ⏰ Approve Time Sheets
                </Button>
              </Link>
              <Link href="/admin/leaves" className="w-full block">
                <Button 
                  variant="gradient" 
                  className="w-full justify-start text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:opacity-90" 
                  size="default"
                >
                  📅 Manage Leave
                </Button>
              </Link>
              <Link href="/admin/tasks" className="w-full block">
                <Button 
                  variant="gradient" 
                  className="w-full justify-start text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:opacity-90" 
                  size="default"
                >
                  ✅ Manage Tasks
                </Button>
              </Link>
              <Link href="/admin/settings" className="w-full block">
                <Button 
                  variant="gradient" 
                  className="w-full justify-start text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:opacity-90" 
                  size="default"
                >
                  ⚙️ System Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown - Responsive */}
      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-lg sm:text-xl font-bold text-[#0F172A]">Department Breakdown</CardTitle>
            <Link href="/admin/departments">
              <Button variant="ghost" size="sm" className="text-[#2563EB] hover:text-[#1D4ED8] w-full sm:w-auto font-medium">
                View Details →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentBreakdown.departments.length === 0 ? (
              <div className="col-span-full text-center py-8 text-[#64748B]">
                <p className="text-sm">No departments found</p>
              </div>
            ) : (
              departmentBreakdown.departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-4 rounded-lg border border-slate-200 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm sm:text-base text-[#0F172A]">{dept.name}</h4>
                    <div className={`h-8 w-8 rounded-lg ${dept.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-[#64748B]">Employees</span>
                      <span className="font-semibold text-[#0F172A]">{dept.employees}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-[#64748B]">Annual Payroll</span>
                      <span className="font-semibold text-[#0F172A]">
                        {adminService.formatLargeCurrency(dept.payroll)}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`${dept.barColor} h-2 rounded-full transition-all`}
                          style={{ width: `${maxEmployees > 0 ? (dept.employees / maxEmployees) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
