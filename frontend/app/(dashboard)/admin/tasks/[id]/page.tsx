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

export default function AdminTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const loadTask = useCallback(async () => {
    try {
      setLoading(true);
      const taskData = await taskService.getTask(taskId);
      if (!taskData) {
        toast.error('Task not found');
        router.push('/admin/tasks');
        return;
      }
      setTask(taskData);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load task';
      toast.error(errorMessage);
      router.push('/admin/tasks');
    } finally {
      setLoading(false);
    }
  }, [taskId, router]);

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId, loadTask]);

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

  const handleDelete = async () => {
    if (!task) return;
    
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await taskService.deleteTask(task.id);
      toast.success('Task deleted successfully!');
      router.push('/admin/tasks');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
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
          <p className="text-[#64748B]">Task not found</p>
          <Link href="/admin/tasks">
            <Button variant="outline" className="mt-4">Back to Tasks</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/tasks">
            <Button variant="outline" size="sm" className="mb-4">
              ← Back to Tasks
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">{task.title}</h1>
          <div className="flex items-center gap-2">
            <Badge className={getStatusBadge(task.status)}>{task.status}</Badge>
            <Badge className={getPriorityBadge(task.priority)}>{task.priority}</Badge>
            {isOverdue(task.dueDate) && task.status !== 'completed' && (
              <Badge className="bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20">Overdue</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.description && (
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-2">Description</h3>
                  <p className="text-sm text-[#64748B] whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Assigned To</p>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {task.employeeName || 'Unknown Employee'}
                  </p>
                  {task.employeeDepartment && (
                    <p className="text-xs text-[#64748B]">{task.employeeDepartment}</p>
                  )}
                  {task.employeeEmail && (
                    <p className="text-xs text-[#64748B]">{task.employeeEmail}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Assigned By</p>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {task.assignedByName || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Assigned Date</p>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {new Date(task.assignedDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Due Date</p>
                  <p className={`text-sm font-semibold ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-[#DC2626]' : 'text-[#0F172A]'}`}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
                {task.startDate && (
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Start Date</p>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {new Date(task.startDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {task.completedDate && (
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Completed Date</p>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {new Date(task.completedDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {task.estimatedHours && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-[#64748B] mb-1">Estimated Hours</p>
                  <p className="text-sm font-semibold text-[#0F172A]">{task.estimatedHours}h</p>
                </div>
              )}

              {task.actualHours && (
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Actual Hours</p>
                  <p className="text-sm font-semibold text-[#0F172A]">{task.actualHours}h</p>
                </div>
              )}

              {task.progress > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-[#64748B]">Progress</p>
                    <p className="text-sm font-semibold text-[#0F172A]">{task.progress}%</p>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-[#2563EB] h-3 rounded-full transition-all"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-[#64748B] mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, idx) => (
                      <Badge key={idx} className="bg-slate-100 text-slate-700 border-slate-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {task.category && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-[#64748B] mb-1">Category</p>
                  <p className="text-sm font-semibold text-[#0F172A]">{task.category}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">Attachments</CardTitle>
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

        <div className="space-y-6">
          <Card className="border border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.status !== "completed" && task.status !== "cancelled" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={updating}
                    className="w-full border-[#DC2626]/20 text-[#DC2626] hover:bg-[#DC2626]/5"
                  >
                    {updating ? "Updating..." : "Cancel Task"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate("completed")}
                    disabled={updating}
                    className="w-full border-[#16A34A]/20 text-[#16A34A] hover:bg-[#16A34A]/5"
                  >
                    {updating ? "Updating..." : "Mark as Completed"}
                  </Button>
                </>
              )}
              {task.status === "completed" && (
                <Badge className="w-full justify-center bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20">
                  ✓ Task Completed
                </Badge>
              )}
              <div className="pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full border-[#DC2626]/20 text-[#DC2626] hover:bg-[#DC2626]/5"
                >
                  {deleting ? "Deleting..." : "Delete Task"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="min-w-0">
                <p className="text-xs text-[#64748B] mb-1">Task ID</p>
                <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 overflow-x-auto">
                  <p className="text-xs sm:text-sm font-mono text-[#0F172A] break-all">
                    {task.id}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Assigned By</p>
                <p className="text-sm font-semibold text-[#0F172A]">
                  {task.assignedByName || 'Unknown'}
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  {new Date(task.assignedDate).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

