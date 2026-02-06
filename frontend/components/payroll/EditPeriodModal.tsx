"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { payrollService, type PayrollPeriod } from "@/lib/services/payrollService";

interface EditPeriodModalProps {
  isOpen: boolean;
  period: PayrollPeriod | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPeriodModal({ isOpen, period, onClose, onSuccess }: EditPeriodModalProps) {
  const [formData, setFormData] = useState({
    periodStart: "",
    periodEnd: "",
    payDate: "",
    employeeCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && period) {
      setFormData({
        periodStart: period.periodStart ? new Date(period.periodStart).toISOString().split("T")[0] : "",
        periodEnd: period.periodEnd ? new Date(period.periodEnd).toISOString().split("T")[0] : "",
        payDate: period.payDate ? new Date(period.payDate).toISOString().split("T")[0] : "",
        employeeCount: period.employeeCount || 0,
      });
      setError(null);
    }
  }, [isOpen, period]);

  if (!isOpen || !period) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate dates
    const start = new Date(formData.periodStart);
    const end = new Date(formData.periodEnd);
    const pay = new Date(formData.payDate);

    if (start >= end) {
      setError("Period end date must be after period start date");
      return;
    }

    if (pay <= end) {
      setError("Pay date must be after period end date");
      return;
    }

    if (formData.employeeCount < 0) {
      setError("Employee count cannot be negative");
      return;
    }

    // Prevent editing completed periods
    if (period.status === 'completed') {
      setError("Cannot edit a completed payroll period. Please create a new period instead.");
      return;
    }

    try {
      setLoading(true);
      await payrollService.updatePayrollPeriod(period.id, {
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        payDate: formData.payDate,
        employeeCount: formData.employeeCount,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update payroll period. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#0F172A]">Edit Payroll Period</h2>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0F172A]">
                Period Start Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0F172A]">
                Period End Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.periodEnd}
                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0F172A]">
                Pay Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.payDate}
                onChange={(e) => setFormData({ ...formData, payDate: e.target.value })}
                required
                className="w-full"
              />
              <p className="text-xs text-[#64748B]">
                The date when employees will receive payment (must be after period end)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0F172A]">
                Employee Count <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                value={formData.employeeCount}
                onChange={(e) => setFormData({ ...formData, employeeCount: parseInt(e.target.value) || 0 })}
                required
                className="w-full"
              />
              <p className="text-xs text-[#64748B]">
                Number of employees in this payroll period
              </p>
            </div>

            {period.status === 'completed' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                This period is completed and cannot be edited. Create a new period instead.
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 sm:px-6 h-10 sm:h-11 border-2 border-[#F59E0B]/40 text-[#92400E] bg-[#FEF3C7] hover:bg-[#FDE68A] hover:border-[#F59E0B]/80 font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                type="submit"
                disabled={loading || period.status === 'completed'}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white disabled:opacity-50 h-10 sm:h-11 px-4 sm:px-6"
              >
                {loading ? "Updating..." : "Update Period"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


