"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { LeaveRequest, LeaveSort } from "@/lib/services/leaveService";

interface LeaveRequestTableProps {
  leaveRequests: LeaveRequest[];
  loading: boolean;
  sort: LeaveSort;
  onSort: (field: keyof LeaveRequest) => void;
  onViewDetails: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  actionLoading: string | null;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function LeaveRequestTable({
  leaveRequests,
  loading,
  sort,
  onSort,
  onViewDetails,
  onApprove,
  onReject,
  selectedIds,
  onSelectAll,
  onSelectOne,
  actionLoading,
  page,
  total,
  pageSize,
  onPageChange,
}: LeaveRequestTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const getStatusBadge = (status: LeaveRequest["status"]) => {
    const variants = {
      pending: { className: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20", label: "Pending" },
      approved: { className: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20", label: "Approved" },
      rejected: { className: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20", label: "Rejected" },
    };
    const variant = variants[status];
    return (
      <Badge className={variant.className} variant="outline">
        {variant.label}
      </Badge>
    );
  };

  const getLeaveTypeBadge = (type: LeaveRequest["leaveType"]) => {
    const variants = {
      paid: { className: "bg-blue-100 text-blue-700 border-blue-200", label: "Paid" },
      unpaid: { className: "bg-slate-100 text-slate-700 border-slate-200", label: "Unpaid" },
      sick: { className: "bg-orange-100 text-orange-700 border-orange-200", label: "Sick" },
      annual: { className: "bg-purple-100 text-purple-700 border-purple-200", label: "Annual" },
    };
    const variant = variants[type];
    return (
      <Badge className={variant.className} variant="outline">
        {variant.label}
      </Badge>
    );
  };

  const SortIcon = ({ field }: { field: keyof LeaveRequest }) => {
    if (sort.field !== field) {
      return (
        <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sort.direction === "asc" ? (
      <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const totalPages = Math.ceil(total / pageSize);
  const pendingCount = leaveRequests.filter((lr) => lr.status === "pending").length;
  const allPendingSelected = pendingCount > 0 && selectedIds.length === pendingCount;

  if (loading && leaveRequests.length === 0) {
    return (
      <div className="border border-slate-200 bg-white rounded-lg p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
        <p className="mt-4 text-[#64748B]">Loading leave requests...</p>
      </div>
    );
  }

  if (!loading && leaveRequests.length === 0) {
    return (
      <div className="border border-slate-200 bg-white rounded-lg p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-[#0F172A]">No leave requests found</h3>
        <p className="mt-2 text-sm text-[#64748B]">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 bg-white rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allPendingSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] cursor-pointer hover:bg-slate-100"
                onClick={() => onSort("employeeName")}
              >
                <div className="flex items-center gap-2">
                  Employee
                  <SortIcon field="employeeName" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] cursor-pointer hover:bg-slate-100"
                onClick={() => onSort("employeeDepartment")}
              >
                <div className="flex items-center gap-2">
                  Department
                  <SortIcon field="employeeDepartment" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] cursor-pointer hover:bg-slate-100"
                onClick={() => onSort("leaveType")}
              >
                <div className="flex items-center gap-2">
                  Leave Type
                  <SortIcon field="leaveType" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] cursor-pointer hover:bg-slate-100"
                onClick={() => onSort("startDate")}
              >
                <div className="flex items-center gap-2">
                  Date Range
                  <SortIcon field="startDate" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A]">Days</th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] cursor-pointer hover:bg-slate-100"
                onClick={() => onSort("status")}
              >
                <div className="flex items-center gap-2">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leaveRequests.map((request) => {
              const isSelected = selectedIds.includes(request.id);
              const isPending = request.status === "pending";
              const isLoading = actionLoading === request.id;

              return (
                <tr
                  key={request.id}
                  className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                    hoveredRow === request.id ? "bg-slate-50" : ""
                  }`}
                  onMouseEnter={() => setHoveredRow(request.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onViewDetails(request.id)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectOne(request.id, e.target.checked)}
                        className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-sm text-[#0F172A]">{request.employeeName}</div>
                    <div className="text-xs text-[#64748B]">{request.employeeRole}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#0F172A]">{request.employeeDepartment}</td>
                  <td className="px-4 py-3">{getLeaveTypeBadge(request.leaveType)}</td>
                  <td className="px-4 py-3 text-sm text-[#0F172A]">
                    <div>{new Date(request.startDate).toLocaleDateString()}</div>
                    <div className="text-xs text-[#64748B]">to {new Date(request.endDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#0F172A]">{request.totalDays} days</td>
                  <td className="px-4 py-3">{getStatusBadge(request.status)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {isPending && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onApprove(request.id)}
                          disabled={isLoading}
                          className="border-green-300 text-green-600 hover:bg-green-50 text-xs px-2 py-1"
                        >
                          {isLoading ? "..." : "Approve"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReject(request.id)}
                          disabled={isLoading}
                          className="border-red-300 text-red-600 hover:bg-red-50 text-xs px-2 py-1"
                        >
                          {isLoading ? "..." : "Reject"}
                        </Button>
                      </div>
                    )}
                    {!isPending && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(request.id)}
                        className="text-[#2563EB] hover:text-[#1D4ED8] text-xs"
                      >
                        View
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-slate-100">
        {leaveRequests.map((request) => {
          const isSelected = selectedIds.includes(request.id);
          const isPending = request.status === "pending";
          const isLoading = actionLoading === request.id;

          return (
            <div
              key={request.id}
              className="p-4 hover:bg-slate-50 transition-colors"
              onClick={() => onViewDetails(request.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelectOne(request.id, e.target.checked);
                        }}
                        className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                    )}
                    <h3 className="font-semibold text-sm text-[#0F172A]">{request.employeeName}</h3>
                  </div>
                  <p className="text-xs text-[#64748B]">{request.employeeRole} • {request.employeeDepartment}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(request.status)}
                  {getLeaveTypeBadge(request.leaveType)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Date Range</p>
                  <p className="text-[#0F172A] text-xs">
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Total Days</p>
                  <p className="font-semibold text-[#0F172A]">{request.totalDays} days</p>
                </div>
              </div>

              {isPending && (
                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApprove(request.id)}
                    disabled={isLoading}
                    className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                  >
                    {isLoading ? "..." : "Approve"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReject(request.id)}
                    disabled={isLoading}
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {isLoading ? "..." : "Reject"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-[#64748B]">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="border-slate-300 text-[#0F172A]"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className={
                      page === pageNum
                        ? "bg-[#2563EB] text-white"
                        : "border-slate-300 text-[#0F172A]"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="border-slate-300 text-[#0F172A]"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}




