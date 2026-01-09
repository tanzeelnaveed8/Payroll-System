"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { employeeService, type LeaveRequest, type LeaveBalance } from "@/lib/services/employeeService";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function EmployeeLeavePage() {
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [requestData, setRequestData] = useState({
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [balance, result] = await Promise.all([
        employeeService.getLeaveBalance(),
        employeeService.getLeaveRequests(1, 100)
      ]);
      
      setLeaveBalances(balance);
      setLeaveHistory(result.leaveRequests);
    } catch (error: any) {
      console.error('Failed to load leave data:', error);
      alert(error.message || 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestData.type || !requestData.startDate || !requestData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await employeeService.createLeaveRequest({
        leaveType: requestData.type,
        startDate: requestData.startDate,
        endDate: requestData.endDate,
        reason: requestData.reason || undefined,
      });
      
      alert('Leave request submitted successfully');
      setShowRequestModal(false);
      setRequestData({ type: "", startDate: "", endDate: "", reason: "" });
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved")
      return "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20";
    if (status === "pending")
      return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
    return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20";
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      annual: 'Annual Leave',
      sick: 'Sick Leave',
      casual: 'Casual Leave',
      paid: 'Paid Leave',
      unpaid: 'Unpaid Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave',
    };
    return labels[type] || type;
  };

  const getBalanceData = () => {
    if (!leaveBalances) return [];
    
    const balances = [];
    if (leaveBalances.annual) {
      balances.push({
        type: 'Annual',
        total: leaveBalances.annual.total || 0,
        used: leaveBalances.annual.used || 0,
        remaining: leaveBalances.annual.remaining || 0,
      });
    }
    if (leaveBalances.sick) {
      balances.push({
        type: 'Sick',
        total: leaveBalances.sick.total || 0,
        used: leaveBalances.sick.used || 0,
        remaining: leaveBalances.sick.remaining || 0,
      });
    }
    if (leaveBalances.casual) {
      balances.push({
        type: 'Casual',
        total: leaveBalances.casual.total || 0,
        used: leaveBalances.casual.used || 0,
        remaining: leaveBalances.casual.remaining || 0,
      });
    }
    return balances;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const balanceData = getBalanceData();

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Leave Management</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            View your leave balance and request time off
          </p>
        </div>
        <Button
          variant="gradient"
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
          onClick={() => setShowRequestModal(true)}
        >
          Request Leave
        </Button>
      </div>

      {balanceData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {balanceData.map((balance, idx) => (
            <Card key={idx} className="border border-slate-200 bg-white">
              <CardContent className="p-6">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-[#0F172A] mb-1">{balance.type} Leave</p>
                  <p className="text-2xl font-bold text-[#0F172A]">
                    {balance.remaining} / {balance.total}
                  </p>
                  <p className="text-xs text-[#64748B]">days remaining</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] h-2 rounded-full transition-all"
                    style={{ width: `${balance.total > 0 ? (balance.remaining / balance.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-[#64748B] mt-2">{balance.used} days used</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          {leaveHistory.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]">
              <p className="text-sm mb-2">No leave requests found</p>
              <p className="text-xs">Submit your first leave request to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Dates</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Days</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveHistory.map((leave) => (
                    <tr
                      key={leave.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-[#0F172A]">{getLeaveTypeLabel(leave.leaveType)}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[#64748B]">
                          {new Date(leave.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          -{" "}
                          {new Date(leave.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-[#0F172A]">{leave.totalDays}</p>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusBadge(leave.status)}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border border-slate-200 bg-white">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Request Leave</CardTitle>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Leave Type <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={requestData.type}
                  onChange={(e) => setRequestData({ ...requestData, type: e.target.value })}
                  className="w-full h-12 rounded-xl border-2 border-[#2563EB]/30 bg-white px-4 py-3 text-sm text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:border-[#2563EB]"
                >
                  <option value="">Select leave type</option>
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="paid">Paid Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]">
                    Start Date <span className="text-[#DC2626]">*</span>
                  </label>
                  <Input
                    type="date"
                    value={requestData.startDate}
                    onChange={(e) => setRequestData({ ...requestData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]">
                    End Date <span className="text-[#DC2626]">*</span>
                  </label>
                  <Input
                    type="date"
                    value={requestData.endDate}
                    onChange={(e) => setRequestData({ ...requestData, endDate: e.target.value })}
                    min={requestData.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              {requestData.startDate && requestData.endDate && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-[#2563EB]">
                    Note: Total working days will be calculated automatically (excluding weekends)
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">Reason (Optional)</label>
                <textarea
                  value={requestData.reason}
                  onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
                  className="w-full min-h-[80px] rounded-xl border-2 border-[#2563EB]/30 bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:border-[#2563EB] transition-all"
                  placeholder="Brief reason for leave request"
                  maxLength={1000}
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="gradient"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                  onClick={handleSubmitRequest}
                  disabled={!requestData.type || !requestData.startDate || !requestData.endDate || submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-slate-200"
                  onClick={() => {
                    setShowRequestModal(false);
                    setRequestData({ type: "", startDate: "", endDate: "", reason: "" });
                  }}
                  disabled={submitting}
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
