"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { Timesheet, TimesheetSort } from "@/lib/services/timesheetService";

interface TimeSheetTableProps {
  timeSheets: Timesheet[];
  loading: boolean;
  sort: TimesheetSort;
  onSort: (field: keyof Timesheet) => void;
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

export default function TimeSheetTable({
  timeSheets,
  loading,
  sort,
  onSort,
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
}: TimeSheetTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const getStatusBadge = (status: Timesheet["status"]) => {
    const variants: Record<Timesheet["status"], { className: string; label: string }> = {
      draft: { className: "bg-slate-100 text-slate-700 border-slate-200", label: "Draft" },
      submitted: { className: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20", label: "Submitted" },
      approved: { className: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20", label: "Approved" },
      rejected: { className: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20", label: "Rejected" },
    };
    const variant = variants[status] || variants.draft;
    return (
      <Badge className={variant.className} variant="outline">
        {variant.label}
      </Badge>
    );
  };

  const SortIcon = ({ field }: { field: keyof Timesheet }) => {
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
  const pendingCount = timeSheets.filter((ts) => ts.status === "submitted").length;
  const allPendingSelected = pendingCount > 0 && selectedIds.length === pendingCount;

  if (loading && timeSheets.length === 0) {
    return (
      <div className="border border-slate-200 bg-white rounded-lg p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
        <p className="mt-4 text-[#64748B]">Loading time sheets...</p>
      </div>
    );
  }

  if (!loading && timeSheets.length === 0) {
    return (
      <div className="border border-slate-200 bg-white rounded-lg p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-[#0F172A]">No time sheets found</h3>
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
                onClick={() => onSort("role")}
              >
                <div className="flex items-center gap-2">
                  Role
                  <SortIcon field="role" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] cursor-pointer hover:bg-slate-100"
                onClick={() => onSort("date")}
              >
                <div className="flex items-center gap-2">
                  Date
                  <SortIcon field="date" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A]">Clock-in</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A]">Clock-out</th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] cursor-pointer hover:bg-slate-100"
                onClick={() => onSort("hours")}
              >
                <div className="flex items-center gap-2">
                  Total Hours
                  <SortIcon field="hours" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A]">Overtime</th>
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
            {timeSheets.map((timesheet) => {
              const isSelected = selectedIds.includes(timesheet.id);
              const isPending = timesheet.status === "submitted";
              const isLoading = actionLoading === timesheet.id;

              return (
                <tr
                  key={timesheet.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    hoveredRow === timesheet.id ? "bg-slate-50" : ""
                  }`}
                  onMouseEnter={() => setHoveredRow(timesheet.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="px-4 py-3">
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectOne(timesheet.id, e.target.checked)}
                        className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-sm text-[#0F172A]">{timesheet.employeeName}</div>
                    <div className="text-xs text-[#64748B]">{timesheet.department}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#0F172A]">{timesheet.role}</td>
                  <td className="px-4 py-3 text-sm text-[#0F172A]">
                    {new Date(timesheet.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#0F172A]">{timesheet.clockIn}</td>
                  <td className="px-4 py-3 text-sm text-[#0F172A]">{timesheet.clockOut}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#0F172A]">{timesheet.hours}h</td>
                  <td className="px-4 py-3 text-sm text-[#0F172A]">
                    {(timesheet.overtimeHours || 0) > 0 ? (
                      <span className="text-[#F59E0B] font-semibold">+{timesheet.overtimeHours}h</span>
                    ) : (
                      <span className="text-[#64748B]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(timesheet.status)}</td>
                  <td className="px-4 py-3">
                    {isPending && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onApprove(timesheet.id)}
                          disabled={isLoading}
                          className="border-green-300 text-green-600 hover:bg-green-50 text-xs px-2 py-1"
                        >
                          {isLoading ? "..." : "Approve"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReject(timesheet.id)}
                          disabled={isLoading}
                          className="border-red-300 text-red-600 hover:bg-red-50 text-xs px-2 py-1"
                        >
                          {isLoading ? "..." : "Reject"}
                        </Button>
                      </div>
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
        {timeSheets.map((timesheet) => {
          const isSelected = selectedIds.includes(timesheet.id);
          const isPending = timesheet.status === "submitted";
          const isLoading = actionLoading === timesheet.id;

          return (
            <div
              key={timesheet.id}
              className="p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectOne(timesheet.id, e.target.checked)}
                        className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                    )}
                    <h3 className="font-semibold text-sm text-[#0F172A]">{timesheet.employeeName}</h3>
                  </div>
                  <p className="text-xs text-[#64748B]">{timesheet.role} • {timesheet.department}</p>
                </div>
                {getStatusBadge(timesheet.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Date</p>
                  <p className="text-[#0F172A]">{new Date(timesheet.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Total Hours</p>
                  <p className="font-semibold text-[#0F172A]">{timesheet.hours}h</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Clock-in</p>
                  <p className="text-[#0F172A]">{timesheet.clockIn}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Clock-out</p>
                  <p className="text-[#0F172A]">{timesheet.clockOut}</p>
                </div>
                {(timesheet.overtimeHours || 0) > 0 && (
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Overtime</p>
                    <p className="text-[#F59E0B] font-semibold">+{timesheet.overtimeHours}h</p>
                  </div>
                )}
              </div>

              {isPending && (
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApprove(timesheet.id)}
                    disabled={isLoading}
                    className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                  >
                    {isLoading ? "..." : "Approve"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReject(timesheet.id)}
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




