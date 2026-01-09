"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { timesheetService, type Timesheet } from "@/lib/services/timesheetService";

export default function AdminTimesheetsPage() {
  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    employeeName: '',
    department: '',
    role: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [timesheetData, deptData, roleData] = await Promise.all([
        timesheetService.getTimesheets({
          ...filters,
          limit: 100,
        }),
        timesheetService.getUniqueDepartments(),
        timesheetService.getUniqueRoles(),
      ]);
      setTimesheets(timesheetData);
      setDepartments(deptData);
      setRoles(roleData);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      alert(error.message || 'Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await timesheetService.approveTimesheet(id, comment || undefined);
      alert('Timesheet approved successfully');
      setComment('');
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to approve timesheet');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading(id);
      await timesheetService.rejectTimesheet(id, rejectReason);
      alert('Timesheet rejected successfully');
      setRejectReason('');
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to reject timesheet');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      alert('Please select timesheets to approve');
      return;
    }
    try {
      setActionLoading('bulk-approve');
      await timesheetService.bulkApproveTimesheets(selectedIds, comment || undefined);
      alert(`${selectedIds.length} timesheet(s) approved successfully`);
      setSelectedIds([]);
      setComment('');
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to approve timesheets');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) {
      alert('Please select timesheets to reject');
      return;
    }
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading('bulk-reject');
      await timesheetService.bulkRejectTimesheets(selectedIds, rejectReason);
      alert(`${selectedIds.length} timesheet(s) rejected successfully`);
      setSelectedIds([]);
      setRejectReason('');
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to reject timesheets');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved")
      return "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20";
    if (status === "submitted")
      return "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20";
    if (status === "rejected")
      return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const submittedTimesheets = timesheets.filter(ts => ts.status === 'submitted');
  const canSelect = (id: string) => {
    const ts = timesheets.find(t => t.id === id);
    return ts?.status === 'submitted';
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(submittedTimesheets.map(ts => ts.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Timesheet Management</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Review and manage employee timesheets
          </p>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => setShowApproveModal(true)}
              disabled={actionLoading !== null}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white"
            >
              Approve Selected ({selectedIds.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading !== null}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Reject Selected ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Employee Name</label>
              <Input
                type="text"
                value={filters.employeeName}
                onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })}
                placeholder="Search by name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Department</label>
              <Select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Role</label>
              <Select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Status</label>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Date From</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Date To</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Timesheets</CardTitle>
        </CardHeader>
        <CardContent>
          {timesheets.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]">
              <p className="text-sm">No timesheets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === submittedTimesheets.length && submittedTimesheets.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Employee</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Hours</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Regular</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Overtime</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Department</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheets.map((timesheet) => (
                    <tr
                      key={timesheet.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        {canSelect(timesheet.id) && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(timesheet.id)}
                            onChange={(e) => handleSelectOne(timesheet.id, e.target.checked)}
                            className="rounded"
                          />
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {timesheet.employeeName || 'Unknown'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[#64748B]">
                          {new Date(timesheet.date).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-[#0F172A]">{timesheet.hours}h</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[#64748B]">{timesheet.regularHours?.toFixed(1) || '0.0'}h</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[#64748B]">{timesheet.overtimeHours?.toFixed(1) || '0.0'}h</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[#64748B]">{timesheet.department || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusBadge(timesheet.status)}>
                          {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          {timesheet.status === 'submitted' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(timesheet.id)}
                                disabled={actionLoading === timesheet.id}
                                className="text-xs border-green-300 text-green-600 hover:bg-green-50"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowRejectModal(true);
                                  setSelectedIds([timesheet.id]);
                                }}
                                disabled={actionLoading === timesheet.id}
                                className="text-xs border-red-300 text-red-600 hover:bg-red-50"
                              >
                                Reject
                              </Button>
                            </>
                          )}
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

      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4">
              {selectedIds.length > 1 ? `Approve ${selectedIds.length} Timesheets` : 'Approve Timesheet'}
            </h2>
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
                  onClick={selectedIds.length > 1 ? handleBulkApprove : () => handleApprove(selectedIds[0])}
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
            <h2 className="text-xl font-bold text-[#0F172A] mb-4">
              {selectedIds.length > 1 ? `Reject ${selectedIds.length} Timesheets` : 'Reject Timesheet'}
            </h2>
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
                  onClick={selectedIds.length > 1 ? handleBulkReject : () => handleReject(selectedIds[0])}
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
