"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import PayrollSummaryCard from "@/components/reports/PayrollSummaryCard";
import AttendanceOverviewCard from "@/components/reports/AttendanceOverviewCard";
import LeaveAnalyticsCard from "@/components/reports/LeaveAnalyticsCard";
import DepartmentCostCard from "@/components/reports/DepartmentCostCard";
import { reportService } from "@/lib/services/reportService";
import type { Report, ReportType } from "@/lib/api/reports";
import { toast } from "@/lib/hooks/useToast";

export default function DepartmentLeadReportsPage() {
  const [activeTab, setActiveTab] = useState<"quick" | "generated">("quick");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<{ [key: string]: 'pdf' | 'excel' | null }>({});
  const [error, setError] = useState<string | null>(null);
  
  // Quick reports state
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [payrollSummary, setPayrollSummary] = useState<any>(null);
  const [attendanceOverview, setAttendanceOverview] = useState<any>(null);
  const [leaveAnalytics, setLeaveAnalytics] = useState<any>(null);
  const [departmentCosts, setDepartmentCosts] = useState<any[]>([]);

  // Generated reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    type: "" as ReportType | "",
    dateFrom: "",
    dateTo: "",
  });

  // Generate report form
  const [generateForm, setGenerateForm] = useState({
    type: "payroll" as ReportType,
    dateFrom: dateFrom,
    dateTo: dateTo,
    expiresInDays: 30,
  });

  // Reset page to 1 when filters change
  useEffect(() => {
    if (activeTab === "generated") {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [activeTab, filters.type, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    if (activeTab === "quick") {
      loadQuickReports();
    } else {
      loadGeneratedReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateFrom, dateTo, filters.type, filters.dateFrom, filters.dateTo, pagination.page]);

  const loadQuickReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend automatically filters by department for dept_lead
      const [payroll, attendance, leave, costs] = await Promise.all([
        reportService.getPayrollSummary(dateFrom, dateTo).catch(() => null),
        reportService.getAttendanceOverview(dateFrom, dateTo).catch(() => null),
        reportService.getLeaveAnalytics(dateFrom, dateTo).catch(() => null),
        reportService.getDepartmentCosts(dateFrom, dateTo).catch(() => []),
      ]);
      setPayrollSummary(payroll);
      setAttendanceOverview(attendance);
      setLeaveAnalytics(leave);
      setDepartmentCosts(Array.isArray(costs) ? costs : []);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load reports";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadGeneratedReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentPage = pagination?.page || 1;
      const currentLimit = pagination?.limit || 10;
      const result = await reportService.getReports({
        page: currentPage,
        limit: currentLimit,
        type: filters.type || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        sort: "generatedAt",
        order: "desc",
      });
      setReports(result.reports);
      setPagination(result.pagination || {
        page: currentPage,
        limit: currentLimit,
        total: 0,
        totalPages: 0,
      });
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load reports";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!generateForm.dateFrom || !generateForm.dateTo) {
      setError("Please select date range");
      return;
    }
    if (generateForm.dateTo < generateForm.dateFrom) {
      setError("End date must be after start date");
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      await reportService.generateReport({
        type: generateForm.type,
        dateFrom: generateForm.dateFrom,
        dateTo: generateForm.dateTo,
        expiresInDays: generateForm.expiresInDays,
      });
      toast.success("Report generated successfully! PDF and Excel files are being generated in the background. They will be available for download shortly.");
      setGenerateForm({
        type: "payroll",
        dateFrom: dateFrom,
        dateTo: dateTo,
        expiresInDays: 30,
      });
      // Wait a moment for files to start generating, then refresh
      setTimeout(() => {
        loadGeneratedReports();
      }, 2000);
      setActiveTab("generated");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to generate report";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async (reportId: string, reportType: string) => {
    if (!reportId) return;
    setDownloading({ ...downloading, [reportId]: 'pdf' });
    try {
      await reportService.downloadPDF(reportId, `${reportType}-report.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to download PDF. The file may still be generating. Please try again in a moment.");
    } finally {
      setDownloading({ ...downloading, [reportId]: null });
    }
  };

  const handleDownloadExcel = async (reportId: string, reportType: string) => {
    if (!reportId) return;
    setDownloading({ ...downloading, [reportId]: 'excel' });
    try {
      await reportService.downloadExcel(reportId, `${reportType}-report.xlsx`);
      toast.success("Excel file downloaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to download Excel. The file may still be generating. Please try again in a moment.");
    } finally {
      setDownloading({ ...downloading, [reportId]: null });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getReportTypeBadgeColor = (type: ReportType) => {
    const colors: Record<ReportType, string> = {
      payroll: "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 font-semibold",
      attendance: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 font-semibold",
      leave: "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border border-purple-200 font-semibold",
      department: "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border border-orange-200 font-semibold",
      employee: "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border border-pink-200 font-semibold",
      financial: "bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-200 font-semibold",
    };
    return colors[type] || "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border border-slate-200 font-semibold";
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">
            Department Reports
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            View analytics and generate comprehensive reports for your department
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-slate-200">
        <button
          onClick={() => setActiveTab("quick")}
          className={`px-6 py-3 font-semibold text-sm transition-all duration-200 relative ${
            activeTab === "quick"
              ? "text-blue-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Quick Reports
          {activeTab === "quick" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("generated")}
          className={`px-6 py-3 font-semibold text-sm transition-all duration-200 relative ${
            activeTab === "generated"
              ? "text-blue-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Generated Reports
          {activeTab === "generated" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600"></span>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg shadow-md">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        </div>
      )}

      {activeTab === "quick" ? (
        <>
          {/* Quick Reports Filters */}
          <Card className="border border-slate-200 bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Report Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date From</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date To</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
              <span className="ml-4 text-slate-600 font-medium">Loading reports...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {payrollSummary && (
                <PayrollSummaryCard
                  data={payrollSummary}
                  onExport={async (type) => {
                    try {
                      const report = await reportService.generateReport({
                        type: "payroll",
                        dateFrom,
                        dateTo,
                        expiresInDays: 7,
                      });
                      if (type === "pdf") {
                        await handleDownloadPDF(report._id, "payroll");
                      } else {
                        await handleDownloadExcel(report._id, "payroll");
                      }
                    } catch (err: any) {
                      toast.error(err.message || "Failed to export");
                    }
                  }}
                />
              )}
              {attendanceOverview && (
                <AttendanceOverviewCard
                  data={attendanceOverview}
                  onExport={async (type) => {
                    try {
                      const report = await reportService.generateReport({
                        type: "attendance",
                        dateFrom,
                        dateTo,
                        expiresInDays: 7,
                      });
                      if (type === "pdf") {
                        await handleDownloadPDF(report._id, "attendance");
                      } else {
                        await handleDownloadExcel(report._id, "attendance");
                      }
                    } catch (err: any) {
                      alert(err.message || "Failed to export");
                    }
                  }}
                />
              )}
              {leaveAnalytics && (
                <LeaveAnalyticsCard
                  data={leaveAnalytics}
                  onExport={async (type) => {
                    try {
                      const report = await reportService.generateReport({
                        type: "leave",
                        dateFrom,
                        dateTo,
                        expiresInDays: 7,
                      });
                      if (type === "pdf") {
                        await handleDownloadPDF(report._id, "leave");
                      } else {
                        await handleDownloadExcel(report._id, "leave");
                      }
                    } catch (err: any) {
                      alert(err.message || "Failed to export");
                    }
                  }}
                />
              )}
              {departmentCosts && departmentCosts.length > 0 && (
                <DepartmentCostCard
                  data={departmentCosts}
                  onExport={async (type) => {
                    try {
                      const report = await reportService.generateReport({
                        type: "department",
                        dateFrom,
                        dateTo,
                        expiresInDays: 7,
                      });
                      if (type === "pdf") {
                        await handleDownloadPDF(report._id, "department");
                      } else {
                        await handleDownloadExcel(report._id, "department");
                      }
                    } catch (err: any) {
                      alert(err.message || "Failed to export");
                    }
                  }}
                />
              )}
              {!payrollSummary && !attendanceOverview && !leaveAnalytics && departmentCosts.length === 0 && !loading && (
                <Card className="border border-slate-200 bg-white shadow-lg">
                  <CardContent className="py-16 text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-semibold text-slate-700 mb-1">No report data available</p>
                    <p className="text-sm text-slate-500">Try adjusting your date range</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Generate Report Form */}
          <Card className="border border-slate-200 bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Generate New Report
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Report Type</label>
                  <Select
                    value={generateForm.type}
                    onChange={(e) => setGenerateForm({ ...generateForm, type: e.target.value as ReportType })}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="payroll">Payroll</option>
                    <option value="attendance">Attendance</option>
                    <option value="leave">Leave</option>
                    <option value="department">Department</option>
                    <option value="employee">Employee</option>
                    <option value="financial">Financial</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date From</label>
                  <Input
                    type="date"
                    value={generateForm.dateFrom}
                    onChange={(e) => setGenerateForm({ ...generateForm, dateFrom: e.target.value })}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date To</label>
                  <Input
                    type="date"
                    value={generateForm.dateTo}
                    onChange={(e) => setGenerateForm({ ...generateForm, dateTo: e.target.value })}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="default"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 font-semibold"
                    onClick={handleGenerateReport}
                    disabled={generating}
                  >
                    {generating ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      "Generate Report"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="border border-slate-200 bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                  <Select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value as ReportType | "" })}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="payroll">Payroll</option>
                    <option value="attendance">Attendance</option>
                    <option value="leave">Leave</option>
                    <option value="department">Department</option>
                    <option value="employee">Employee</option>
                    <option value="financial">Financial</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date From</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date To</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Reports List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
              <span className="ml-4 text-slate-600 font-medium">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <Card className="border border-slate-200 bg-white shadow-lg">
              <CardContent className="py-16 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-semibold text-slate-700 mb-1">No reports found</p>
                <p className="text-sm text-slate-500">Generate a new report to get started</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border border-slate-200 bg-white shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200 flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generated Reports ({pagination.total})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadGeneratedReports}
                    disabled={loading}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    {loading ? "Refreshing..." : "Refresh"}
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b-2 border-slate-200">
                          <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Type</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Period</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Generated By</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Generated At</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Expires At</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((report) => (
                          <tr key={report._id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-150">
                            <td className="py-4 px-6">
                              <Badge className={`${getReportTypeBadgeColor(report.reportType)} px-3 py-1`}>
                                {report.reportType}
                              </Badge>
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-600 font-medium">{report.period}</td>
                            <td className="py-4 px-6 text-sm text-slate-600">
                              {report.generatedBy?.name || "N/A"}
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-600">
                              {formatDate(report.generatedAt)}
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-600">
                              {report.expiresAt ? formatDate(report.expiresAt) : "Never"}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadPDF(report._id, report.reportType)}
                                  disabled={!report.pdfFileId || downloading[report._id] === 'pdf'}
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={!report.pdfFileId ? "PDF is being generated..." : "Download PDF"}
                                >
                                  {downloading[report._id] === 'pdf' ? (
                                    <span className="flex items-center gap-1">
                                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      PDF
                                    </span>
                                  ) : (
                                    "PDF"
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadExcel(report._id, report.reportType)}
                                  disabled={!report.excelFileId || downloading[report._id] === 'excel'}
                                  className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={!report.excelFileId ? "Excel is being generated..." : "Download Excel"}
                                >
                                  {downloading[report._id] === 'excel' ? (
                                    <span className="flex items-center gap-1">
                                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Excel
                                    </span>
                                  ) : (
                                    "Excel"
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 px-6 pb-4 border-t border-slate-200">
                      <div className="text-sm text-slate-600 font-medium">
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                          disabled={pagination.page === 1}
                          className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold disabled:opacity-50"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                          disabled={pagination.page >= pagination.totalPages}
                          className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold disabled:opacity-50"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
