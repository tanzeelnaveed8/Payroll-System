"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { taskService, type Task, type TaskStatus } from "@/lib/services/taskService";
import { useAuth } from "@/lib/contexts/AuthContext";
import FileList from "@/components/files/FileList";
import Link from "next/link";

export default function ManagerTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const taskData = await taskService.getTask(taskId);
      if (!taskData) {
        alert('Task not found');
        router.push('/manager');
        return;
      }
      setTask(taskData);
    } catch (error: any) {
      console.error('Failed to load task:', error);
      alert(error.message || 'Failed to load task');
      router.push('/manager');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: TaskStatus) => {
    if (!task) return;
    
    try {
      setUpdating(true);
      await taskService.updateTaskStatus(task.id, newStatus);
      await loadTask();
      alert(`Task status updated to ${newStatus} successfully!`);
    } catch (error: any) {
      console.error('Error updating task status:', error);
      alert(error.message || 'Failed to update task status');
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-0">
        <div className="text-center py-12">
          <p className="text-[#64748B]">Task not found</p>
          <Link href="/manager">
            <Button variant="outline" className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/manager">
            <Button variant="outline" size="sm" className="mb-4">
              ← Back to Dashboard
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
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate("cancelled")}
                  disabled={updating}
                  className="w-full border-[#DC2626]/20 text-[#DC2626] hover:bg-[#DC2626]/5"
                >
                  {updating ? "Updating..." : "Cancel Task"}
                </Button>
              )}
              {task.status === "completed" && (
                <Badge className="w-full justify-center bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20">
                  ✓ Task Completed
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">Assigned By</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-[#0F172A]">
                {task.assignedByName || 'You'}
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Assigned on {new Date(task.assignedDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

