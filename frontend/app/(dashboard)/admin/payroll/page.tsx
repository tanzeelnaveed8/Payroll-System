"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import PayrollPeriodTable from "@/components/payroll/PayrollPeriodTable";
import PayrollDetailDrawer from "@/components/payroll/PayrollDetailDrawer";
import CreatePeriodModal from "@/components/payroll/CreatePeriodModal";
import EditPeriodModal from "@/components/payroll/EditPeriodModal";
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
  const [processing, setProcessing] = useState(false);
  const [filters, setFilters] = useState<PayrollFilter>({});
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PayrollPeriod | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
    setLoading(true);
      const [periodsData, current, nextDate] = await Promise.all([
      payrollService.getPayrollPeriods(filters),
        payrollService.getCurrentPeriod().catch(() => null),
        payrollService.getNextPayrollDate().catch(() => ""),
      ]);
        setPeriods(periodsData);
        setCurrentPeriod(current);
        setNextPayrollDate(nextDate);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load payroll data. Please refresh the page.';
      setNotification({ type: 'error', message: errorMessage });
    } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleFilterChange = (field: keyof PayrollFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }));
  };

  const handleProcessPayroll = async () => {
    if (!currentPeriod) {
      setNotification({ 
        type: 'error', 
        message: 'No current payroll period available. Please create a payroll period first to process payroll.' 
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    if (!confirm(`Are you sure you want to process payroll for the period ${new Date(currentPeriod.periodStart).toLocaleDateString()} - ${new Date(currentPeriod.periodEnd).toLocaleDateString()}? This action cannot be undone.`)) {
      return;
    }

    try {
      setProcessing(true);
      setNotification(null);
      await payrollService.processPayroll(currentPeriod.id);
      setNotification({ type: 'success', message: 'Payroll processed successfully!' });
      setTimeout(() => {
        setNotification(null);
        loadData();
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to process payroll. Please try again or contact support if the issue persists.';
      setNotification({ type: 'error', message: errorMessage });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreatePeriodSuccess = () => {
    setNotification({ type: 'success', message: 'Payroll period created successfully!' });
    setTimeout(() => {
      setNotification(null);
      loadData();
    }, 2000);
  };

  const handleEditPeriod = (period: PayrollPeriod) => {
    setEditingPeriod(period);
    setIsEditModalOpen(true);
  };

  const handleEditPeriodSuccess = () => {
    setNotification({ type: 'success', message: 'Payroll period updated successfully!' });
    setTimeout(() => {
      setNotification(null);
      loadData();
    }, 2000);
  };

  const handleDownloadPeriod = async (period: PayrollPeriod) => {
    try {
      setNotification(null);
      // Use report service to generate and download payroll report for this period
      const { reportService } = await import("@/lib/services/reportService");
      
      // Check if a report already exists for this period
      try {
        const existingReports = await reportService.getReports({
          type: 'payroll',
          dateFrom: new Date(period.periodStart).toISOString().split("T")[0],
          dateTo: new Date(period.periodEnd).toISOString().split("T")[0],
          limit: 1,
        });

        let reportId: string | undefined;
        if (existingReports.reports && existingReports.reports.length > 0) {
          // Use existing report
          reportId = existingReports.reports[0]._id;
        } else {
          // Generate new report
          const report = await reportService.generateReport({
            type: "payroll",
            dateFrom: new Date(period.periodStart).toISOString().split("T")[0],
            dateTo: new Date(period.periodEnd).toISOString().split("T")[0],
            expiresInDays: 30,
          });
          reportId = report._id;
          
          // Wait a moment for the report to be generated
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (reportId) {
          await reportService.downloadPDF(reportId, `payroll-period-${new Date(period.periodStart).toLocaleDateString().replace(/\//g, '-')}-${new Date(period.periodEnd).toLocaleDateString().replace(/\//g, '-')}.pdf`);
          setNotification({ type: 'success', message: 'Payroll period report downloaded successfully!' });
          setTimeout(() => setNotification(null), 3000);
        } else {
          throw new Error('Failed to get report ID');
        }
      } catch (generateError: any) {
        throw generateError;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to download payroll period report. The report may still be generating. Please try again in a moment.';
      setNotification({ type: 'error', message: errorMessage });
      setTimeout(() => setNotification(null), 5000);
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
      {notification && (
        <div
          className={`p-4 rounded-lg border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          } flex items-center justify-between`}
        >
          <p className="text-sm font-medium">{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-current opacity-70 hover:opacity-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Payroll Management</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Manage payroll periods and processing
          </p>
        </div>
        <div className="flex gap-3">
          {!currentPeriod && (
            <Button
              variant="outline"
              size="default"
              onClick={() => setIsCreateModalOpen(true)}
              className="border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
            >
              Create Period
            </Button>
          )}
        <Button
          variant="gradient"
          size="default"
          onClick={handleProcessPayroll}
            disabled={processing || !currentPeriod}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {processing ? "Processing..." : "Process Payroll"}
        </Button>
        </div>
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
                <p className="text-sm text-[#64748B] mb-3">
                  {currentPeriod.employeeCount} employees
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditPeriod(currentPeriod)}
                  disabled={currentPeriod.status === 'completed'}
                  className="border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5 text-xs"
                >
                  Edit Period
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[#64748B]">No active payroll period</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5 text-xs"
                >
                  Create Period
                </Button>
              </div>
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
              onEditPeriod={handleEditPeriod}
              onDownloadPeriod={handleDownloadPeriod}
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
        onRefresh={loadData}
        onEditPeriod={handleEditPeriod}
        onDownloadPeriod={handleDownloadPeriod}
      />

      <CreatePeriodModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreatePeriodSuccess}
      />

      <EditPeriodModal
        isOpen={isEditModalOpen}
        period={editingPeriod}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPeriod(null);
        }}
        onSuccess={handleEditPeriodSuccess}
      />
    </div>
  );
}

