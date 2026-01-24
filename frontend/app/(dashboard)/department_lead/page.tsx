"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { taskService, type Task } from "@/lib/services/taskService";
import { deptLeadService } from "@/lib/services/deptLeadService";
import { toast } from "@/lib/hooks/useToast";

export default function DepartmentLeadDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState({
    departmentEmployees: 0,
    activeTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    teamPerformance: 0,
    timesheetsPending: 0,
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "Department Lead";

  useEffect(() => {
    // Add a small delay to ensure auth context is ready
    const timer = setTimeout(() => {
      loadDashboard();
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard data from dedicated endpoint
      const dashboardData = await deptLeadService.getDashboard();
      
      // Fetch recent tasks for display
      let tasks: Task[] = [];
      try {
        const tasksResult = await taskService.getTasks({}, { field: "assignedDate", direction: "desc" }, 1, 10);
        tasks = Array.isArray(tasksResult?.data) ? tasksResult.data : [];
      } catch (taskError: any) {
        // Tasks failed to load, using empty array
        tasks = [];
      }

      setDashboardData({
        departmentEmployees: dashboardData.departmentEmployees,
        activeTasks: dashboardData.activeTasks,
        pendingTasks: dashboardData.pendingTasks,
        completedTasks: dashboardData.completedTasks,
        inProgressTasks: dashboardData.inProgressTasks,
        overdueTasks: dashboardData.overdueTasks,
        teamPerformance: dashboardData.teamPerformance,
        timesheetsPending: dashboardData.timesheetsPending,
      });
      
      setRecentTasks(tasks.slice(0, 5));
      setError(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
      // Set default values on error
      setDashboardData({
        departmentEmployees: 0,
        activeTasks: 0,
        pendingTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        teamPerformance: 0,
        timesheetsPending: 0,
      });
      setRecentTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    {
      label: "Department Employees",
      value: dashboardData.departmentEmployees.toString(),
      sublabel: "Active in department",
      icon: "👥",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "Active Tasks",
      value: dashboardData.activeTasks.toString(),
      sublabel: "Total assigned",
      icon: "📋",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      label: "Pending Tasks",
      value: dashboardData.pendingTasks.toString(),
      sublabel: "Requires action",
      icon: "⏳",
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      label: "Completed Tasks",
      value: dashboardData.completedTasks.toString(),
      sublabel: "This period",
      icon: "✅",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      label: "In Progress",
      value: dashboardData.inProgressTasks.toString(),
      sublabel: "Currently working",
      icon: "⚡",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
    {
      label: "Overdue Tasks",
      value: dashboardData.overdueTasks.toString(),
      sublabel: "Needs attention",
      icon: "⚠️",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
  ];

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
  if (!user && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-[#64748B] mb-4">Please log in to view your dashboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {error && (
        <div className="p-4 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20">
          <p className="text-sm text-[#DC2626]">{error}</p>
        </div>
      )}
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] mb-2">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-[#64748B]">
            Manage your department team, tasks, and track performance metrics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Link href="/department_lead/tasks">
            <Button 
              variant="gradient" 
              size="default"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-semibold">Assign Task</span>
            </Button>
          </Link>
          <Link href="/department_lead/reports">
            <Button 
              variant="outline" 
              size="default"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#2563EB] font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>View Reports</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => (
          <Card
            key={idx}
            className="border border-slate-200 bg-white hover:shadow-xl transition-all duration-300 cursor-default group"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{kpi.icon}</span>
                </div>
                <div className="h-2 w-2 rounded-full bg-[#2563EB] animate-pulse"></div>
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Performance Card */}
        <Card className="border border-slate-200 bg-white lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Team Performance Overview</CardTitle>
              <Link href="/department_lead/team">
                <Button variant="ghost" size="sm" className="text-[#2563EB] hover:text-[#1D4ED8]">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div>
                <p className="text-sm text-[#64748B] mb-1">Overall Completion Rate</p>
                <p className="text-3xl font-bold text-[#0F172A]">{dashboardData.teamPerformance}%</p>
              </div>
              <div className="w-24 h-24 relative">
                <svg className="w-24 h-24 transform -rotate-90">
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-[#2563EB]">{dashboardData.teamPerformance}%</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-[#0F172A]">{dashboardData.pendingTasks}</p>
                <p className="text-xs text-[#64748B] mt-1">Pending</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-[#2563EB]">{dashboardData.inProgressTasks}</p>
                <p className="text-xs text-[#64748B] mt-1">In Progress</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-[#16A34A]">{dashboardData.completedTasks}</p>
                <p className="text-xs text-[#64748B] mt-1">Completed</p>
              </div>
            </div>
            <Link href="/department_lead/team">
              <Button
                variant="outline"
                className="w-full border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
              >
                Manage Team
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-[#0F172A]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Link href="/department_lead/tasks" className="block">
              <button
                className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-600 text-[#1E3A8A] font-semibold rounded-xl shadow-md hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ease-in-out border-0"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-base font-bold">Assign New Task</span>
              </button>
            </Link>
            <Link href="/department_lead/team" className="block">
              <button
                className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-600 text-[#1E3A8A] font-semibold rounded-xl shadow-md hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ease-in-out border-0"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-base font-bold">View Team</span>
              </button>
            </Link>
            <Link href="/department_lead/timesheets" className="block">
              <button
                className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-600 text-[#1E3A8A] font-semibold rounded-xl shadow-md hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ease-in-out border-0"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-base font-bold">Review Timesheets</span>
              </button>
            </Link>
            <Link href="/department_lead/reports" className="block">
              <button
                className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-600 text-[#1E3A8A] font-semibold rounded-xl shadow-md hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ease-in-out border-0"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-base font-bold">View Reports</span>
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-[#0F172A] mb-1">Recent Tasks</CardTitle>
              <p className="text-sm text-[#64748B]">Track and manage your department&apos;s active tasks</p>
            </div>
            <Link href="/department_lead/tasks">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[#2563EB] hover:text-[#1D4ED8] hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                View All Tasks
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <div className="text-center py-16 text-[#64748B]">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-base font-semibold mb-2 text-[#0F172A]">No tasks found</p>
              <p className="text-sm">Tasks assigned to your department will appear here</p>
            </div>
          ) : (
            <div className="space-y-5">
              {recentTasks.map((task) => (
                <Link 
                  key={task.id} 
                  href={`/department_lead/tasks/${task.id}`}
                  className="block"
                >
                  <div className="group relative p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
                    {/* Gradient accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        {/* Title and Badges Row */}
                        <div className="flex items-start gap-3 mb-3 flex-wrap">
                          <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors duration-200 flex-shrink-0">
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${getStatusColor(task.status)} font-semibold text-xs px-2.5 py-1 border`}>
                              {task.status}
                            </Badge>
                            <Badge className={`${getPriorityColor(task.priority)} font-semibold text-xs px-2.5 py-1 border`}>
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
                            <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">{task.employeeName || "Unassigned"}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-[#64748B] bg-slate-50 px-3 py-1.5 rounded-lg">
                            <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                          
                          {task.progress !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-[#64748B] bg-slate-50 px-3 py-1.5 rounded-lg">
                              <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <span className="font-medium">{task.progress}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Arrow Icon */}
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 group-hover:bg-blue-100 transition-colors duration-200">
                        <svg className="w-5 h-5 text-[#64748B] group-hover:text-[#2563EB] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
