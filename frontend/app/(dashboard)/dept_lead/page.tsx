"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

export default function DeptLeadDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    teamMembers: 0,
    departmentEmployees: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Implement API calls to fetch dept_lead dashboard data
      // For now, using placeholder data
      setDashboardData({
        teamMembers: 0,
        departmentEmployees: 0,
        pendingTasks: 0,
        completedTasks: 0,
      });
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    {
      label: "Department Employees",
      value: dashboardData.departmentEmployees.toString(),
      sublabel: "In your department",
      icon: "👥",
    },
    {
      label: "Pending Tasks",
      value: dashboardData.pendingTasks.toString(),
      sublabel: "Requires action",
      icon: "📋",
    },
    {
      label: "Completed Tasks",
      value: dashboardData.completedTasks.toString(),
      sublabel: "This period",
      icon: "✅",
    },
    {
      label: "Team Members",
      value: dashboardData.teamMembers.toString(),
      sublabel: "Active team",
      icon: "👤",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
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
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="fluid-h1 font-bold text-[#0F172A] mb-2">Welcome back, Department Lead</h1>
          <p className="fluid-body text-[#64748B]">
            Overview of your department and task assignments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
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
            <CardTitle className="text-lg font-bold text-[#0F172A]">Department Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#64748B]">
              Manage and view all employees in your department. Assign tasks, track progress, and monitor team performance.
            </p>
            <Link href="/dept_lead/team">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
              >
                View Team
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Task Management</CardTitle>
              <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20">
                {dashboardData.pendingTasks} Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#0F172A]">Pending Tasks</span>
                <span className="text-sm font-semibold text-[#0F172A]">{dashboardData.pendingTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#0F172A]">Completed Tasks</span>
                <span className="text-sm font-semibold text-[#0F172A]">{dashboardData.completedTasks}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/dept_lead/tasks" className="w-full">
                <Button
                  variant="gradient"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:opacity-90"
                >
                  Manage Tasks
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
