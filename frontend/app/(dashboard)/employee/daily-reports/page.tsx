'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FileText, Plus, Calendar, Clock, Send, Save, CheckCircle, Trash2, Trophy, AlertTriangle } from 'lucide-react';
import { dailyReportService } from '@/lib/services/dailyReportService';
import { taskService } from '@/lib/services/taskService';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from '@/lib/hooks/useToast';
import type { DailyReport, TaskCompleted, Accomplishment, Challenge } from '@/lib/api/dailyReports';
import type { Task } from '@/lib/api/tasks';

export default function EmployeeDailyReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoursWorked, setHoursWorked] = useState(8);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [notes, setNotes] = useState('');
  const [tasksCompleted, setTasksCompleted] = useState<TaskCompleted[]>([]);
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [existingReport, setExistingReport] = useState<DailyReport | null>(null);

  const loadAvailableTasks = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Get tasks for the current employee and filter for in-progress and pending
      const [inProgressTasks, pendingTasks] = await Promise.all([
        taskService.getEmployeeTasks(user.id, { status: 'in-progress' }),
        taskService.getEmployeeTasks(user.id, { status: 'pending' }),
      ]);
      // Combine and deduplicate tasks
      const allTasks = [...inProgressTasks.data, ...pendingTasks.data];
      const uniqueTasks = Array.from(
        new Map(allTasks.map(task => [task.id, task])).values()
      );
      setAvailableTasks(uniqueTasks);
    } catch (error: any) {
      console.error('Failed to load tasks:', error);
      setAvailableTasks([]);
    }
  }, [user?.id]);

  const loadExistingReport = useCallback(async () => {
    try {
      const date = new Date(reportDate);
      date.setHours(0, 0, 0, 0);
      const reports = await dailyReportService.getMyReports({
        startDate: date.toISOString(),
        endDate: date.toISOString(),
        limit: 1
      });
      if (reports.length > 0) {
        const report = reports[0];
        setExistingReport(report);
        setHoursWorked(report.hoursWorked || 8);
        setOvertimeHours(report.overtimeHours || 0);
        setNotes(report.notes || '');
        setTasksCompleted(report.tasksCompleted || []);
        setAccomplishments(report.accomplishments || []);
        setChallenges(report.challenges || []);
      } else {
        setExistingReport(null);
        // Reset to defaults
        setHoursWorked(8);
        setOvertimeHours(0);
        setNotes('');
        setTasksCompleted([]);
        setAccomplishments([]);
        setChallenges([]);
      }
    } catch (error: any) {
      console.error('Failed to load existing report:', error);
    }
  }, [reportDate]);

  useEffect(() => {
    loadAvailableTasks();
  }, [loadAvailableTasks]);

  useEffect(() => {
    loadExistingReport();
  }, [loadExistingReport]);

  const addTaskCompleted = () => {
    setTasksCompleted([...tasksCompleted, { taskTitle: '', description: '', hoursSpent: 0 }]);
  };

  const updateTaskCompleted = (index: number, field: keyof TaskCompleted, value: any) => {
    const updated = [...tasksCompleted];
    updated[index] = { ...updated[index], [field]: value };
    setTasksCompleted(updated);
  };

  const removeTaskCompleted = (index: number) => {
    setTasksCompleted(tasksCompleted.filter((_, i) => i !== index));
  };

  const addAccomplishment = () => {
    setAccomplishments([...accomplishments, { title: '', description: '' }]);
  };

  const updateAccomplishment = (index: number, field: keyof Accomplishment, value: string) => {
    const updated = [...accomplishments];
    updated[index] = { ...updated[index], [field]: value };
    setAccomplishments(updated);
  };

  const removeAccomplishment = (index: number) => {
    setAccomplishments(accomplishments.filter((_, i) => i !== index));
  };

  const addChallenge = () => {
    setChallenges([...challenges, { title: '', description: '' }]);
  };

  const updateChallenge = (index: number, field: keyof Challenge, value: string) => {
    const updated = [...challenges];
    updated[index] = { ...updated[index], [field]: value };
    setChallenges(updated);
  };

  const removeChallenge = (index: number) => {
    setChallenges(challenges.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    try {
      setSubmitting(true);
      const reportData: Partial<DailyReport> = {
        reportDate,
        hoursWorked,
        overtimeHours,
        notes,
        tasksCompleted: tasksCompleted.filter(t => t.taskTitle.trim()),
        accomplishments: accomplishments.filter(a => a.title.trim()),
        challenges: challenges.filter(c => c.title.trim()),
        status: 'draft'
      };

      await dailyReportService.createReport(reportData);
      toast.success('Daily report saved as draft');
      await loadExistingReport();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!hoursWorked || hoursWorked <= 0) {
      toast.error('Please enter hours worked');
      return;
    }

    try {
      setSubmitting(true);
      const reportData: Partial<DailyReport> = {
        reportDate,
        hoursWorked,
        overtimeHours,
        notes,
        tasksCompleted: tasksCompleted.filter(t => t.taskTitle.trim()),
        accomplishments: accomplishments.filter(a => a.title.trim()),
        challenges: challenges.filter(c => c.title.trim()),
        status: 'submitted'
      };

      await dailyReportService.createReport(reportData);
      toast.success('Daily report submitted successfully');
      await loadExistingReport();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">Daily Report</h1>
          <p className="text-sm sm:text-base text-[#64748B] mt-1">
            Submit your daily work report and progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={submitting}
            className="border-2 border-[#E2E8F0]"
          >
            Save Draft
          </Button>
          <Button
            variant="gradient"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-to-r from-blue-600 to-blue-700"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </div>

      <Card className="border-2 border-slate-300 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <CardTitle className="text-lg font-bold text-[#0F172A]">Report Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                Report Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                Hours Worked <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                max="24"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(parseFloat(e.target.value) || 0)}
                className="w-full border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                Overtime Hours
              </label>
              <Input
                type="number"
                min="0"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(parseFloat(e.target.value) || 0)}
                className="w-full border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
              placeholder="Additional notes or comments..."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-slate-300 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <CardTitle className="text-lg font-bold text-[#0F172A]">Tasks Completed</CardTitle>
          <Button variant="outline" size="sm" onClick={addTaskCompleted}>
            + Add Task
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasksCompleted.map((task, index) => (
            <div key={index} className="p-4 border-2 border-slate-300 rounded-lg space-y-3 bg-white hover:bg-blue-50 transition-colors">
              <div className="flex justify-between items-start">
                <Input
                  placeholder="Task title"
                  value={task.taskTitle}
                  onChange={(e) => updateTaskCompleted(index, 'taskTitle', e.target.value)}
                  className="flex-1 mr-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTaskCompleted(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
              <textarea
                placeholder="Description"
                value={task.description}
                onChange={(e) => updateTaskCompleted(index, 'description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Input
                type="number"
                min="0"
                placeholder="Hours spent"
                value={task.hoursSpent || 0}
                onChange={(e) => updateTaskCompleted(index, 'hoursSpent', parseFloat(e.target.value) || 0)}
                className="w-32"
              />
            </div>
          ))}
          {tasksCompleted.length === 0 && (
            <p className="text-sm text-[#64748B] text-center py-4">
              No tasks added. Click &quot;+ Add Task&quot; to add completed tasks.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-slate-300 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <CardTitle className="text-lg font-bold text-[#0F172A]">Accomplishments</CardTitle>
          <Button variant="outline" size="sm" onClick={addAccomplishment} className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold">
            + Add Accomplishment
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {accomplishments.map((acc, index) => (
            <div key={index} className="p-4 border-2 border-slate-300 rounded-lg space-y-3 bg-white hover:bg-blue-50 transition-colors">
              <div className="flex justify-between items-start">
                <Input
                  placeholder="Accomplishment title"
                  value={acc.title}
                  onChange={(e) => updateAccomplishment(index, 'title', e.target.value)}
                  className="flex-1 mr-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAccomplishment(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
              <textarea
                placeholder="Description"
                value={acc.description}
                onChange={(e) => updateAccomplishment(index, 'description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
              />
              <Input
                placeholder="Impact (optional)"
                value={acc.impact || ''}
                onChange={(e) => updateAccomplishment(index, 'impact', e.target.value)}
                className="w-full"
              />
            </div>
          ))}
          {accomplishments.length === 0 && (
            <p className="text-sm text-[#64748B] text-center py-4">
              No accomplishments added. Click &quot;+ Add Accomplishment&quot; to add your achievements.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-slate-300 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <CardTitle className="text-lg font-bold text-[#0F172A]">Challenges</CardTitle>
          <Button variant="outline" size="sm" onClick={addChallenge} className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold">
            + Add Challenge
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {challenges.map((challenge, index) => (
            <div key={index} className="p-4 border-2 border-slate-300 rounded-lg space-y-3 bg-white hover:bg-blue-50 transition-colors">
              <div className="flex justify-between items-start">
                <Input
                  placeholder="Challenge title"
                  value={challenge.title}
                  onChange={(e) => updateChallenge(index, 'title', e.target.value)}
                  className="flex-1 mr-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChallenge(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
              <textarea
                placeholder="Description"
                value={challenge.description}
                onChange={(e) => updateChallenge(index, 'description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Input
                placeholder="Resolution (optional)"
                value={challenge.resolution || ''}
                onChange={(e) => updateChallenge(index, 'resolution', e.target.value)}
                className="w-full"
              />
            </div>
          ))}
          {challenges.length === 0 && (
            <p className="text-sm text-[#64748B] text-center py-4">
              No challenges added. Click &quot;+ Add Challenge&quot; to document any blockers or issues.
            </p>
          )}
        </CardContent>
      </Card>

      {existingReport && existingReport.status === 'submitted' && (
        <Card className="border border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm text-green-700">
              ✓ Report submitted on {dailyReportService.formatDate(existingReport.submittedAt || existingReport.createdAt || '')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
