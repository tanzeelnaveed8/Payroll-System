"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Link from "next/link";
import { taskService, type Task, type TaskStatus, type TaskPriority, type TaskFilters, type TaskSort } from "@/lib/services/taskService";
import { useAuth } from "@/lib/contexts/AuthContext";
import { toast } from "@/lib/hooks/useToast";
import { usersApi } from "@/lib/api/users";

export default function ManagerTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sort, setSort] = useState<TaskSort>({ field: "assignedDate", direction: "desc" });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deptLeads, setDeptLeads] = useState<any[]>([]);
  const [loadingDeptLeads, setLoadingDeptLeads] = useState(false);
  const [createData, setCreateData] = useState({
    employeeId: "",
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    dueDate: "",
    estimatedHours: "",
  });

  const pageSize = 10;

  // Analytics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    avgProgress: 0,
    totalEstimatedHours: 0,
    totalActualHours: 0,
  });

  const loadDeptLeads = useCallback(async () => {
    setLoadingDeptLeads(true);
    try {
      // Manager can only assign tasks to Department Leads (hierarchical assignment)
      const response = await usersApi.getUsers({ limit: 100, role: "dept_lead", status: "active" });
      const deptLeadsList = Array.isArray(response.data) ? response.data : [];
      setDeptLeads(deptLeadsList);
    } catch (err: any) {
      setDeptLeads([]);
      console.error("Failed to load Department Leads:", err);
    } finally {
      setLoadingDeptLeads(false);
    }
  }, []);

  const loadTasks = useCallback(async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      const result = await taskService.getTasks(filters, sort, page, pageSize);
      const tasksList = Array.isArray(result.data) ? result.data : [];
      setTasks(tasksList);
      setTotal(result.total || 0);
      
      // Calculate statistics
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
        avgProgress: tasksList.length > 0
          ? Math.round(tasksList.reduce((sum, t) => sum + (t.progress || 0), 0) / tasksList.length)
          : 0,
        totalEstimatedHours: tasksList.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
        totalActualHours: tasksList.reduce((sum, t) => sum + (t.actualHours || 0), 0),
      };
      setStats(statsData);
    } catch (err: any) {
      const errorMessage = err?.message || err?.response?.data?.message || "Failed to load tasks. Please try again.";
      
      // Retry logic for network errors
      if (retryCount < 2 && (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch'))) {
        setTimeout(() => {
          loadTasks(retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      setError(errorMessage);
      // Set empty arrays on error to prevent UI issues
      setTasks([]);
      setTotal(0);
      setStats({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        avgProgress: 0,
        totalEstimatedHours: 0,
        totalActualHours: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, sort, page, pageSize]);

  useEffect(() => {
    if (user?.id) {
      loadDeptLeads();
    }
  }, [user?.id, loadDeptLeads]);

  useEffect(() => {
    if (user?.id) {
      loadTasks();
    }
  }, [user?.id, loadTasks]);

  const handleCreateTask = async () => {
    if (!createData.employeeId || !createData.title || !createData.dueDate) {
      toast.warning("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await taskService.createTask({
        employeeId: createData.employeeId,
        title: createData.title,
        description: createData.description || undefined,
        priority: createData.priority,
        dueDate: createData.dueDate,
        estimatedHours: createData.estimatedHours ? parseFloat(createData.estimatedHours) : undefined,
      });
      setShowCreateModal(false);
      setCreateData({
        employeeId: "",
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        estimatedHours: "",
      });
      toast.success("Task created successfully and assigned to Department Lead!");
      setPage(1);
      await loadTasks();
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || "Failed to create task. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] mb-2">Team Tasks Report</h1>
          <p className="text-sm sm:text-base text-[#64748B]">Monitor and track your team&apos;s task progress</p>
        </div>
        <Button
          variant="gradient"
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white w-full sm:w-auto"
          onClick={() => setShowCreateModal(true)}
        >
          Create Task
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[#64748B]">Total Tasks</p>
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-sm">📋</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[#64748B]">In Progress</p>
              <div className="h-8 w-8 rounded-lg bg-[#2563EB]/20 flex items-center justify-center">
                <span className="text-[#2563EB] text-sm">⚡</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-[#2563EB]">{stats.inProgress}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[#64748B]">Completed</p>
              <div className="h-8 w-8 rounded-lg bg-[#16A34A]/20 flex items-center justify-center">
                <span className="text-[#16A34A] text-sm">✓</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-[#16A34A]">{stats.completed}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[#64748B]">Overdue</p>
              <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-sm">⚠️</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#0F172A]">Average Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] h-4 rounded-full transition-all"
                  style={{ width: `${stats.avgProgress}%` }}
                ></div>
              </div>
              <p className="text-lg font-bold text-[#0F172A]">{stats.avgProgress}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#0F172A]">Estimated Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#0F172A]">{stats.totalEstimatedHours.toFixed(1)}h</p>
            <p className="text-xs text-[#64748B] mt-1">Total estimated work time</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#0F172A]">Actual Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#0F172A]">{stats.totalActualHours.toFixed(1)}h</p>
            <p className="text-xs text-[#64748B] mt-1">Time spent so far</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card className="border-2 border-slate-300 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-lg font-bold text-[#0F172A]">Team Tasks</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder="Search tasks..."
                value={filters.search || ""}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full sm:w-64"
              />
              <Select
                value={filters.status || ""}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as TaskStatus || undefined })}
                className="w-full sm:w-auto"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
              <Select
                value={filters.priority || ""}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value as TaskPriority || undefined })}
                className="w-full sm:w-auto"
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-800 font-semibold text-sm mb-1">Failed to load tasks</p>
                  <p className="text-red-600 text-sm">{error}</p>
                  <button
                    onClick={() => loadTasks()}
                    className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
                  >
                    Click to retry
                  </button>
                </div>
              </div>
            </div>
          )}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mb-4"></div>
              <p className="text-[#64748B]">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 && !error ? (
            <div className="text-center py-12 text-[#64748B]">
              <svg className="mx-auto h-12 w-12 text-[#64748B] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-semibold mb-2">No tasks found</p>
              <p className="text-xs">Tasks assigned to your team will appear here</p>
              {user?.role === 'manager' && (
                <p className="text-xs mt-2 text-[#2563EB]">Make sure employees have tasks assigned to them</p>
              )}
            </div>
          ) : tasks.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Task</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Employee</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Priority</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider hidden md:table-cell">Due Date</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Progress</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider hidden lg:table-cell">Hours</th>
                      <th className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                          <Link href={`/manager/tasks/${task.id}`}>
                            <p className="text-xs sm:text-sm font-semibold text-[#0F172A] hover:text-[#2563EB] cursor-pointer">{task.title}</p>
                          </Link>
                          {task.description && (
                            <p className="text-xs text-[#64748B] mt-1 line-clamp-1 hidden sm:block">{task.description}</p>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                          <p className="text-xs sm:text-sm text-[#0F172A]">{task.employeeName || "N/A"}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                          <Badge className={getPriorityBadge(task.priority)}>{task.priority}</Badge>
                        </td>
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                          <Badge className={getStatusBadge(task.status)}>{task.status}</Badge>
                        </td>
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          <p className={`text-xs sm:text-sm ${isOverdue(task.dueDate) && task.status !== "completed" ? "text-red-600 font-semibold" : "text-[#64748B]"}`}>
                            {new Date(task.dueDate).toLocaleDateString()}
                            {isOverdue(task.dueDate) && task.status !== "completed" && (
                              <span className="ml-1">(Overdue)</span>
                            )}
                          </p>
                        </td>
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${task.progress || 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-[#64748B]">{task.progress || 0}%</p>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="text-xs sm:text-sm text-[#64748B]">
                            {task.estimatedHours && <p>Est: {task.estimatedHours}h</p>}
                            {task.actualHours && <p>Act: {task.actualHours}h</p>}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-right">
                          <Link href={`/manager/tasks/${task.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-200 text-[#64748B] hover:bg-slate-50 text-xs sm:text-sm"
                            >
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          {total > pageSize && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs sm:text-sm text-[#64748B] text-center sm:text-left">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} tasks
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="text-xs sm:text-sm"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize >= total}
                  className="text-xs sm:text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-xl border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between pb-4 px-6 pt-6 border-b border-slate-200 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">Create Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#64748B] hover:text-[#0F172A] transition-colors p-1 rounded-lg hover:bg-slate-100"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Department Lead <span className="text-[#DC2626]">*</span>
                </label>
                <Select
                  value={createData.employeeId}
                  onChange={(e) => setCreateData({ ...createData, employeeId: e.target.value })}
                  className="w-full"
                  disabled={loadingDeptLeads}
                >
                  <option value="">
                    {loadingDeptLeads ? "Loading Department Leads..." : "Select Department Lead"}
                  </option>
                  {!loadingDeptLeads && deptLeads.length === 0 ? (
                    <option value="" disabled>No Department Leads available. Please register Department Leads first.</option>
                  ) : (
                    deptLeads.map((deptLead) => {
                      const deptText = deptLead.department ? ` | ${deptLead.department}` : '';
                      const positionText = deptLead.position ? ` | ${deptLead.position}` : '';
                      return (
                        <option key={deptLead.id} value={deptLead.id}>
                          {deptLead.name} ({deptLead.email}){deptText}{positionText}
                        </option>
                      );
                    })
                  )}
                </Select>
                {!loadingDeptLeads && deptLeads.length === 0 && (
                  <p className="text-xs font-semibold text-amber-700 mt-1">
                    No active Department Leads found. Please register Department Leads in the user management section.
                  </p>
                )}
                <p className="text-xs text-[#64748B] mt-1">
                  Note: Tasks assigned to Department Leads will be delegated to relevant employees by the Department Lead.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Title <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  type="text"
                  value={createData.title}
                  onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                  placeholder="Task title"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">Description</label>
                <textarea
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  className="w-full min-h-[100px] sm:min-h-[120px] rounded-xl border-2 border-[#2563EB]/30 bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:border-[#2563EB] transition-all resize-y"
                  placeholder="Task description"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]">
                    Priority <span className="text-[#DC2626]">*</span>
                  </label>
                  <Select
                    value={createData.priority}
                    onChange={(e) => setCreateData({ ...createData, priority: e.target.value as TaskPriority })}
                    className="w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]">
                    Due Date <span className="text-[#DC2626]">*</span>
                  </label>
                  <Input
                    type="date"
                    value={createData.dueDate}
                    onChange={(e) => setCreateData({ ...createData, dueDate: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">Estimated Hours</label>
                <Input
                  type="number"
                  value={createData.estimatedHours}
                  onChange={(e) => setCreateData({ ...createData, estimatedHours: e.target.value })}
                  placeholder="Hours"
                  min="0"
                  step="0.5"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-white">
              <Button
                variant="gradient"
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateTask}
                disabled={!createData.employeeId || !createData.title || !createData.dueDate || loading}
              >
                {loading ? "Creating..." : "Create Task"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-slate-200"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

