"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { payrollService } from "@/lib/services/payrollService";

interface CreatePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePeriodModal({ isOpen, onClose, onSuccess }: CreatePeriodModalProps) {
  const [formData, setFormData] = useState({
    periodStart: "",
    periodEnd: "",
    payDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-fill with default values (current month)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const payDate = new Date(now.getFullYear(), now.getMonth() + 1, 5); // 5th of next month

      setFormData({
        periodStart: startOfMonth.toISOString().split("T")[0],
        periodEnd: endOfMonth.toISOString().split("T")[0],
        payDate: payDate.toISOString().split("T")[0],
      });
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

    try {
      setLoading(true);
      await payrollService.createPayrollPeriod({
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        payDate: formData.payDate,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create payroll period. Please try again.");
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
            <h2 className="text-xl font-bold text-[#0F172A]">Create Payroll Period</h2>
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
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white h-10 sm:h-11 px-4 sm:px-6"
              >
                {loading ? "Creating..." : "Create Period"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


