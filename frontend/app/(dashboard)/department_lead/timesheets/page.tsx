"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { timesheetService, type Timesheet, type TimesheetStatus, type TimesheetFilter } from "@/lib/services/timesheetService";
import { toast } from "@/lib/hooks/useToast";

export default function DepartmentLeadTimesheetsPage() {
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const filterParams: TimesheetFilter = {
          employeeName: filters.employeeName || undefined,
          department: filters.department || undefined,
          role: filters.role || undefined,
          status: filters.status ? (filters.status as TimesheetStatus) : undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          limit: 100,
        };
      const [timesheetData, deptData, roleData] = await Promise.all([
        timesheetService.getTimesheets(filterParams),
        timesheetService.getUniqueDepartments(),
        timesheetService.getUniqueRoles(),
      ]);
      setTimesheets(timesheetData);
      setDepartments(deptData);
      setRoles(roleData);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load timesheets';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await timesheetService.approveTimesheet(id, comment || undefined);
      toast.success('Timesheet approved successfully');
      setComment('');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve timesheet');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.warning('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading(id);
      await timesheetService.rejectTimesheet(id, rejectReason);
      toast.success('Timesheet rejected successfully');
      setRejectReason('');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject timesheet');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      toast.warning('Please select timesheets to approve');
      return;
    }
    try {
      setActionLoading('bulk-approve');
      await timesheetService.bulkApproveTimesheets(selectedIds, comment || undefined);
      toast.success(`${selectedIds.length} timesheet(s) approved successfully`);
      setSelectedIds([]);
      setComment('');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve timesheets');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) {
      toast.warning('Please select timesheets to reject');
      return;
    }
    if (!rejectReason.trim()) {
      toast.warning('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading('bulk-reject');
      await timesheetService.bulkRejectTimesheets(selectedIds, rejectReason);
      toast.success(`${selectedIds.length} timesheet(s) rejected successfully`);
      setSelectedIds([]);
      setRejectReason('');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject timesheets');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved")
      return "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 font-semibold";
    if (status === "submitted")
      return "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 font-semibold";
    if (status === "rejected")
      return "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200 font-semibold";
    return "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border border-slate-200 font-semibold";
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

  const stats = {
    total: timesheets.length,
    submitted: submittedTimesheets.length,
    approved: timesheets.filter(ts => ts.status === 'approved').length,
    rejected: timesheets.filter(ts => ts.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">
            Department Timesheets
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Review and manage timesheets for your department
          </p>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex gap-3">
            <Button
              variant="default"
              onClick={() => setShowApproveModal(true)}
              disabled={actionLoading !== null}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 font-semibold px-6 py-2.5"
            >
              Approve Selected ({selectedIds.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading !== null}
              className="border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-semibold px-6 py-2.5 transition-all duration-200"
            >
              Reject Selected ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total Timesheets</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-gradient-to-br from-white to-blue-50 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Pending Review</p>
                <p className="text-2xl font-bold text-blue-700">{stats.submitted}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-gradient-to-br from-white to-green-50 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Approved</p>
                <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-gradient-to-br from-white to-red-50 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Rejected</p>
                <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Employee Name</label>
              <Input
                type="text"
                value={filters.employeeName}
                onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })}
                placeholder="Search by name"
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
              <Select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
              <Select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date From</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date To</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Timesheets
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {timesheets.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium text-slate-700 mb-1">No timesheets found</p>
              <p className="text-sm text-slate-500">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b-2 border-slate-200">
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === submittedTimesheets.length && submittedTimesheets.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Employee</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Date</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Hours</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Regular</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Overtime</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Department</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheets.map((timesheet) => (
                    <tr
                      key={timesheet.id}
                      className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-150"
                    >
                      <td className="py-4 px-6">
                        {canSelect(timesheet.id) && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(timesheet.id)}
                            onChange={(e) => handleSelectOne(timesheet.id, e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-semibold text-slate-900">
                          {timesheet.employeeName || 'Unknown'}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600">
                          {new Date(timesheet.date).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-semibold text-slate-900">{timesheet.hours}h</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600">{timesheet.regularHours?.toFixed(1) || '0.0'}h</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600">{timesheet.overtimeHours?.toFixed(1) || '0.0'}h</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600">{timesheet.department || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={`${getStatusBadge(timesheet.status)} px-3 py-1`}>
                          {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          {timesheet.status === 'submitted' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(timesheet.id)}
                                disabled={actionLoading === timesheet.id}
                                className="text-xs border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 font-semibold transition-all duration-200"
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
                                className="text-xs border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 font-semibold transition-all duration-200"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
              {selectedIds.length > 1 ? `Approve ${selectedIds.length} Timesheets` : 'Approve Timesheet'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Comments (Optional)</label>
                <Input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add approval comments"
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="default"
                  onClick={selectedIds.length > 1 ? handleBulkApprove : () => handleApprove(selectedIds[0])}
                  disabled={actionLoading !== null}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 font-semibold"
                >
                  {actionLoading ? 'Approving...' : 'Approve'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApproveModal(false);
                    setComment('');
                  }}
                  className="flex-1 border-slate-300 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
              {selectedIds.length > 1 ? `Reject ${selectedIds.length} Timesheets` : 'Reject Timesheet'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Rejection Reason *</label>
                <Input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason"
                  required
                  className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="default"
                  onClick={selectedIds.length > 1 ? handleBulkReject : () => handleReject(selectedIds[0])}
                  disabled={actionLoading !== null || !rejectReason.trim()}
                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/30 font-semibold"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="flex-1 border-slate-300 hover:bg-slate-50 font-semibold"
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
