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
import { departmentsApi } from "@/lib/api/departments";
import type { Report, ReportType } from "@/lib/api/reports";
import type { Department } from "@/lib/api/departments";
import { toast } from "@/lib/hooks/useToast";

export default function AdminReportsPage() {
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
  const [departmentId, setDepartmentId] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
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
    departmentId: "",
  });

  // Generate report form
  const [generateForm, setGenerateForm] = useState({
    type: "payroll" as ReportType,
    dateFrom: dateFrom,
    dateTo: dateTo,
    departmentId: "",
    employeeId: "",
    expiresInDays: 30,
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    if (activeTab === "generated") {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [activeTab, filters.type, filters.dateFrom, filters.dateTo, filters.departmentId]);

  useEffect(() => {
    if (activeTab === "quick") {
      loadQuickReports();
    } else {
      loadGeneratedReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateFrom, dateTo, departmentId, filters.type, filters.dateFrom, filters.dateTo, filters.departmentId, pagination.page]);

  const loadDepartments = async () => {
    try {
      const response = await departmentsApi.getDepartments({ limit: 100 });
      setDepartments(response.data || []);
    } catch (err: any) {
      toast.error("Failed to load departments");
    }
  };

  const loadQuickReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [payroll, attendance, leave, costs] = await Promise.all([
        reportService.getPayrollSummary(dateFrom, dateTo, departmentId || undefined).catch(() => null),
        reportService.getAttendanceOverview(dateFrom, dateTo, departmentId || undefined).catch(() => null),
        reportService.getLeaveAnalytics(dateFrom, dateTo, departmentId || undefined).catch(() => null),
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
        departmentId: filters.departmentId || undefined,
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
        departmentId: generateForm.departmentId || undefined,
        employeeId: generateForm.employeeId || undefined,
        expiresInDays: generateForm.expiresInDays,
      });
      toast.success("Report generated successfully! PDF and Excel files are being generated in the background. They will be available for download shortly.");
      setGenerateForm({
        type: "payroll",
        dateFrom: dateFrom,
        dateTo: dateTo,
        departmentId: "",
        employeeId: "",
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
      payroll: "bg-blue-100 text-blue-800",
      attendance: "bg-green-100 text-green-800",
      leave: "bg-purple-100 text-purple-800",
      department: "bg-orange-100 text-orange-800",
      employee: "bg-pink-100 text-pink-800",
      financial: "bg-indigo-100 text-indigo-800",
    };
    return colors[type] || "bg-slate-100 text-slate-800";
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Reports</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Generate and manage comprehensive reports
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("quick")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "quick"
              ? "text-[#2563EB] border-b-2 border-[#2563EB]"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          Quick Reports
        </button>
        <button
          onClick={() => setActiveTab("generated")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "generated"
              ? "text-[#2563EB] border-b-2 border-[#2563EB]"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          Generated Reports
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {activeTab === "quick" ? (
        <>
          {/* Quick Reports Filters */}
          <Card className="border border-slate-200 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Report Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A] block">Date From</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full min-w-0"
                    max={dateTo}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A] block">Date To</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom}
                    className="w-full min-w-0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A] block">Department</label>
                  <Select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full min-w-0"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id} title={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
              <span className="ml-3 text-[#64748B]">Loading reports...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {payrollSummary && (
                <PayrollSummaryCard
                  data={payrollSummary}
                  onExport={async (type) => {
                    // For quick reports, we'll generate a report first
                    try {
                      const report = await reportService.generateReport({
                        type: "payroll",
                        dateFrom,
                        dateTo,
                        departmentId: departmentId || undefined,
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
                        departmentId: departmentId || undefined,
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
                        departmentId: departmentId || undefined,
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
                <div className="text-center py-12 text-[#64748B]">No report data available for the selected period</div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Generate Report Form */}
          <Card className="border border-slate-200 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Generate New Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A] block">Report Type</label>
                  <Select
                    value={generateForm.type}
                    onChange={(e) => setGenerateForm({ ...generateForm, type: e.target.value as ReportType })}
                    className="w-full min-w-0"
                  >
                    <option value="payroll">Payroll</option>
                    <option value="attendance">Attendance</option>
                    <option value="leave">Leave</option>
                    <option value="department">Department</option>
                    <option value="employee">Employee</option>
                    <option value="financial">Financial</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A] block">
                    Date From <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={generateForm.dateFrom}
                    onChange={(e) => setGenerateForm({ ...generateForm, dateFrom: e.target.value })}
                    className="w-full min-w-0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A] block">
                    Date To <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={generateForm.dateTo}
                    onChange={(e) => setGenerateForm({ ...generateForm, dateTo: e.target.value })}
                    min={generateForm.dateFrom}
                    className="w-full min-w-0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A] block">Department (Optional)</label>
                  <Select
                    value={generateForm.departmentId}
                    onChange={(e) => setGenerateForm({ ...generateForm, departmentId: e.target.value })}
                    className="w-full min-w-0"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id} title={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A] block">Expires In (Days)</label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={generateForm.expiresInDays}
                    onChange={(e) => setGenerateForm({ ...generateForm, expiresInDays: parseInt(e.target.value) || 30 })}
                    className="w-full min-w-0"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="gradient"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                    onClick={handleGenerateReport}
                    disabled={generating}
                  >
                    {generating ? "Generating..." : "Generate Report"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="border border-slate-200 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A] block">Type</label>
                  <Select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value as ReportType | "" })}
                    className="w-full min-w-0"
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A] block">Date From</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full min-w-0"
                    min={filters.dateTo ? undefined : undefined}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A] block">Date To</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    min={filters.dateFrom}
                    className="w-full min-w-0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A] block">Department</label>
                  <Select
                    value={filters.departmentId}
                    onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                    className="w-full min-w-0"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id} title={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Reports List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
              <span className="ml-3 text-[#64748B]">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <Card className="border border-slate-200 bg-white">
              <CardContent className="py-12 text-center text-[#64748B]">
                No reports found. Generate a new report to get started.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border border-slate-200 bg-white">
                <CardHeader className="pb-4 flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-[#0F172A]">
                    Generated Reports ({pagination.total})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadGeneratedReports}
                    disabled={loading}
                    className="border-slate-200 text-[#64748B] hover:bg-slate-50"
                  >
                    {loading ? "Refreshing..." : "Refresh"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Period</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Department</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Generated By</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Generated At</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Expires At</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((report) => (
                          <tr key={report._id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <Badge className={getReportTypeBadgeColor(report.reportType)}>
                                {report.reportType}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-[#64748B]">{report.period}</td>
                            <td className="py-3 px-4 text-sm text-[#64748B]">
                              {report.department || "All Departments"}
                            </td>
                            <td className="py-3 px-4 text-sm text-[#64748B]">
                              {report.generatedBy?.name || "N/A"}
                            </td>
                            <td className="py-3 px-4 text-sm text-[#64748B]">
                              {formatDate(report.generatedAt)}
                            </td>
                            <td className="py-3 px-4 text-sm text-[#64748B]">
                              {report.expiresAt ? formatDate(report.expiresAt) : "Never"}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadPDF(report._id, report.reportType)}
                                  disabled={!report.pdfFileId || downloading[report._id] === 'pdf'}
                                  className="border-slate-200 text-[#64748B] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={!report.pdfFileId ? "PDF is being generated..." : "Download PDF"}
                                >
                                  {downloading[report._id] === 'pdf' ? "..." : "PDF"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadExcel(report._id, report.reportType)}
                                  disabled={!report.excelFileId || downloading[report._id] === 'excel'}
                                  className="border-slate-200 text-[#64748B] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={!report.excelFileId ? "Excel is being generated..." : "Download Excel"}
                                >
                                  {downloading[report._id] === 'excel' ? "..." : "Excel"}
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
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                      <div className="text-sm text-[#64748B]">
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                          disabled={pagination.page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                          disabled={pagination.page >= pagination.totalPages}
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
