'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { dailyReportService } from '@/lib/services/dailyReportService';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from '@/lib/hooks/useToast';
import type { DailyReport, DepartmentReportsData } from '@/lib/api/dailyReports';

export default function DepartmentLeadEmployeeReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DepartmentReportsData | null>(null);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: '',
    employeeId: ''
  });
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const reportsData = await dailyReportService.getDepartmentReports(filters);
      setData(reportsData);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleReview = async (reportId: string) => {
    try {
      setReviewing(true);
      await dailyReportService.reviewReport(reportId, reviewComments);
      toast.success('Report reviewed successfully');
      setSelectedReport(null);
      setReviewComments('');
      await loadReports();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to review report');
    } finally {
      setReviewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: 'bg-amber-100 text-amber-800 border-2 border-amber-300 font-semibold',
      submitted: 'bg-blue-100 text-blue-800 border-2 border-blue-300 font-semibold',
      reviewed: 'bg-green-100 text-green-800 border-2 border-green-300 font-semibold'
    };
    return variants[status] || 'bg-gray-100 text-gray-800 border-2 border-gray-300 font-semibold';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">Employee Daily Reports</h1>
          <p className="text-sm sm:text-base text-[#64748B] mt-1">
            View and review daily reports from your department employees
          </p>
        </div>
      </div>

      {data && data.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-2 border-slate-300 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6 bg-gradient-to-br from-slate-50 to-white">
              <p className="text-sm font-semibold text-[#64748B] mb-1">Total Employees</p>
              <p className="text-3xl font-bold text-[#0F172A]">{data.summary.totalEmployees}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-slate-300 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6 bg-gradient-to-br from-blue-50 to-white">
              <p className="text-sm font-semibold text-[#64748B] mb-1">With Reports</p>
              <p className="text-3xl font-bold text-[#0F172A]">{data.summary.employeesWithReports}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-400 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6 bg-gradient-to-br from-blue-50 to-white">
              <p className="text-sm font-semibold text-blue-700 mb-1">Submitted</p>
              <p className="text-3xl font-bold text-blue-600">{data.summary.submittedReports}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-amber-400 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6 bg-gradient-to-br from-amber-50 to-white">
              <p className="text-sm font-semibold text-amber-700 mb-1">Pending</p>
              <p className="text-3xl font-bold text-amber-600">{data.summary.pendingReports}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-2 border-slate-300 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <CardTitle className="text-lg font-bold text-[#0F172A]">Filters</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Employee</label>
              <select
                value={filters.employeeId}
                onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                className="w-full px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
              >
                <option value="">All Employees</option>
                {data?.employees.map((emp) => (
                  <option key={emp.employee._id} value={emp.employee._id}>
                    {emp.employee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {data?.employees.map((empData) => {
          if (empData.reports.length === 0 && filters.employeeId && filters.employeeId !== empData.employee._id) {
            return null;
          }
          return (
            <Card key={empData.employee._id} className="border-2 border-slate-300 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold text-[#0F172A]">{empData.employee.name}</CardTitle>
                    <p className="text-sm text-[#64748B] font-medium">
                      {empData.employee.email} • {empData.employee.position}
                    </p>
                  </div>
                  <Badge className="bg-blue-600 text-white border-blue-700 font-semibold">
                    {empData.reports.length} Report{empData.reports.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="bg-white">
                {empData.reports.length === 0 ? (
                  <p className="text-sm text-[#64748B] text-center py-4">No reports found</p>
                ) : (
                  <div className="space-y-3">
                    {empData.reports.map((report) => {
                      const employee = typeof report.employeeId === 'object' ? report.employeeId : empData.employee;
                      return (
                        <div
                          key={report.id || report._id}
                          className="p-4 border-2 border-slate-300 bg-slate-50 rounded-lg hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all"
                          onClick={() => setSelectedReport(report)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-[#0F172A]">
                                  {dailyReportService.formatDate(report.reportDate)}
                                </p>
                                <Badge className={getStatusBadge(report.status)}>
                                  {report.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-[#64748B]">
                                {report.hoursWorked}h worked
                                {report.overtimeHours > 0 && ` • ${report.overtimeHours}h overtime`}
                              </p>
                              {report.tasksCompleted.length > 0 && (
                                <p className="text-sm text-[#64748B] mt-1">
                                  {report.tasksCompleted.length} task{report.tasksCompleted.length !== 1 ? 's' : ''} completed
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReport(report);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-slate-400 bg-white shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-slate-300">
              <CardTitle className="text-xl font-bold text-[#0F172A]">Report Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)} className="text-[#0F172A] hover:bg-red-100 hover:text-red-600">
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#64748B]">Date</p>
                  <p className="font-semibold">{dailyReportService.formatDate(selectedReport.reportDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">Status</p>
                  <Badge className={getStatusBadge(selectedReport.status)}>
                    {selectedReport.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">Hours Worked</p>
                  <p className="font-semibold">{selectedReport.hoursWorked}h</p>
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">Overtime</p>
                  <p className="font-semibold">{selectedReport.overtimeHours || 0}h</p>
                </div>
              </div>

              {selectedReport.tasksCompleted.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] mb-2">Tasks Completed</p>
                  <div className="space-y-2">
                    {selectedReport.tasksCompleted.map((task, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                        <p className="font-medium">{task.taskTitle}</p>
                        <p className="text-sm text-[#64748B]">{task.description}</p>
                        {task.hoursSpent && (
                          <p className="text-xs text-[#64748B] mt-1">{task.hoursSpent}h spent</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.accomplishments.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] mb-2">Accomplishments</p>
                  <div className="space-y-2">
                    {selectedReport.accomplishments.map((acc, idx) => (
                      <div key={idx} className="p-3 bg-green-50 rounded-lg">
                        <p className="font-medium">{acc.title}</p>
                        <p className="text-sm text-[#64748B]">{acc.description}</p>
                        {acc.impact && (
                          <p className="text-xs text-green-700 mt-1">Impact: {acc.impact}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.challenges.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] mb-2">Challenges</p>
                  <div className="space-y-2">
                    {selectedReport.challenges.map((challenge, idx) => (
                      <div key={idx} className="p-3 bg-amber-50 border-2 border-amber-200 rounded-lg">
                        <p className="font-semibold text-[#0F172A]">{challenge.title}</p>
                        <p className="text-sm text-[#64748B] mt-1">{challenge.description}</p>
                        {challenge.resolution && (
                          <p className="text-xs font-medium text-amber-800 mt-2 bg-amber-100 px-2 py-1 rounded">Resolution: {challenge.resolution}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.notes && (
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] mb-2">Notes</p>
                  <p className="text-sm text-[#64748B] p-3 bg-slate-50 rounded-lg">{selectedReport.notes}</p>
                </div>
              )}

              {selectedReport.status === 'submitted' && (
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] mb-2">Review Comments</p>
                  <textarea
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
                    placeholder="Add review comments..."
                  />
                  <Button
                    variant="gradient"
                    onClick={() => handleReview(selectedReport.id || selectedReport._id || '')}
                    disabled={reviewing}
                    className="mt-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg"
                  >
                    {reviewing ? 'Reviewing...' : 'Mark as Reviewed'}
                  </Button>
                </div>
              )}

              {selectedReport.status === 'reviewed' && selectedReport.reviewComments && (
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] mb-2">Review Comments</p>
                  <p className="text-sm text-[#64748B] p-3 bg-green-50 rounded-lg">
                    {selectedReport.reviewComments}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
