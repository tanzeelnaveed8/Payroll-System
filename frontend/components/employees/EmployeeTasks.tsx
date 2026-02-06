"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { taskService, type Task, type TaskStatus, type TaskPriority } from "@/lib/services/taskService";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/AuthContext";

interface EmployeeTasksProps {
  employeeId: string;
}

const getStatusBadge = (status: TaskStatus) => {
  const styles = {
    pending: "bg-slate-100 text-slate-700 border-slate-200",
    "in-progress": "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
    completed: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
    cancelled: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20",
  };
  return styles[status];
};

const getPriorityBadge = (priority: TaskPriority) => {
  const styles = {
    low: "bg-slate-100 text-slate-700 border-slate-200",
    medium: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
    high: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20",
    urgent: "bg-[#DC2626]/20 text-[#DC2626] border-[#DC2626]/40 font-bold",
  };
  return styles[priority];
};

export default function EmployeeTasks({ employeeId }: EmployeeTasksProps) {
  const { user } = useAuth();
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    dueDate: "",
  });

  // Only dept_lead can assign tasks directly to employees (hierarchical assignment)
  const canAssignTask = user?.role === 'dept_lead';

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [current, upcoming] = await Promise.all([
        taskService.getCurrentTasks(employeeId),
        taskService.getUpcomingTasks(employeeId),
      ]);
      setCurrentTasks(current);
      setUpcomingTasks(upcoming);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.title || !assignForm.dueDate) return;

    try {
      await taskService.assignTask({
        employeeId,
        title: assignForm.title,
        description: assignForm.description,
        status: "pending",
        priority: assignForm.priority,
        dueDate: assignForm.dueDate,
      });
      setAssignForm({ title: "", description: "", priority: "medium", dueDate: "" });
      setShowAssignForm(false);
      loadTasks();
    } catch (error) {
      console.error("Failed to assign task:", error);
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, status);
      loadTasks();
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">Task Management</h3>
        {canAssignTask && (
          <Button
            variant="gradient"
            size="sm"
            onClick={() => setShowAssignForm(!showAssignForm)}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs sm:text-sm"
          >
            {showAssignForm ? "Cancel" : "+ Assign Task"}
          </Button>
        )}
        {!canAssignTask && (user?.role === 'admin' || user?.role === 'manager') && (
          <p className="text-xs text-[#64748B] italic">
            Note: Assign tasks to Department Leads, who will delegate to employees
          </p>
        )}
      </div>

      {showAssignForm && (
        <Card className="border border-slate-200 bg-slate-50/50">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-bold text-[#0F172A]">Assign New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssignTask} className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                  Task Title <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  value={assignForm.title}
                  onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                  className="text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                  Description
                </label>
                <textarea
                  value={assignForm.description}
                  onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                  placeholder="Enter task description"
                  className="flex w-full rounded-xl border-2 border-slate-300 bg-white text-[#0F172A] px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:border-[#2563EB]/60 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md focus:shadow-lg min-h-[80px] sm:min-h-[100px] resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                    Priority
                  </label>
                  <Select
                    value={assignForm.priority}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, priority: e.target.value as TaskPriority })
                    }
                    className="text-xs sm:text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                    Due Date <span className="text-[#DC2626]">*</span>
                  </label>
                  <Input
                    type="date"
                    value={assignForm.dueDate}
                    onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs sm:text-sm"
                >
                  Assign Task
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAssignForm(false);
                    setAssignForm({ title: "", description: "", priority: "medium", dueDate: "" });
                  }}
                  className="w-full sm:flex-1 text-xs sm:text-sm"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border border-slate-200">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-bold text-[#0F172A]">Current Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB]"></div>
            </div>
          ) : currentTasks.length === 0 ? (
            <p className="text-sm text-[#64748B] text-center py-4">No current tasks</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {currentTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 sm:p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-semibold text-sm sm:text-base text-[#0F172A] break-words">{task.title}</h4>
                        <Badge className={cn("text-xs flex-shrink-0", getStatusBadge(task.status || "pending"))}>
                          {task.status ? task.status.replace("-", " ") : "Pending"}
                        </Badge>
                        <Badge className={cn("text-xs flex-shrink-0", getPriorityBadge(task.priority || "medium"))}>
                          {task.priority || "Medium"}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs sm:text-sm text-[#64748B] mb-2 break-words">{task.description}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-[#64748B]">
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}</span>
                        <span>Assigned: {task.assignedDate ? new Date(task.assignedDate).toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>
                    {task.status !== "completed" && task.status !== "cancelled" && (
                      <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
                        {task.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(task.id, "in-progress")}
                            className="border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5 w-full sm:w-auto text-xs sm:text-sm"
                          >
                            Start
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(task.id, "completed")}
                          className="border-[#16A34A]/20 text-[#16A34A] hover:bg-[#16A34A]/5 w-full sm:w-auto text-xs sm:text-sm"
                        >
                          Complete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-200">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-bold text-[#0F172A]">Upcoming Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB]"></div>
            </div>
          ) : upcomingTasks.length === 0 ? (
            <p className="text-sm text-[#64748B] text-center py-4">No upcoming tasks</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 sm:p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-semibold text-sm sm:text-base text-[#0F172A] break-words">{task.title}</h4>
                        <Badge className={cn("text-xs flex-shrink-0", getStatusBadge(task.status || "pending"))}>
                          {task.status ? task.status.replace("-", " ") : "Pending"}
                        </Badge>
                        <Badge className={cn("text-xs flex-shrink-0", getPriorityBadge(task.priority || "medium"))}>
                          {task.priority || "Medium"}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs sm:text-sm text-[#64748B] mb-2 break-words">{task.description}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-[#64748B]">
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}</span>
                        <span>Assigned: {task.assignedDate ? new Date(task.assignedDate).toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(task.id, "in-progress")}
                        className="border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5 w-full sm:w-auto text-xs sm:text-sm"
                      >
                        Start
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

