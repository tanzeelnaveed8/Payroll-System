"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { LeaveRequest, LeaveType } from "@/lib/services/leaveService";

interface LeaveDetailModalProps {
  open: boolean;
  onClose: () => void;
  leaveRequest: LeaveRequest;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}

export default function LeaveDetailModal({
  open,
  onClose,
  leaveRequest,
  onApprove,
  onReject,
  loading,
}: LeaveDetailModalProps) {
  if (!open) return null;

  const getStatusBadge = (status: LeaveRequest["status"]) => {
    const variants = {
      pending: { className: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20", label: "Pending" },
      approved: { className: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20", label: "Approved" },
      rejected: { className: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20", label: "Rejected" },
    };
    return <Badge className={variants[status].className} variant="outline">{variants[status].label}</Badge>;
  };

  const getLeaveTypeBadge = (type: LeaveType) => {
    const variants: Record<LeaveType, { className: string; label: string }> = {
      paid: { className: "bg-blue-100 text-blue-700 border-blue-200", label: "Paid" },
      unpaid: { className: "bg-slate-100 text-slate-700 border-slate-200", label: "Unpaid" },
      sick: { className: "bg-orange-100 text-orange-700 border-orange-200", label: "Sick" },
      annual: { className: "bg-purple-100 text-purple-700 border-purple-200", label: "Annual" },
      casual: { className: "bg-amber-100 text-amber-700 border-amber-200", label: "Casual" },
      maternity: { className: "bg-pink-100 text-pink-700 border-pink-200", label: "Maternity" },
      paternity: { className: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Paternity" },
      emergency: { className: "bg-red-100 text-red-700 border-red-200", label: "Emergency" },
    };
    return <Badge className={variants[type].className} variant="outline">{variants[type].label}</Badge>;
  };

  const isPending = leaveRequest.status === "pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <Card
        className="w-full max-w-2xl border border-slate-200 bg-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-[#0F172A]">Leave Request Details</CardTitle>
            <button
              onClick={onClose}
              className="text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Employee Profile Summary */}
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Employee Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#64748B] mb-1">Name</p>
                <p className="text-sm font-semibold text-[#0F172A]">{leaveRequest.employeeName}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Email</p>
                <p className="text-sm text-[#0F172A]">{leaveRequest.employeeEmail}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Department</p>
                <p className="text-sm text-[#0F172A]">{leaveRequest.employeeDepartment}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Role</p>
                <p className="text-sm text-[#0F172A]">{leaveRequest.employeeRole}</p>
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Leave Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#64748B] mb-1">Leave Type</p>
                <div className="mb-3">{getLeaveTypeBadge(leaveRequest.leaveType)}</div>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Status</p>
                <div className="mb-3">{getStatusBadge(leaveRequest.status)}</div>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Start Date</p>
                <p className="text-sm font-semibold text-[#0F172A]">
                  {new Date(leaveRequest.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">End Date</p>
                <p className="text-sm font-semibold text-[#0F172A]">
                  {new Date(leaveRequest.endDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Total Days</p>
                <p className="text-sm font-semibold text-[#0F172A]">{leaveRequest.totalDays} days</p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Submitted Date</p>
                <p className="text-sm text-[#0F172A]">
                  {new Date(leaveRequest.submittedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-[#64748B] mb-1">Reason</p>
              <p className="text-sm text-[#0F172A] bg-slate-50 p-3 rounded-lg">{leaveRequest.reason}</p>
            </div>
          </div>

          {/* Leave Balance Impact */}
          {leaveRequest.leaveBalanceBefore && leaveRequest.leaveBalanceAfter && (
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Leave Balance Impact</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Paid Leave</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm text-[#64748B] line-through">
                      {leaveRequest.leaveBalanceBefore.paid}
                    </p>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      → {leaveRequest.leaveBalanceAfter.paid}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Unpaid Leave</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm text-[#64748B] line-through">
                      {leaveRequest.leaveBalanceBefore.unpaid}
                    </p>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      → {leaveRequest.leaveBalanceAfter.unpaid}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Sick Leave</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm text-[#64748B] line-through">
                      {leaveRequest.leaveBalanceBefore.sick}
                    </p>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      → {leaveRequest.leaveBalanceAfter.sick}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Annual Leave</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm text-[#64748B] line-through">
                      {leaveRequest.leaveBalanceBefore.annual}
                    </p>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      → {leaveRequest.leaveBalanceAfter.annual}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Information */}
          {!isPending && (
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Review Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Reviewed By</p>
                  <p className="text-sm text-[#0F172A]">
                    {typeof leaveRequest.reviewedBy === 'object' 
                      ? leaveRequest.reviewedBy.name 
                      : leaveRequest.reviewedBy || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Reviewed Date</p>
                  <p className="text-sm text-[#0F172A]">
                    {leaveRequest.reviewedDate
                      ? new Date(leaveRequest.reviewedDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                {leaveRequest.comments && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-[#64748B] mb-1">Comments</p>
                    <p className="text-sm text-[#0F172A] bg-slate-50 p-3 rounded-lg">
                      {leaveRequest.comments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {isPending && (
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                size="default"
                onClick={onClose}
                disabled={loading}
                className="flex-1 border-slate-300 text-[#0F172A]"
              >
                Close
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={onReject}
                disabled={loading}
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                Reject
              </Button>
              <Button
                variant="gradient"
                size="default"
                onClick={onApprove}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                {loading ? "Processing..." : "Approve"}
              </Button>
            </div>
          )}

          {!isPending && (
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                size="default"
                onClick={onClose}
                className="border-slate-300 text-[#0F172A]"
              >
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




