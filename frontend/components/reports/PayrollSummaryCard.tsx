"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PayrollSummary } from "@/lib/api/reports";

interface PayrollSummaryCardProps {
  data: PayrollSummary;
  onExport: (type: "pdf" | "excel") => void;
}

export default function PayrollSummaryCard({ data, onExport }: PayrollSummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border border-slate-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[#0F172A]">Payroll Summary</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport("pdf")}
              className="border-slate-200 text-[#64748B] hover:bg-slate-50"
            >
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport("excel")}
              className="border-slate-200 text-[#64748B] hover:bg-slate-50"
            >
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-[#64748B] mb-1">Total Payroll</p>
            <p className="text-xl font-bold text-[#0F172A]">{formatCurrency(data.totalPayroll)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-[#64748B] mb-1">Employees</p>
            <p className="text-xl font-bold text-[#0F172A]">{data.employeeCount}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-[#64748B] mb-1">Average Salary</p>
            <p className="text-xl font-bold text-[#0F172A]">{formatCurrency(data.averageSalary)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-[#64748B] mb-1">Period</p>
            <p className="text-xl font-bold text-[#0F172A]">{data.period}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



