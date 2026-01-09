"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { taskService, type Task, type TaskStatus, type TaskPriority } from "@/lib/services/taskService";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function EmployeeTasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [all, current, upcoming] = await Promise.all([
        taskService.getEmployeeTasks(user.id, { limit: 50 }),
        taskService.getEmployeeCurrentTasks(user.id),
        taskService.getEmployeeUpcomingTasks(user.id),
      ]);
      console.log("Tasks loaded:", { all, current, upcoming });
      setTasks(Array.isArray(all.data) ? all.data : []);
      setCurrentTasks(Array.isArray(current) ? current : []);
      setUpcomingTasks(Array.isArray(upcoming) ? upcoming : []);
    } catch (error: any) {
      console.error("Failed to load tasks:", error);
      setTasks([]);
      setCurrentTasks([]);
      setUpcomingTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      alert(`Task status updated to ${newStatus} successfully!`);
      await loadTasks();
    } catch (error: any) {
      console.error("Error updating task status:", error);
      const errorMessage = error?.message || error?.response?.data?.message || "Failed to update task status";
      alert(errorMessage);
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

  const getPriorityBadge = (priority: TaskPriority) => {
    const styles = {
      low: "bg-slate-100 text-slate-600 border-slate-200",
      medium: "bg-blue-100 text-blue-600 border-blue-200",
      high: "bg-orange-100 text-orange-600 border-orange-200",
      urgent: "bg-red-100 text-red-600 border-red-200",
    };
    return styles[priority] || styles.medium;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).setHours(0, 0, 0, 0) !== new Date().setHours(0, 0, 0, 0);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">My Tasks</h1>
        <p className="text-sm sm:text-base text-[#64748B]">View and manage your assigned tasks</p>
      </div>

      {currentTasks.length > 0 && (
        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Current Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border ${
                    isOverdue(task.dueDate) ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#0F172A] mb-1">{task.title}</h3>
                      {task.description && <p className="text-sm text-[#64748B] mb-2">{task.description}</p>}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Badge className={getPriorityBadge(task.priority)}>{task.priority}</Badge>
                      <Badge className={getStatusBadge(task.status)}>{task.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-[#64748B]">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                      {isOverdue(task.dueDate) && <span className="text-red-600 ml-2 font-semibold">(Overdue)</span>}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/employee/tasks/${task.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-200 text-[#64748B] hover:bg-slate-50"
                        >
                          View
                        </Button>
                      </Link>
                      {task.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(task.id, "in-progress")}
                          className="border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB]/10"
                        >
                          Start
                        </Button>
                      )}
                      {task.status === "in-progress" && (
                        <Button
                          variant="gradient"
                          size="sm"
                          className="bg-gradient-to-r from-green-600 to-green-700 text-white"
                          onClick={() => handleStatusUpdate(task.id, "completed")}
                        >
                          Complete
                        </Button>
                      )}
                      {task.status === "completed" && (
                        <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20 text-xs">
                          ✓ Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                  {task.progress > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1">{task.progress}% complete</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {upcomingTasks.length > 0 && (
        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="p-4 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Link href={`/employee/tasks/${task.id}`}>
                        <h3 className="font-semibold text-[#0F172A] mb-1 hover:text-[#2563EB] cursor-pointer">{task.title}</h3>
                      </Link>
                      {task.description && <p className="text-sm text-[#64748B] mb-2 line-clamp-2">{task.description}</p>}
                    </div>
                    <Badge className={getPriorityBadge(task.priority)}>{task.priority}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[#64748B]">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/employee/tasks/${task.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-200 text-[#64748B] hover:bg-slate-50"
                        >
                          View
                        </Button>
                      </Link>
                      {task.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(task.id, "in-progress")}
                          className="border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB]/10"
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]">
              <p className="text-sm mb-2">No tasks found</p>
              <p className="text-xs">Tasks assigned to you will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Task</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Priority</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Due Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <Link href={`/employee/tasks/${task.id}`}>
                          <p className="text-sm font-semibold text-[#0F172A] hover:text-[#2563EB] cursor-pointer">{task.title}</p>
                        </Link>
                        {task.description && (
                          <p className="text-xs text-[#64748B] mt-1 line-clamp-1">{task.description}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getPriorityBadge(task.priority)}>{task.priority}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusBadge(task.status)}>{task.status}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <p className={`text-sm ${isOverdue(task.dueDate) ? "text-red-600" : "text-[#64748B]"}`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${task.progress || 0}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-[#64748B]">{task.progress || 0}%</p>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Link href={`/employee/tasks/${task.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-slate-200 text-[#64748B] hover:bg-slate-50"
                            >
                              View
                            </Button>
                          </Link>
                          {task.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(task.id, "in-progress")}
                              className="text-xs border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB]/10"
                            >
                              Start
                            </Button>
                          )}
                          {task.status === "in-progress" && (
                            <Button
                              variant="gradient"
                              size="sm"
                              className="text-xs bg-gradient-to-r from-green-600 to-green-700 text-white"
                              onClick={() => handleStatusUpdate(task.id, "completed")}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

