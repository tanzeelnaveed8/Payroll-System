"use client";

import { useState } from "react";
import { PayrollPeriod } from "@/lib/services/payrollService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { payrollService } from "@/lib/services/payrollService";

interface PayrollDetailDrawerProps {
  period: PayrollPeriod | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const getStatusBadge = (status: PayrollPeriod["status"]) => {
  const styles: Record<PayrollPeriod["status"], string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    processing: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
    completed: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };
  return styles[status];
};

export default function PayrollDetailDrawer({
  period,
  isOpen,
  onClose,
  onRefresh,
}: PayrollDetailDrawerProps) {
  const [processing, setProcessing] = useState(false);
  
  if (!isOpen || !period) return null;

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await payrollService.processPayroll(period.id);
      alert("Payroll processed successfully");
      onRefresh?.();
      onClose();
    } catch (error: any) {
      alert(error.message || "Failed to process payroll");
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await payrollService.approvePayroll(period.id);
      alert("Payroll approved successfully");
      onRefresh?.();
      onClose();
    } catch (error: any) {
      alert(error.message || "Failed to approve payroll");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0F172A]">Payroll Period Details</h2>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
                {new Date(period.periodStart).toLocaleDateString()} -{" "}
                {new Date(period.periodEnd).toLocaleDateString()}
              </h3>
              <Badge className={cn("mt-2", getStatusBadge(period.status))}>
                {period.status.charAt(0).toUpperCase() + period.status.slice(1)}
              </Badge>
            </div>
          </div>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">Period Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Period Start</p>
                  <p className="text-sm font-medium text-[#0F172A]">
                    {new Date(period.periodStart).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Period End</p>
                  <p className="text-sm font-medium text-[#0F172A]">
                    {new Date(period.periodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Employee Count</p>
                  <p className="text-sm font-medium text-[#0F172A]">{period.employeeCount}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Total Amount</p>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {period.totalAmount && period.totalAmount > 0 ? formatCurrency(period.totalAmount) : "Not calculated"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">Status Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#16A34A]"></div>
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">
                      {period.status.charAt(0).toUpperCase() + period.status.slice(1)}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {period.status === "completed"
                        ? "Payroll processing completed"
                        : period.status === "processing"
                        ? "Payroll is currently being processed"
                        : "Payroll period is in draft status"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            {period.status === "completed" && (
              <Button
                variant="default"
                className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
              >
                Download Payslip Summary
              </Button>
            )}
            {period.status === "draft" && (
              <Button
                variant="default"
                className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                onClick={handleProcess}
                disabled={processing}
              >
                {processing ? "Processing..." : "Process Payroll"}
              </Button>
            )}
            {period.status === "processing" && (
              <Button
                variant="default"
                className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white"
                onClick={handleApprove}
                disabled={processing}
              >
                {processing ? "Approving..." : "Approve Payroll"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-200 text-[#64748B] hover:bg-slate-50"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}



