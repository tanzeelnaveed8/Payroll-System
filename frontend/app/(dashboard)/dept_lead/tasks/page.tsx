"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Link from "next/link";
import { taskService, type Task, type TaskStatus, type TaskPriority, type TaskFilters, type TaskSort } from "@/lib/services/taskService";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function DeptLeadTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sort, setSort] = useState<TaskSort>({ field: "assignedDate", direction: "desc" });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { user } = useAuth();

  const pageSize = 10;

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  useEffect(() => {
    if (user?.id) {
      loadTasks();
    }
  }, [user, filters, sort, page]);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await taskService.getTasks(filters, sort, page, pageSize);
      const tasksList = Array.isArray(result.data) ? result.data : [];
      setTasks(tasksList);
      setTotal(result.total || 0);
      
      const statsData = {
        total: tasksList.length,
        pending: tasksList.filter((t) => t.status === "pending").length,
        inProgress: tasksList.filter((t) => t.status === "in-progress").length,
        completed: tasksList.filter((t) => t.status === "completed").length,
        overdue: tasksList.filter((t) => {
          const dueDate = new Date(t.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return dueDate < today && t.status !== "completed";
        }).length,
      };
      setStats(statsData);
    } catch (err: any) {
      console.error("Error loading tasks:", err);
      setError(err?.message || "Failed to load tasks. Please try again.");
      setTasks([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20";
      case "in-progress":
        return "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20";
      case "pending":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
      default:
        return "bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20";
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20";
      case "medium":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
      case "low":
        return "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20";
      default:
        return "bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20";
    }
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

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Task Management</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Manage tasks assigned to your department
          </p>
        </div>
        <Link href="/dept_lead/tasks/new">
          <Button variant="gradient" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            Assign Task
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-[#0F172A]">{stats.total}</div>
            <div className="text-sm text-[#64748B]">Total Tasks</div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-[#F59E0B]">{stats.pending}</div>
            <div className="text-sm text-[#64748B]">Pending</div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-[#2563EB]">{stats.inProgress}</div>
            <div className="text-sm text-[#64748B]">In Progress</div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-[#16A34A]">{stats.completed}</div>
            <div className="text-sm text-[#64748B]">Completed</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-bold text-[#0F172A]">Tasks</CardTitle>
            <div className="flex gap-2">
              <Select
                value={filters.status || "all"}
                onChange={(e) => {
                  const status = e.target.value === "all" ? undefined : e.target.value;
                  setFilters({ ...filters, status: status as TaskStatus | undefined });
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </Select>
              <Select
                value={filters.priority || "all"}
                onChange={(e) => {
                  const priority = e.target.value === "all" ? undefined : e.target.value;
                  setFilters({ ...filters, priority: priority as TaskPriority | undefined });
                  setPage(1);
                }}
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20">
              <p className="text-sm text-[#DC2626]">{error}</p>
            </div>
          )}
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]">
              <p className="text-sm mb-2">No tasks found</p>
              <p className="text-xs">Tasks assigned to your department will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <Link key={task.id} href={`/dept_lead/tasks/${task.id}`}>
                  <Card className="border border-slate-200 bg-white hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-[#0F172A]">{task.title}</h3>
                            <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          </div>
                          <p className="text-sm text-[#64748B] mb-3 line-clamp-2">{task.description}</p>
                          <div className="flex items-center gap-4 text-xs text-[#64748B]">
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            {task.employeeName && <span>Assigned to: {task.employeeName}</span>}
                            {task.progress !== undefined && <span>Progress: {task.progress}%</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          {total > pageSize && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-[#64748B]">
                Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * pageSize >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
