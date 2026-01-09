"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import PayrollPeriodTable from "@/components/payroll/PayrollPeriodTable";
import PayrollDetailDrawer from "@/components/payroll/PayrollDetailDrawer";
import {
  payrollService,
  type PayrollPeriod,
  type PayrollFilter,
  type PayrollStatus,
} from "@/lib/services/payrollService";

export default function AdminPayrollPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<PayrollPeriod | null>(null);
  const [nextPayrollDate, setNextPayrollDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PayrollFilter>({});
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      payrollService.getPayrollPeriods(filters),
      payrollService.getCurrentPeriod(),
      payrollService.getNextPayrollDate(),
    ]).then(([periodsData, current, nextDate]) => {
      if (!cancelled) {
        setPeriods(periodsData);
        setCurrentPeriod(current);
        setNextPayrollDate(nextDate);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const handleFilterChange = (field: keyof PayrollFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }));
  };

  const handleProcessPayroll = async () => {
    if (!currentPeriod) {
      alert("No current period available");
      return;
    }
    try {
      await payrollService.processPayroll(currentPeriod.id);
      alert("Payroll processed successfully");
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "Failed to process payroll");
    }
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "draft", label: "Draft" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Payroll Management</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Manage payroll periods and processing
          </p>
        </div>
        <Button
          variant="gradient"
          size="default"
          onClick={handleProcessPayroll}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
        >
          Process Payroll
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#64748B]">Current Period</CardTitle>
          </CardHeader>
          <CardContent>
            {currentPeriod ? (
              <div>
                <p className="text-2xl font-bold text-[#0F172A] mb-1">
                  {new Date(currentPeriod.periodStart).toLocaleDateString()} -{" "}
                  {new Date(currentPeriod.periodEnd).toLocaleDateString()}
                </p>
                <p className="text-sm text-[#64748B]">
                  {currentPeriod.employeeCount} employees
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#64748B]">No active period</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#64748B]">Next Payroll Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#0F172A] mb-1">
              {nextPayrollDate ? new Date(nextPayrollDate).toLocaleDateString() : "N/A"}
            </p>
            <p className="text-sm text-[#64748B]">Scheduled processing date</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-bold text-[#0F172A]">Payroll Periods</CardTitle>
            <div className="flex gap-3">
              <Select
                value={filters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full sm:w-48"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
              <span className="ml-3 text-[#64748B]">Loading payroll data...</span>
            </div>
          ) : (
            <PayrollPeriodTable
              periods={periods}
              onViewPeriod={(period) => {
                setSelectedPeriod(period);
                setIsDrawerOpen(true);
              }}
            />
          )}
        </CardContent>
      </Card>

      <PayrollDetailDrawer
        period={selectedPeriod}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedPeriod(null);
        }}
        onRefresh={() => {
          Promise.all([
            payrollService.getPayrollPeriods(filters),
            payrollService.getCurrentPeriod(),
            payrollService.getNextPayrollDate(),
          ]).then(([periodsData, current, nextDate]) => {
            setPeriods(periodsData);
            setCurrentPeriod(current);
            setNextPayrollDate(nextDate);
          });
        }}
      />
    </div>
  );
}

