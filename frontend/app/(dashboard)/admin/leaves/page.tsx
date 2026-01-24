"use client";

import { useState, useEffect } from "react";
import LeaveRequestTable from "@/components/leaves/LeaveRequestTable";
import LeaveFiltersComponent from "@/components/leaves/LeaveFilters";
import LeaveDetailModal from "@/components/leaves/LeaveDetailModal";
import ApprovalModal from "@/components/timesheets/ApprovalModal";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  leaveService,
  type LeaveRequest,
  type LeaveFilters,
  type LeaveSort,
} from "@/lib/services/leaveService";

export default function ManageLeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeaveFilters>({});
  const [sort, setSort] = useState<LeaveSort>({ field: "submittedDate", direction: "desc" });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalType, setApprovalType] = useState<"approve" | "reject" | "bulk-approve" | "bulk-reject" | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  const pageSize = 10;

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const fetchedDepartments = await leaveService.getDepartments();
        setDepartments(fetchedDepartments);
      } catch (err) {
        // Error handled silently - departments filter will be empty
      }
    };
    fetchDepartments();
  }, []);

  const loadLeaveRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await leaveService.getLeaveRequests(filters, sort, page, pageSize);
      setLeaveRequests(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to load leave requests. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, page]);

  const handleFilterChange = (newFilters: LeaveFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSort = (field: keyof LeaveRequest) => {
    setSort({
      field,
      direction: sort.field === field && sort.direction === "asc" ? "desc" : "asc",
    });
    setPage(1);
  };

  const handleViewDetails = async (id: string) => {
    try {
      const leave = await leaveService.getLeaveRequest(id);
      if (leave) {
        setSelectedLeave(leave);
        setDetailModalOpen(true);
      }
    } catch (err) {
      setError("Failed to load leave details.");
    }
  };

  const handleApprove = (id: string) => {
    setApprovalType("approve");
    setSelectedLeave(leaveRequests.find((lr) => lr.id === id) || null);
    setApprovalModalOpen(true);
  };

  const handleReject = (id: string) => {
    setApprovalType("reject");
    setSelectedLeave(leaveRequests.find((lr) => lr.id === id) || null);
    setApprovalModalOpen(true);
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    setApprovalType("bulk-approve");
    setApprovalModalOpen(true);
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) return;
    setApprovalType("bulk-reject");
    setApprovalModalOpen(true);
  };

  const handleModalSubmit = async (comment?: string) => {
    if (!approvalType) return;

    setActionLoading(approvalType);
    try {
      if (approvalType === "approve" && selectedLeave) {
        await leaveService.approveLeaveRequest(selectedLeave.id, comment);
      } else if (approvalType === "reject" && selectedLeave && comment) {
        await leaveService.rejectLeaveRequest(selectedLeave.id, comment);
      } else if (approvalType === "bulk-approve") {
        await leaveService.bulkApprove(selectedIds, comment);
      } else if (approvalType === "bulk-reject" && comment) {
        await leaveService.bulkReject(selectedIds, comment);
      }
      setApprovalModalOpen(false);
      setApprovalType(null);
      setSelectedLeave(null);
      setSelectedIds([]);
      setDetailModalOpen(false);
      await loadLeaveRequests();
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to process request. Please try again.";
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(leaveRequests.filter((lr) => lr.status === "pending").map((lr) => lr.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] mb-2">
            Manage Leave Requests
          </h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Review and manage employee leave requests
          </p>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="gradient"
              size="default"
              onClick={handleBulkApprove}
              disabled={actionLoading !== null}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
            >
              Approve Selected ({selectedIds.length})
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={handleBulkReject}
              disabled={actionLoading !== null}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Reject Selected ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      <LeaveFiltersComponent
        filters={filters}
        onFilterChange={handleFilterChange}
        departments={departments}
      />

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <LeaveRequestTable
        leaveRequests={leaveRequests}
        loading={loading}
        sort={sort}
        onSort={handleSort}
        onViewDetails={handleViewDetails}
        onApprove={handleApprove}
        onReject={handleReject}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        actionLoading={actionLoading}
        page={page}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      {selectedLeave && (
        <LeaveDetailModal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedLeave(null);
          }}
          leaveRequest={selectedLeave}
          onApprove={() => {
            setDetailModalOpen(false);
            handleApprove(selectedLeave.id);
          }}
          onReject={() => {
            setDetailModalOpen(false);
            handleReject(selectedLeave.id);
          }}
          loading={actionLoading !== null}
        />
      )}

      <ApprovalModal
        open={approvalModalOpen}
        onClose={() => {
          setApprovalModalOpen(false);
          setApprovalType(null);
          setSelectedLeave(null);
        }}
        type={approvalType}
        onSubmit={handleModalSubmit}
        loading={actionLoading !== null}
        timesheetCount={approvalType?.startsWith("bulk") ? selectedIds.length : 1}
      />
    </div>
  );
}
