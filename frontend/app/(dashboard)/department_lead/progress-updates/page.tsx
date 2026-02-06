'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { progressUpdateService } from '@/lib/services/progressUpdateService';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from '@/lib/hooks/useToast';
import type { ProgressUpdate, Highlight, Challenge, ResourceNeed, NextPeriodGoal } from '@/lib/api/progressUpdates';
import Link from 'next/link';

export default function DepartmentLeadProgressUpdatesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<ProgressUpdate>>({
    periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
    highlights: [],
    challenges: [],
    resourceNeeds: [],
    nextPeriodGoals: [],
    status: 'draft'
  });

  const loadUpdates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await progressUpdateService.getMyUpdates();
      setUpdates(data);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load updates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  const addHighlight = () => {
    setFormData({
      ...formData,
      highlights: [...(formData.highlights || []), { title: '', description: '', impact: '' }]
    });
  };

  const updateHighlight = (index: number, field: keyof Highlight, value: string) => {
    const updated = [...(formData.highlights || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, highlights: updated });
  };

  const removeHighlight = (index: number) => {
    setFormData({
      ...formData,
      highlights: (formData.highlights || []).filter((_, i) => i !== index)
    });
  };

  const addChallenge = () => {
    setFormData({
      ...formData,
      challenges: [...(formData.challenges || []), { title: '', description: '', severity: 'medium', status: 'open' }]
    });
  };

  const updateChallenge = (index: number, field: keyof Challenge, value: any) => {
    const updated = [...(formData.challenges || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, challenges: updated });
  };

  const removeChallenge = (index: number) => {
    setFormData({
      ...formData,
      challenges: (formData.challenges || []).filter((_, i) => i !== index)
    });
  };

  const addResourceNeed = () => {
    setFormData({
      ...formData,
      resourceNeeds: [...(formData.resourceNeeds || []), { type: 'other', description: '', priority: 'medium' }]
    });
  };

  const updateResourceNeed = (index: number, field: keyof ResourceNeed, value: any) => {
    const updated = [...(formData.resourceNeeds || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, resourceNeeds: updated });
  };

  const removeResourceNeed = (index: number) => {
    setFormData({
      ...formData,
      resourceNeeds: (formData.resourceNeeds || []).filter((_, i) => i !== index)
    });
  };

  const addGoal = () => {
    setFormData({
      ...formData,
      nextPeriodGoals: [...(formData.nextPeriodGoals || []), { title: '', description: '', targetDate: '', priority: 'medium' }]
    });
  };

  const updateGoal = (index: number, field: keyof NextPeriodGoal, value: any) => {
    const updated = [...(formData.nextPeriodGoals || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, nextPeriodGoals: updated });
  };

  const removeGoal = (index: number) => {
    setFormData({
      ...formData,
      nextPeriodGoals: (formData.nextPeriodGoals || []).filter((_, i) => i !== index)
    });
  };

  const handleSaveDraft = async () => {
    try {
      setSubmitting(true);
      await progressUpdateService.createUpdate({ ...formData, status: 'draft' });
      toast.success('Progress update saved as draft');
      setShowForm(false);
      await loadUpdates();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.periodStart || !formData.periodEnd) {
      toast.error('Please select period dates');
      return;
    }

    try {
      setSubmitting(true);
      await progressUpdateService.createUpdate({ ...formData, status: 'submitted' });
      toast.success('Progress update submitted successfully');
      setShowForm(false);
      setFormData({
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0],
        highlights: [],
        challenges: [],
        resourceNeeds: [],
        nextPeriodGoals: [],
        status: 'draft'
      });
      await loadUpdates();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit update');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: 'bg-amber-100 text-amber-800 border-2 border-amber-300 font-semibold',
      submitted: 'bg-blue-100 text-blue-800 border-2 border-blue-300 font-semibold',
      acknowledged: 'bg-green-100 text-green-800 border-2 border-green-300 font-semibold'
    };
    return variants[status] || 'bg-gray-100 text-gray-800 border-2 border-gray-300 font-semibold';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">Progress Updates</h1>
          <p className="text-sm sm:text-base text-[#64748B] mt-1">
            Submit progress updates to managers and admins
          </p>
        </div>
        <Button
          variant="gradient"
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-600 to-blue-700"
        >
          {showForm ? 'Cancel' : '+ Create Update'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-slate-300 bg-white shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
            <CardTitle className="text-xl font-bold text-[#0F172A]">Create Progress Update</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                  Period Start <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                  className="border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                  Period End <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                  className="border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-[#0F172A]">Key Highlights</label>
                <Button variant="outline" size="sm" onClick={addHighlight} className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50">
                  + Add
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.highlights || []).map((highlight, index) => (
                  <div key={index} className="p-4 border-2 border-slate-300 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <Input
                        placeholder="Title"
                        value={highlight.title}
                        onChange={(e) => updateHighlight(index, 'title', e.target.value)}
                        className="flex-1 mr-2 border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeHighlight(index)}>
                        Remove
                      </Button>
                    </div>
                    <textarea
                      placeholder="Description"
                      value={highlight.description}
                      onChange={(e) => updateHighlight(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
                    />
                      <Input
                        placeholder="Impact (optional)"
                        value={highlight.impact || ''}
                        onChange={(e) => updateHighlight(index, 'impact', e.target.value)}
                        className="border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
                      />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-[#0F172A]">Challenges</label>
                <Button variant="outline" size="sm" onClick={addChallenge} className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50">
                  + Add
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.challenges || []).map((challenge, index) => (
                  <div key={index} className="p-4 border-2 border-slate-300 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <Input
                        placeholder="Title"
                        value={challenge.title}
                        onChange={(e) => updateChallenge(index, 'title', e.target.value)}
                        className="flex-1 mr-2 border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeChallenge(index)}>
                        Remove
                      </Button>
                    </div>
                    <textarea
                      placeholder="Description"
                      value={challenge.description}
                      onChange={(e) => updateChallenge(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={challenge.severity}
                        onChange={(e) => updateChallenge(index, 'severity', e.target.value)}
                        className="px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      <select
                        value={challenge.status}
                        onChange={(e) => updateChallenge(index, 'status', e.target.value)}
                        className="px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-[#0F172A]">Resource Needs</label>
                <Button variant="outline" size="sm" onClick={addResourceNeed} className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50">
                  + Add
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.resourceNeeds || []).map((need, index) => (
                  <div key={index} className="p-4 border-2 border-slate-300 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <select
                        value={need.type}
                        onChange={(e) => updateResourceNeed(index, 'type', e.target.value)}
                        className="px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A] mr-2"
                      >
                        <option value="personnel">Personnel</option>
                        <option value="budget">Budget</option>
                        <option value="equipment">Equipment</option>
                        <option value="training">Training</option>
                        <option value="other">Other</option>
                      </select>
                      <Button variant="ghost" size="sm" onClick={() => removeResourceNeed(index)}>
                        Remove
                      </Button>
                    </div>
                    <textarea
                      placeholder="Description"
                      value={need.description}
                      onChange={(e) => updateResourceNeed(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
                    />
                    <select
                      value={need.priority}
                      onChange={(e) => updateResourceNeed(index, 'priority', e.target.value)}
                      className="px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-[#0F172A]">Next Period Goals</label>
                <Button variant="outline" size="sm" onClick={addGoal} className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50">
                  + Add
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.nextPeriodGoals || []).map((goal, index) => (
                  <div key={index} className="p-4 border-2 border-slate-300 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <Input
                        placeholder="Goal title"
                        value={goal.title}
                        onChange={(e) => updateGoal(index, 'title', e.target.value)}
                        className="flex-1 mr-2 border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeGoal(index)}>
                        Remove
                      </Button>
                    </div>
                    <textarea
                      placeholder="Description"
                      value={goal.description}
                      onChange={(e) => updateGoal(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        placeholder="Target date"
                        value={goal.targetDate}
                        onChange={(e) => updateGoal(index, 'targetDate', e.target.value)}
                      />
                      <select
                        value={goal.priority}
                        onChange={(e) => updateGoal(index, 'priority', e.target.value)}
                        className="px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button 
                variant="outline" 
                onClick={handleSaveDraft} 
                disabled={submitting}
                className="border-2 border-slate-400 bg-white text-slate-700 hover:bg-slate-50 font-semibold px-6"
              >
                Save Draft
              </Button>
              <Button
                variant="gradient"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 shadow-lg"
              >
                {submitting ? 'Submitting...' : 'Submit Update'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {updates.map((update) => (
          <Card key={update.id || update._id} className="border border-slate-200">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">
                    {progressUpdateService.formatPeriod(update.periodStart, update.periodEnd)}
                  </CardTitle>
                  <p className="text-sm text-[#64748B]">
                    Updated: {progressUpdateService.formatDate(update.updateDate)}
                  </p>
                </div>
                <Badge className={getStatusBadge(update.status)}>
                  {update.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-[#64748B]">Employees</p>
                  <p className="text-lg font-semibold">{update.totalEmployees}</p>
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">Reports</p>
                  <p className="text-lg font-semibold">{update.reportsSubmitted}</p>
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">Tasks Completed</p>
                  <p className="text-lg font-semibold">{update.tasksCompleted}</p>
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">Completion Rate</p>
                  <p className="text-lg font-semibold">{update.completionRate}%</p>
                </div>
              </div>
              <Link href={`/department_lead/progress-updates/${update.id || update._id}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
        {updates.length === 0 && (
          <Card className="border border-slate-200">
            <CardContent className="pt-6 text-center">
              <p className="text-[#64748B]">No progress updates found. Create your first update above.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
