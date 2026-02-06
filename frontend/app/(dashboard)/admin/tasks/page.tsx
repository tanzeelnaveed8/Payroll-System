"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Link from "next/link";
import { taskService, type Task, type TaskStatus, type TaskPriority, type TaskFilters, type TaskSort } from "@/lib/services/taskService";
import { usersApi } from "@/lib/api/users";
import { toast } from "@/lib/hooks/useToast";

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sort, setSort] = useState<TaskSort>({ field: "assignedDate", direction: "desc" });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [createData, setCreateData] = useState({
    employeeId: "",
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    dueDate: "",
    estimatedHours: "",
  });

  const pageSize = 10;

  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      // Admin can only assign tasks to Department Leads (hierarchical assignment)
      const response = await usersApi.getUsers({ limit: 100, role: "dept_lead", status: "active" });
      const deptLeadsList = Array.isArray(response.data) ? response.data : [];
      setEmployees(deptLeadsList);
      if (deptLeadsList.length === 0) {
        toast.warning("No active Department Leads found. Please register Department Leads first.");
      }
    } catch (err: any) {
      setEmployees([]);
      const errorMessage = err?.message || err?.toString() || "Unknown error";
      // Only show toast if it's not a validation error (which is handled by the backend)
      if (!errorMessage.includes("charAt") && !errorMessage.includes("Cannot read properties")) {
        toast.error(`Failed to load Department Leads: ${errorMessage}`);
      }
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await taskService.getTasks(filters, sort, page, pageSize);
      setTasks(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to load tasks. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, page, pageSize]);

  useEffect(() => {
    loadEmployees();
    loadTasks();
  }, [loadEmployees, loadTasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await taskService.deleteTask(id);
      toast.success("Task deleted successfully");
      await loadTasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
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

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] mb-2">Manage Tasks</h1>
          <p className="text-sm sm:text-base text-[#64748B]">Assign and manage employee tasks</p>
        </div>
        <Button
          variant="gradient"
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white w-full sm:w-auto"
          onClick={() => setShowCreateModal(true)}
        >
          Create Task
        </Button>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle className="text-lg font-bold text-[#0F172A]">Tasks</CardTitle>
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {loading ? (
            <div className="text-center py-12 text-[#64748B]">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]">
              <p className="text-sm mb-2">No tasks found</p>
              <p className="text-xs">Create a new task to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Task</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider hidden sm:table-cell">Employee</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Priority</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider hidden md:table-cell">Due Date</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider hidden lg:table-cell">Progress</th>
                      <th className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                          <Link href={`/admin/tasks/${task.id}`}>
                            <p className="text-xs sm:text-sm font-semibold text-[#0F172A] hover:text-[#2563EB] cursor-pointer">{task.title}</p>
                          </Link>
                          <p className="text-xs text-[#64748B] mt-1 sm:hidden">{task.employeeName || "N/A"}</p>
                          {task.description && (
                            <p className="text-xs text-[#64748B] mt-1 line-clamp-1 hidden sm:block">{task.description}</p>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                          <p className="text-xs sm:text-sm text-[#0F172A]">{task.employeeName || "N/A"}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                          <Badge className={getPriorityBadge(task.priority)}>{task.priority}</Badge>
                        </td>
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                          <Badge className={getStatusBadge(task.status)}>{task.status}</Badge>
                        </td>
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          <p className="text-xs sm:text-sm text-[#64748B]">{new Date(task.dueDate).toLocaleDateString()}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="w-20 sm:w-24 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-[#64748B] mt-1">{task.progress}%</p>
                        </td>
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/tasks/${task.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-200 text-[#64748B] hover:bg-slate-50 text-xs sm:text-sm"
                              >
                                View
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-600 hover:bg-red-50 text-xs sm:text-sm"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                  disabled={loadingEmployees}
                >
                  <option value="">
                    {loadingEmployees ? "Loading Department Leads..." : "Select Department Lead"}
                  </option>
                  {!loadingEmployees && employees.length === 0 ? (
                    <option value="" disabled>No Department Leads available. Please register Department Leads first.</option>
                  ) : (
                    employees.map((deptLead) => {
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
                {!loadingEmployees && employees.length === 0 && (
                  <p className="text-xs font-semibold text-amber-700 mt-1">
                    No active Department Leads found. Please register Department Leads in the user management section.
                  </p>
                )}
                <p className="text-xs text-[#64748B] mt-1">
                  Note: Tasks assigned to Department Leads will be delegated to relevant employees by the Department Lead.
                </p>
                {createData.employeeId && (() => {
                  const selectedEmp = employees.find(e => e.id === createData.employeeId);
                  if (selectedEmp && (selectedEmp.skills?.length > 0 || selectedEmp.fields?.length > 0)) {
                    return (
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs font-semibold text-[#0F172A] mb-1">Employee Details:</p>
                        {selectedEmp.department && (
                          <p className="text-xs text-[#64748B]"><span className="font-medium">Department:</span> {selectedEmp.department}</p>
                        )}
                        {selectedEmp.position && (
                          <p className="text-xs text-[#64748B]"><span className="font-medium">Position:</span> {selectedEmp.position}</p>
                        )}
                        {selectedEmp.skills && selectedEmp.skills.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-[#0F172A] mb-1">Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedEmp.skills.map((skill: string, idx: number) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedEmp.fields && selectedEmp.fields.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-[#0F172A] mb-1">Fields:</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedEmp.fields.map((field: string, idx: number) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                  {field}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
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

