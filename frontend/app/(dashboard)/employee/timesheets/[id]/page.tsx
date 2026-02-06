"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { timesheetService, type Timesheet } from "@/lib/services/timesheetService";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import { toast } from "@/lib/hooks/useToast";

export default function EmployeeTimesheetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const timesheetId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!timesheetId || typeof timesheetId !== 'string' || timesheetId.trim() === '') {
      setError('Invalid timesheet ID');
      setLoading(false);
      setTimeout(() => {
        router.push('/employee/timesheet');
      }, 2000);
      return;
    }
    
    // Validate ObjectId format (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(timesheetId.trim())) {
      setError('Invalid timesheet ID format');
      setLoading(false);
      setTimeout(() => {
        router.push('/employee/timesheet');
      }, 2000);
      return;
    }
    
    loadTimesheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timesheetId]);

  const loadTimesheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const timesheetData = await timesheetService.getTimesheetById(timesheetId);
      if (!timesheetData) {
        setError('Timesheet not found');
        setTimeout(() => {
          router.push('/employee/timesheet');
        }, 3000);
        return;
      }
      setTimesheet(timesheetData);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load timesheet. The timesheet may not exist or you may not have permission to view it.';
      setError(errorMessage);
      toast.error(errorMessage);
      setTimeout(() => {
        router.push('/employee/timesheet');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-slate-100 text-slate-700 border-slate-200",
      submitted: "bg-blue-100 text-blue-700 border-blue-200",
      approved: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return 'N/A';
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !timesheet) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-[#DC2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-2">Timesheet Not Found</h2>
              <p className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">
                {error || 'The requested timesheet could not be found. You will be redirected to your timesheets page shortly.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="default"
                  onClick={() => router.push('/employee/timesheet')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Go to Timesheets
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-slate-200 text-[#64748B] hover:bg-slate-50"
                >
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/employee/timesheet">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 text-[#64748B] hover:bg-slate-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">Timesheet Details</h1>
          </div>
          <p className="text-sm text-[#64748B]">
            View detailed information about your timesheet entry
          </p>
        </div>
        <Badge className={getStatusBadge(timesheet.status)}>
          {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
        </Badge>
      </div>

      {/* Timesheet Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 border-slate-300 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">Timesheet Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#64748B] mb-1 block">Date</label>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {formatDate(timesheet.date)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-[#64748B] mb-1 block">Day</label>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {timesheet.day || new Date(timesheet.date).toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-[#64748B] mb-1 block">Clock In</label>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {formatTime(timesheet.clockIn)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-[#64748B] mb-1 block">Clock Out</label>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {formatTime(timesheet.clockOut)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-[#64748B] mb-1 block">Total Hours</label>
                  <p className="text-lg font-bold text-[#2563EB]">{timesheet.hours || 0}h</p>
                </div>
                <div>
                  <label className="text-xs text-[#64748B] mb-1 block">Status</label>
                  <Badge className={getStatusBadge(timesheet.status)}>
                    {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {timesheet.regularHours !== undefined && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#64748B] mb-1 block">Regular Hours</label>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {timesheet.regularHours || 0}h
                      </p>
                    </div>
                    {timesheet.overtimeHours !== undefined && timesheet.overtimeHours > 0 && (
                      <div>
                        <label className="text-xs text-[#64748B] mb-1 block">Overtime Hours</label>
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {timesheet.overtimeHours || 0}h
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          {timesheet.comments && (
            <Card className="border-2 border-slate-300 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#0F172A]">
                  {timesheet.status === 'rejected' ? 'Rejection Reason' : 'Comments'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-sm ${timesheet.status === 'rejected' ? 'text-[#DC2626]' : 'text-[#0F172A]'}`}>
                  {timesheet.comments}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Timeline */}
          <Card className="border-2 border-slate-300 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {timesheet.submittedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#0F172A]">Submitted</p>
                    <p className="text-xs text-[#64748B]">
                      {new Date(timesheet.submittedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
              )}

              {timesheet.approvedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#0F172A]">Approved</p>
                    <p className="text-xs text-[#64748B]">
                      {new Date(timesheet.approvedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                    {timesheet.approvedBy && (
                      <p className="text-xs text-[#64748B] mt-0.5">
                        by {typeof timesheet.approvedBy === 'object' ? timesheet.approvedBy.name : 'Manager'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {timesheet.rejectedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#0F172A]">Rejected</p>
                    <p className="text-xs text-[#64748B]">
                      {new Date(timesheet.rejectedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                    {timesheet.rejectedBy && (
                      <p className="text-xs text-[#64748B] mt-0.5">
                        by {typeof timesheet.rejectedBy === 'object' ? timesheet.rejectedBy.name : 'Manager'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!timesheet.submittedAt && !timesheet.approvedAt && !timesheet.rejectedAt && (
                <p className="text-xs text-[#64748B] text-center py-4">
                  No timeline events yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-2 border-slate-300 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/employee/timesheet" className="block">
                <Button
                  variant="outline"
                  className="w-full border-slate-200 text-[#64748B] hover:bg-slate-50"
                >
                  View All Timesheets
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full border-slate-200 text-[#64748B] hover:bg-slate-50"
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

