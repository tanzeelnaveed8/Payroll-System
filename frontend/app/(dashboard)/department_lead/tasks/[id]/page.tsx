"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { taskService, type Task, type TaskStatus } from "@/lib/services/taskService";
import { useAuth } from "@/lib/contexts/AuthContext";
import FileList from "@/components/files/FileList";
import Link from "next/link";
import { toast } from "@/lib/hooks/useToast";

interface TaskUpdate {
  type: 'created' | 'status_changed' | 'updated' | 'progress_updated';
  description: string;
  date: Date;
  user?: string;
  oldValue?: string;
  newValue?: string;
}

export default function DepartmentLeadTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateHistory, setUpdateHistory] = useState<TaskUpdate[]>([]);
  const { user } = useAuth();

  const loadTask = useCallback(async () => {
    try {
      setLoading(true);
      const taskData = await taskService.getTask(taskId);
      if (!taskData) {
        toast.error('Task not found');
        router.push('/department_lead/tasks');
        return;
      }
      setTask(taskData);
      buildUpdateHistory(taskData);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load task';
      toast.error(errorMessage);
      router.push('/department_lead/tasks');
    } finally {
      setLoading(false);
    }
  }, [taskId, router]);

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId, loadTask]);

  const buildUpdateHistory = (taskData: Task) => {
    const history: TaskUpdate[] = [];
    
    // Task created
    if (taskData.createdAt || taskData.assignedDate) {
      history.push({
        type: 'created',
        description: 'Task was created and assigned',
        date: new Date(taskData.createdAt || taskData.assignedDate),
        user: taskData.assignedByName || 'System'
      });
    }

    // Status changes (inferred from dates)
    if (taskData.startDate && taskData.status === 'in-progress') {
      history.push({
        type: 'status_changed',
        description: 'Task started',
        date: new Date(taskData.startDate),
        oldValue: 'pending',
        newValue: 'in-progress'
      });
    }

    if (taskData.completedDate && taskData.status === 'completed') {
      history.push({
        type: 'status_changed',
        description: 'Task completed',
        date: new Date(taskData.completedDate),
        oldValue: taskData.startDate ? 'in-progress' : 'pending',
        newValue: 'completed'
      });
    }

    // Progress updates
    if (taskData.progress && taskData.progress > 0 && taskData.progress < 100) {
      history.push({
        type: 'progress_updated',
        description: `Progress updated to ${taskData.progress}%`,
        date: new Date(taskData.updatedAt || taskData.assignedDate),
        newValue: `${taskData.progress}%`
      });
    }

    // Last update
    if (taskData.updatedAt && taskData.updatedAt !== taskData.createdAt) {
      history.push({
        type: 'updated',
        description: 'Task details were updated',
        date: new Date(taskData.updatedAt),
        user: 'System'
      });
    }

    // Sort by date (newest first)
    history.sort((a, b) => b.date.getTime() - a.date.getTime());
    setUpdateHistory(history);
  };

  const handleStatusUpdate = async (newStatus: TaskStatus) => {
    if (!task) return;
    
    try {
      setUpdating(true);
      await taskService.updateTaskStatus(task.id, newStatus);
      await loadTask();
      toast.success(`Task status updated to ${newStatus} successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    const styles = {
      pending: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
      "in-progress": "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
      completed: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
      cancelled: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20",
    };
    return styles[status] || styles.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: "bg-slate-100 text-slate-600 border-slate-200",
      medium: "bg-blue-100 text-blue-600 border-blue-200",
      high: "bg-orange-100 text-orange-600 border-orange-200",
      urgent: "bg-red-100 text-red-600 border-red-200",
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  const getUpdateIcon = (type: TaskUpdate['type']) => {
    switch (type) {
      case 'created':
        return '✨';
      case 'status_changed':
        return '🔄';
      case 'progress_updated':
        return '📊';
      case 'updated':
        return '✏️';
      default:
        return '📝';
    }
  };

  const getUpdateColor = (type: TaskUpdate['type']) => {
    switch (type) {
      case 'created':
        return 'bg-blue-100 text-blue-600';
      case 'status_changed':
        return 'bg-purple-100 text-purple-600';
      case 'progress_updated':
        return 'bg-green-100 text-green-600';
      case 'updated':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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

  if (!task) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="text-center py-12">
          <p className="text-[#64748B] mb-4">Task not found</p>
          <Link href="/department_lead/tasks">
            <Button variant="outline">Back to Tasks</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <Link href="/department_lead/tasks">
            <Button 
              size="sm" 
              className="mb-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg font-semibold px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Tasks
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-3">{task.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${getStatusBadge(task.status)} font-semibold px-3 py-1`}>
              {task.status}
            </Badge>
            <Badge className={`${getPriorityBadge(task.priority)} font-semibold px-3 py-1`}>
              {task.priority}
            </Badge>
            {isOverdue(task.dueDate) && task.status !== 'completed' && (
              <Badge className="bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20 font-semibold px-3 py-1">
                Overdue
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-[#0F172A]">Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {task.description && (
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Description</h3>
                  <p className="text-sm text-[#64748B] whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                    {task.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">Assigned To</p>
                  <p className="text-base font-bold text-[#0F172A]">
                    {task.employeeName || 'Unknown Employee'}
                  </p>
                  {task.employeeDepartment && (
                    <p className="text-xs text-[#64748B] mt-1">{task.employeeDepartment}</p>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">Assigned By</p>
                  <p className="text-base font-bold text-[#0F172A]">
                    {task.assignedByName || 'Unknown'}
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">
                    {new Date(task.assignedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">Due Date</p>
                  <p className={`text-base font-bold ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-[#DC2626]' : 'text-[#0F172A]'}`}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                  {isOverdue(task.dueDate) && task.status !== 'completed' && (
                    <p className="text-xs text-[#DC2626] mt-1">Overdue</p>
                  )}
                </div>
                {task.startDate && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">Start Date</p>
                    <p className="text-base font-bold text-[#0F172A]">
                      {new Date(task.startDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {task.completedDate && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">Completed Date</p>
                    <p className="text-base font-bold text-[#16A34A]">
                      {new Date(task.completedDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {task.estimatedHours && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-[#0F172A]">Estimated Hours</p>
                    <p className="text-lg font-bold text-[#2563EB]">{task.estimatedHours}h</p>
                  </div>
                </div>
              )}

              {task.actualHours && (
                <div>
                  <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-[#0F172A]">Actual Hours</p>
                    <p className="text-lg font-bold text-[#16A34A]">{task.actualHours}h</p>
                  </div>
                </div>
              )}

              {task.progress !== undefined && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-[#0F172A]">Progress</p>
                    <p className="text-lg font-bold text-[#2563EB]">{task.progress}%</p>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${task.progress}%` }}
                    >
                      {task.progress > 10 && (
                        <span className="text-xs font-bold text-white">{task.progress}%</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-semibold text-[#0F172A] mb-3">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, idx) => (
                      <Badge key={idx} className="bg-slate-100 text-slate-700 border-slate-200 px-3 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {task.category && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-semibold text-[#0F172A] mb-2">Category</p>
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 px-3 py-1">
                    {task.category}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Update History */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-[#0F172A]">Update History</CardTitle>
              <p className="text-sm text-[#64748B] mt-1">Track all changes and updates to this task</p>
            </CardHeader>
            <CardContent>
              {updateHistory.length === 0 ? (
                <div className="text-center py-8 text-[#64748B]">
                  <p className="text-sm">No update history available</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                  
                  <div className="space-y-6">
                    {updateHistory.map((update, index) => (
                      <div key={index} className="relative flex items-start gap-4">
                        {/* Icon */}
                        <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${getUpdateColor(update.type)} flex items-center justify-center text-xl shadow-md`}>
                          {getUpdateIcon(update.type)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <p className="text-sm font-semibold text-[#0F172A]">
                                {update.description}
                              </p>
                              <p className="text-xs text-[#64748B] whitespace-nowrap">
                                {update.date.toLocaleDateString()} {update.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {update.oldValue && update.newValue && (
                              <div className="flex items-center gap-2 text-xs">
                                <Badge className="bg-slate-200 text-slate-700 px-2 py-0.5">
                                  {update.oldValue}
                                </Badge>
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                <Badge className="bg-blue-100 text-blue-700 px-2 py-0.5">
                                  {update.newValue}
                                </Badge>
                              </div>
                            )}
                            {update.user && (
                              <p className="text-xs text-[#64748B] mt-2">
                                by {update.user}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-[#0F172A]">Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <FileList
                entityType="task_attachment"
                entityId={task.id}
                showUpload={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.status !== "completed" && task.status !== "cancelled" && (
                <>
                  {task.status === "pending" && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate("in-progress")}
                      disabled={updating}
                      className="w-full border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5 font-semibold"
                    >
                      {updating ? "Updating..." : "Start Task"}
                    </Button>
                  )}
                  {task.status === "in-progress" && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate("completed")}
                      disabled={updating}
                      className="w-full border-[#16A34A]/20 text-[#16A34A] hover:bg-[#16A34A]/5 font-semibold"
                    >
                      {updating ? "Updating..." : "Mark as Completed"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={updating}
                    className="w-full border-[#DC2626]/20 text-[#DC2626] hover:bg-[#DC2626]/5 font-semibold"
                  >
                    {updating ? "Updating..." : "Cancel Task"}
                  </Button>
                </>
              )}
              {task.status === "completed" && (
                <div className="w-full bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-lg p-4 text-center">
                  <p className="text-sm font-semibold text-[#16A34A]">✓ Task Completed</p>
                </div>
              )}
              {task.status === "cancelled" && (
                <div className="w-full bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg p-4 text-center">
                  <p className="text-sm font-semibold text-[#DC2626]">Task Cancelled</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#64748B] mb-1 uppercase tracking-wide">Task ID</p>
                <p className="text-sm font-mono text-[#0F172A]">{task.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] mb-1 uppercase tracking-wide">Created</p>
                <p className="text-sm text-[#0F172A]">
                  {new Date(task.createdAt || task.assignedDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] mb-1 uppercase tracking-wide">Last Updated</p>
                <p className="text-sm text-[#0F172A]">
                  {new Date(task.updatedAt || task.assignedDate).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
