"use client";

import { PayrollPeriod } from "@/lib/services/payrollService";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface PayrollPeriodTableProps {
  periods: PayrollPeriod[];
  onViewPeriod?: (period: PayrollPeriod) => void;
  onEditPeriod?: (period: PayrollPeriod) => void;
  onDownloadPeriod?: (period: PayrollPeriod) => void;
}

const getStatusBadge = (status: PayrollPeriod["status"]) => {
  const styles: Record<PayrollPeriod["status"], string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    processing: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
    completed: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
    cancelled: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20",
  };
  return styles[status];
};

export default function PayrollPeriodTable({ periods, onViewPeriod, onEditPeriod, onDownloadPeriod }: PayrollPeriodTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount).replace('PKR', 'Rs');
  };

  return (
    <div className="w-full">
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Employees
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {periods.map((period) => (
              <tr key={period.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-[#0F172A]">
                    {new Date(period.periodStart).toLocaleDateString()} -{" "}
                    {new Date(period.periodEnd).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F172A]">
                  {period.employeeCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#0F172A]">
                  {(period.totalAmount || 0) > 0 ? formatCurrency(period.totalAmount || 0) : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={getStatusBadge(period.status)}>
                    {period.status.charAt(0).toUpperCase() + period.status.slice(1)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewPeriod?.(period)}
                      className="h-9 px-4 border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
                    >
                      View
                    </Button>
                    {period.status !== "completed" && onEditPeriod && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditPeriod(period)}
                        className="h-9 px-4 border-[#F59E0B]/20 text-[#F59E0B] hover:bg-[#F59E0B]/5"
                      >
                        Edit
                      </Button>
                    )}
                    {period.status === "completed" && onDownloadPeriod && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownloadPeriod(period)}
                        className="h-9 px-4 border-slate-200 text-[#64748B] hover:bg-slate-50"
                      >
                        Download
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {periods.map((period) => (
          <div key={period.id} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">
                  {new Date(period.periodStart).toLocaleDateString()} -{" "}
                  {new Date(period.periodEnd).toLocaleDateString()}
                </h3>
              </div>
              <Badge className={getStatusBadge(period.status)}>
                {period.status.charAt(0).toUpperCase() + period.status.slice(1)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-[#64748B] mb-3">
              <div>
                <span className="font-medium text-[#0F172A]">Employees:</span> {period.employeeCount}
              </div>
              <div>
                <span className="font-medium text-[#0F172A]">Amount:</span>{" "}
                {(period.totalAmount || 0) > 0
                  ? new Intl.NumberFormat("en-PK", {
                      style: "currency",
                      currency: "PKR",
                      minimumFractionDigits: 0,
                    }).format(period.totalAmount || 0).replace('PKR', 'Rs')
                  : "-"}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewPeriod?.(period)}
                className="flex-1 border-[#2563EB]/20 text-[#2563EB]"
              >
                View
              </Button>
              {period.status !== "completed" && onEditPeriod && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditPeriod(period)}
                  className="flex-1 border-[#F59E0B]/20 text-[#F59E0B]"
                >
                  Edit
                </Button>
              )}
              {period.status === "completed" && onDownloadPeriod && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadPeriod(period)}
                  className="flex-1 border-slate-200 text-[#64748B]"
                >
                  Download
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

