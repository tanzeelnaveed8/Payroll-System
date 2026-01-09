"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { managerService } from "@/lib/services/managerService";
import { timesheetService } from "@/lib/services/timesheetService";
import { leaveService } from "@/lib/services/leaveService";

export default function ManagerApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [pendingTimesheets, setPendingTimesheets] = useState<any[]>([]);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState<any[]>([]);
  const [selectedTimesheetIds, setSelectedTimesheetIds] = useState<string[]>([]);
  const [selectedLeaveIds, setSelectedLeaveIds] = useState<string[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalType, setApprovalType] = useState<'timesheet' | 'leave'>('timesheet');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [timesheetsResult, leaveResult] = await Promise.all([
        managerService.getPendingTimesheets({ limit: 100 }),
        managerService.getPendingLeaveRequests({ limit: 100 }),
      ]);
      setPendingTimesheets(timesheetsResult.timesheets || []);
      setPendingLeaveRequests(leaveResult.leaveRequests || []);
    } catch (error: any) {
      console.error('Failed to load approvals:', error);
      alert(error?.message || 'Failed to load pending approvals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTimesheet = async (id: string) => {
    try {
      setActionLoading(id);
      await timesheetService.approveTimesheet(id, comment || undefined);
      setComment('');
      setShowApproveModal(false);
      setSelectedTimesheetIds([]);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to approve timesheet');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTimesheet = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading(id);
      await timesheetService.rejectTimesheet(id, rejectReason);
      setRejectReason('');
      setShowRejectModal(false);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to reject timesheet');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveLeave = async (id: string) => {
    try {
      setActionLoading(id);
      await leaveService.approveLeaveRequest(id, comment || undefined);
      setComment('');
      setShowApproveModal(false);
      setSelectedLeaveIds([]);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to approve leave request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectLeave = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading(id);
      await leaveService.rejectLeaveRequest(id, rejectReason);
      setRejectReason('');
      setShowRejectModal(false);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to reject leave request');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") return "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20";
    if (status === "pending" || status === "submitted") return "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20";
    if (status === "rejected") return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Pending Approvals</h1>
        <p className="text-sm sm:text-base text-[#64748B]">
          Review and approve timesheets and leave requests from your team
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">⏱️</div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-[#0F172A]">{pendingTimesheets.length}</p>
              <p className="text-sm text-[#64748B]">Pending Timesheets</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">🏖️</div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-[#0F172A]">{pendingLeaveRequests.length}</p>
              <p className="text-sm text-[#64748B]">Pending Leave Requests</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {pendingTimesheets.length > 0 && (
        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Pending Timesheets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Employee</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Hours</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTimesheets.map((ts: any) => (
                    <tr key={ts._id || ts.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {ts.employeeId?.name || ts.employeeName || 'Unknown'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[#64748B]">
                          {new Date(ts.date).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-[#0F172A]">{ts.hours || 0}h</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTimesheetIds([ts._id || ts.id]);
                              setApprovalType('timesheet');
                              setShowApproveModal(true);
                            }}
                            className="text-xs border-green-300 text-green-600 hover:bg-green-50"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTimesheetIds([ts._id || ts.id]);
                              setApprovalType('timesheet');
                              setShowRejectModal(true);
                            }}
                            className="text-xs border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {pendingLeaveRequests.length > 0 && (
        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Pending Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Employee</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Dates</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Days</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaveRequests.map((lr: any) => (
                    <tr key={lr._id || lr.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {lr.employeeId?.name || lr.employeeName || 'Unknown'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusBadge(lr.status)}>
                          {lr.leaveType}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[#64748B]">
                          {new Date(lr.startDate).toLocaleDateString()} - {new Date(lr.endDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-[#0F172A]">{lr.totalDays} days</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLeaveIds([lr._id || lr.id]);
                              setApprovalType('leave');
                              setShowApproveModal(true);
                            }}
                            className="text-xs border-green-300 text-green-600 hover:bg-green-50"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLeaveIds([lr._id || lr.id]);
                              setApprovalType('leave');
                              setShowRejectModal(true);
                            }}
                            className="text-xs border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {pendingTimesheets.length === 0 && pendingLeaveRequests.length === 0 && (
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-12 text-center">
            <p className="text-sm text-[#64748B] mb-2">No pending approvals</p>
            <p className="text-xs text-[#64748B]">All timesheets and leave requests have been reviewed</p>
          </CardContent>
        </Card>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4">Approve {approvalType === 'timesheet' ? 'Timesheet' : 'Leave Request'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Comments (Optional)</label>
                <Input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add approval comments"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="default"
                  onClick={() => {
                    if (approvalType === 'timesheet') {
                      handleApproveTimesheet(selectedTimesheetIds[0]);
                    } else {
                      handleApproveLeave(selectedLeaveIds[0]);
                    }
                  }}
                  disabled={actionLoading !== null}
                  className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white"
                >
                  {actionLoading ? 'Approving...' : 'Approve'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApproveModal(false);
                    setComment('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4">Reject {approvalType === 'timesheet' ? 'Timesheet' : 'Leave Request'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Rejection Reason *</label>
                <Input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="default"
                  onClick={() => {
                    if (approvalType === 'timesheet') {
                      handleRejectTimesheet(selectedTimesheetIds[0]);
                    } else {
                      handleRejectLeave(selectedLeaveIds[0]);
                    }
                  }}
                  disabled={actionLoading !== null || !rejectReason.trim()}
                  className="flex-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
