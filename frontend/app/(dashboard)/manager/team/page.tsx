"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { managerService } from "@/lib/services/managerService";
import type { TeamMember } from "@/lib/api/manager";

export default function ManagerTeamPage() {
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [dashboardData, setDashboardData] = useState({
    teamMembers: 0,
    directReports: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [team, approvals] = await Promise.all([
        managerService.getTeam(),
        managerService.getPendingApprovals(),
      ]);
      setTeamMembers(team);
      setDashboardData({
        teamMembers: team.length,
        directReports: team.length,
        pendingApprovals: approvals.total,
      });
    } catch (error: any) {
      console.error('Failed to load team data:', error);
      alert(error?.message || 'Failed to load team data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">My Team</h1>
        <p className="text-sm sm:text-base text-[#64748B]">
          Manage and monitor your team members
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-2xl font-bold text-[#0F172A] mb-1">{dashboardData.teamMembers}</p>
            <p className="text-sm text-[#64748B]">Total Team Members</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-2xl font-bold text-[#0F172A] mb-1">{dashboardData.directReports}</p>
            <p className="text-sm text-[#64748B]">Direct Reports</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">⏱️</span>
            </div>
            <p className="text-2xl font-bold text-[#0F172A] mb-1">{dashboardData.pendingApprovals}</p>
            <p className="text-sm text-[#64748B]">Pending Approvals</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]">
              <p className="text-sm">No team members found</p>
              <p className="text-xs mt-2">Team members will appear here when they are assigned to you as their manager</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Department</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr
                      key={member.id || member._id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-[#0F172A]">{member.name}</p>
                        <p className="text-xs text-[#64748B]">{member.email}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[#64748B]">{member.position || 'Employee'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[#64748B]">{member.department || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className={
                            member.status === "active"
                              ? "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20"
                              : member.status === "on-leave"
                              ? "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }
                        >
                          {member.status === "active" ? "Active" : member.status === "on-leave" ? "On Leave" : member.status || 'Active'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/manager/approvals?employeeId=${member.id || member._id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
                            >
                              View Approvals
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
