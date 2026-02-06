"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Clock, Plus, Send, Timer, Hourglass, CalendarClock } from "lucide-react";
import { timesheetService, type Timesheet } from "@/lib/services/timesheetService";
import { employeeService } from "@/lib/services/employeeService";
import { useAuth } from "@/lib/contexts/AuthContext";
import { toast } from "@/lib/hooks/useToast";

export default function EmployeeTimesheetPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: 8,
    clockIn: '',
    clockOut: '',
    comments: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getCurrentTimesheet();
      setCurrentPeriod(data.period);
      setTimesheets(data.timesheets || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!user?.id || !newEntry.date || newEntry.hours < 0 || newEntry.hours > 24) {
      toast.warning('Please enter valid date and hours (0-24)');
      return;
    }

    try {
      setSaving('create');
      await timesheetService.createTimesheet({
        date: newEntry.date,
        hours: newEntry.hours,
        clockIn: newEntry.clockIn || undefined,
        clockOut: newEntry.clockOut || undefined,
        comments: newEntry.comments || undefined,
        payrollPeriodId: currentPeriod?.id || undefined,
      });
      
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        hours: 8,
        clockIn: '',
        clockOut: '',
        comments: '',
      });
      setShowAddModal(false);
      toast.success('Timesheet entry created successfully');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create timesheet entry');
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateHours = async (id: string, hours: number) => {
    if (hours < 0 || hours > 24) {
      toast.warning('Hours must be between 0 and 24');
      return;
    }

    try {
      setSaving(id);
      await timesheetService.updateTimesheet(id, { hours });
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update timesheet');
    } finally {
      setSaving(null);
    }
  };

  const handleSubmitTimesheet = async (id: string) => {
    if (!confirm('Are you sure you want to submit this timesheet for approval?')) {
      return;
    }

    try {
      setSubmitting(true);
      await employeeService.submitTimesheet([id]);
      toast.success('Timesheet submitted successfully');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit timesheet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async () => {
    const draftTimesheets = timesheets.filter(ts => ts.status === 'draft' && ts.hours > 0);
    if (draftTimesheets.length === 0) {
      toast.warning('No draft timesheets to submit');
      return;
    }

    if (!confirm(`Submit ${draftTimesheets.length} timesheet(s) for approval?`)) {
      return;
    }

    try {
      setSubmitting(true);
      const timesheetIds = draftTimesheets.map(ts => ts.id);
      await employeeService.submitTimesheet(timesheetIds);
      toast.success(`${draftTimesheets.length} timesheet(s) submitted successfully`);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit timesheets');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved")
      return "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20";
    if (status === "submitted")
      return "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20";
    if (status === "rejected")
      return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const totalHours = timesheets.reduce((sum, ts) => sum + (ts.hours || 0), 0);
  const regularHours = timesheets.reduce((sum, ts) => sum + (ts.regularHours || 0), 0);
  const overtimeHours = timesheets.reduce((sum, ts) => sum + (ts.overtimeHours || 0), 0);
  const hasDraft = timesheets.some((ts) => ts.status === "draft" && ts.hours > 0);
  const allApproved = timesheets.length > 0 && timesheets.every((ts) => ts.status === "approved" || ts.hours === 0);

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

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Time Sheet</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            {currentPeriod 
              ? `Period: ${new Date(currentPeriod.periodStart).toLocaleDateString()} - ${new Date(currentPeriod.periodEnd).toLocaleDateString()}`
              : 'Log your daily hours for the current pay period'}
          </p>
        </div>
        <Button
          variant="default"
          onClick={() => setShowAddModal(true)}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
        >
          + Add Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-[#64748B] mb-1">Total Hours</p>
            <p className="text-2xl font-bold text-[#0F172A]">{totalHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-[#64748B] mb-1">Regular Hours</p>
            <p className="text-2xl font-bold text-[#0F172A]">{regularHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-[#64748B] mb-1">Overtime Hours</p>
            <p className="text-2xl font-bold text-[#0F172A]">{overtimeHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Daily Log</CardTitle>
        </CardHeader>
        <CardContent>
          {timesheets.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]">
              <p className="text-sm mb-2">No timesheet entries found</p>
              <p className="text-xs">Click &quot;Add Entry&quot; to start logging your hours</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Day</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Hours</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Regular</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Overtime</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheets.map((timesheet) => (
                    <tr
                      key={timesheet.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <p className="text-sm text-[#64748B]">
                          {new Date(timesheet.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {timesheet.day || new Date(timesheet.date).toLocaleDateString("en-US", { weekday: "short" })}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        {timesheet.status === "draft" ? (
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={timesheet.hours}
                            onChange={(e) => {
                              const hours = parseFloat(e.target.value) || 0;
                              handleUpdateHours(timesheet.id, hours);
                            }}
                            className="w-24"
                            disabled={saving === timesheet.id}
                          />
                        ) : (
                          <p className="text-sm font-semibold text-[#0F172A]">{timesheet.hours}h</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[#64748B]">{timesheet.regularHours?.toFixed(1) || '0.0'}h</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[#64748B]">{timesheet.overtimeHours?.toFixed(1) || '0.0'}h</p>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusBadge(timesheet.status)}>
                          {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        {timesheet.status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSubmitTimesheet(timesheet.id)}
                            disabled={submitting || timesheet.hours === 0}
                            className="text-xs"
                          >
                            Submit
                          </Button>
                        )}
                        {timesheet.status === "rejected" && timesheet.comments && (
                          <p className="text-xs text-[#DC2626]">{timesheet.comments}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {hasDraft && (
        <div className="flex justify-end">
          <Button
            variant="gradient"
            onClick={handleBulkSubmit}
            disabled={submitting || allApproved}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit All Draft Timesheets"}
          </Button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4">Add Timesheet Entry</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Date</label>
                <Input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Hours (0-24)</label>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={newEntry.hours}
                  onChange={(e) => setNewEntry({ ...newEntry, hours: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Clock In (HH:MM) - Optional</label>
                <Input
                  type="text"
                  placeholder="09:00"
                  value={newEntry.clockIn}
                  onChange={(e) => setNewEntry({ ...newEntry, clockIn: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Clock Out (HH:MM) - Optional</label>
                <Input
                  type="text"
                  placeholder="17:00"
                  value={newEntry.clockOut}
                  onChange={(e) => setNewEntry({ ...newEntry, clockOut: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Comments - Optional</label>
                <Input
                  type="text"
                  value={newEntry.comments}
                  onChange={(e) => setNewEntry({ ...newEntry, comments: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="default"
                  onClick={handleCreateEntry}
                  disabled={saving === 'create'}
                  className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                >
                  {saving === 'create' ? 'Creating...' : 'Create Entry'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
