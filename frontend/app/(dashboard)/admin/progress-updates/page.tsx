'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { progressUpdateService } from '@/lib/services/progressUpdateService';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from '@/lib/hooks/useToast';
import type { ProgressUpdate } from '@/lib/api/progressUpdates';
import Link from 'next/link';

export default function AdminProgressUpdatesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [filters, setFilters] = useState({
    departmentId: '',
    deptLeadId: '',
    startDate: '',
    endDate: ''
  });
  const [selectedUpdate, setSelectedUpdate] = useState<ProgressUpdate | null>(null);
  const [acknowledgmentComments, setAcknowledgmentComments] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);

  const loadUpdates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await progressUpdateService.getUpdates(filters);
      setUpdates(data);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load updates');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  const handleAcknowledge = async (updateId: string) => {
    try {
      setAcknowledging(true);
      await progressUpdateService.acknowledgeUpdate(updateId, acknowledgmentComments);
      toast.success('Progress update acknowledged');
      setSelectedUpdate(null);
      setAcknowledgmentComments('');
      await loadUpdates();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to acknowledge update');
    } finally {
      setAcknowledging(false);
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
            View progress updates from department leads
          </p>
        </div>
      </div>

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
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Department</label>
              <Input
                type="text"
                placeholder="Department name"
                value={filters.departmentId}
                onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                className="border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Dept Lead</label>
              <Input
                type="text"
                placeholder="Dept Lead name"
                value={filters.deptLeadId}
                onChange={(e) => setFilters({ ...filters, deptLeadId: e.target.value })}
                className="border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {updates.map((update) => {
          const deptLead = typeof update.deptLeadId === 'object' ? update.deptLeadId : { name: update.deptLeadName };
          const department = typeof update.departmentId === 'object' ? update.departmentId : { name: update.department };
          
          return (
            <Card key={update.id || update._id} className="border-2 border-slate-300 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold text-[#0F172A]">
                      {typeof department === 'object' ? department.name : department} - {progressUpdateService.formatPeriod(update.periodStart, update.periodEnd)}
                    </CardTitle>
                    <p className="text-sm text-[#64748B] font-medium">
                      By {typeof deptLead === 'object' ? deptLead.name : deptLead} • {progressUpdateService.formatDate(update.updateDate)}
                    </p>
                  </div>
                  <Badge className={getStatusBadge(update.status)}>
                    {update.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-[#64748B]">Employees</p>
                    <p className="text-lg font-semibold">{update.totalEmployees}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B]">Reports Submitted</p>
                    <p className="text-lg font-semibold text-blue-600">{update.reportsSubmitted}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B]">Tasks Completed</p>
                    <p className="text-lg font-semibold text-green-600">{update.tasksCompleted}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B]">Completion Rate</p>
                    <p className="text-lg font-semibold">{update.completionRate}%</p>
                  </div>
                </div>
                {update.highlights && update.highlights.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-[#0F172A] mb-2">Key Highlights</p>
                    <div className="space-y-1">
                      {update.highlights.slice(0, 3).map((h, idx) => (
                        <p key={idx} className="text-sm text-[#64748B]">• {h.title}</p>
                      ))}
                      {update.highlights.length > 3 && (
                        <p className="text-sm text-blue-600">+{update.highlights.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
                {update.challenges && update.challenges.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-[#0F172A] mb-2">Challenges</p>
                    <div className="space-y-1">
                      {update.challenges.slice(0, 2).map((c, idx) => (
                        <p key={idx} className="text-sm text-[#64748B]">
                          • {c.title} ({c.severity})
                        </p>
                      ))}
                      {update.challenges.length > 2 && (
                        <p className="text-sm font-semibold text-amber-700">+{update.challenges.length - 2} more</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <Link href={`/admin/progress-updates/${update.id || update._id}`}>
                    <Button variant="outline" size="sm" className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold">
                      View Details
                    </Button>
                  </Link>
                  {update.status === 'submitted' && (
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={() => setSelectedUpdate(update)}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-md"
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {updates.length === 0 && (
          <Card className="border-2 border-slate-300 bg-white shadow-sm">
            <CardContent className="pt-6 text-center bg-white">
              <p className="text-[#64748B] font-medium">No progress updates found.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedUpdate && selectedUpdate.status === 'submitted' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border-2 border-slate-400 bg-white shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-slate-300">
              <CardTitle className="text-xl font-bold text-[#0F172A]">Acknowledge Update</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUpdate(null)} className="text-[#0F172A] hover:bg-red-100 hover:text-red-600">
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                  Comments (optional)
                </label>
                <textarea
                  value={acknowledgmentComments}
                  onChange={(e) => setAcknowledgmentComments(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border-2 border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#0F172A]"
                  placeholder="Add acknowledgment comments..."
                />
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-200">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedUpdate(null)}
                  className="border-2 border-slate-400 bg-white text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  onClick={() => handleAcknowledge(selectedUpdate.id || selectedUpdate._id || '')}
                  disabled={acknowledging}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg"
                >
                  {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
