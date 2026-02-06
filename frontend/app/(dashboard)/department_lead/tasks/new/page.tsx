"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { taskService, type TaskPriority } from "@/lib/services/taskService";
import { deptLeadApi } from "@/lib/api/deptLead";
import { toast } from "@/lib/hooks/useToast";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function DepartmentLeadNewTaskPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    employeeId: "",
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    dueDate: "",
    estimatedHours: "",
  });

  useEffect(() => {
    loadDepartmentEmployees();
  }, []);

  const loadDepartmentEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await deptLeadApi.getTeam();
      const employeesList = Array.isArray(response.data?.team) ? response.data.team : [];
      setEmployees(employeesList);
      if (employeesList.length === 0) {
        toast.warning("No employees found in your department. Please contact admin to add employees.");
      }
    } catch (err: any) {
      console.error("Failed to load employees:", err);
      toast.error(err?.message || "Failed to load department employees");
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeId || !formData.title || !formData.dueDate) {
      toast.warning("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await taskService.createTask({
        employeeId: formData.employeeId,
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        dueDate: formData.dueDate,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
      });
      toast.success("Task assigned successfully to employee!");
      router.push("/department_lead/tasks");
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || "Failed to create task. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Assign New Task</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Assign a task to an employee in your department
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/department_lead/tasks")}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0F172A]">
                Employee <span className="text-[#DC2626]">*</span>
              </label>
              <Select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full"
                disabled={loadingEmployees}
                required
              >
                <option value="">
                  {loadingEmployees ? "Loading employees..." : "Select employee"}
                </option>
                {!loadingEmployees && employees.length === 0 ? (
                  <option value="" disabled>No employees available in your department</option>
                ) : (
                  employees.map((emp) => {
                    const positionText = emp.position ? ` | ${emp.position}` : '';
                    const deptText = emp.department ? ` | ${emp.department}` : '';
                    return (
                      <option key={emp._id || emp.id} value={emp._id || emp.id}>
                        {emp.name} ({emp.email}){deptText}{positionText}
                      </option>
                    );
                  })
                )}
              </Select>
              {!loadingEmployees && employees.length === 0 && (
                <p className="text-xs font-semibold text-amber-700 mt-1">
                  No employees found in your department. Please contact admin to add employees.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0F172A]">
                Task Title <span className="text-[#DC2626]">*</span>
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0F172A]">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full min-h-[100px] sm:min-h-[120px] rounded-xl border-2 border-[#2563EB]/30 bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:border-[#2563EB] transition-all resize-y"
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Priority <span className="text-[#DC2626]">*</span>
                </label>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                  className="w-full"
                  required
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
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0F172A]">Estimated Hours</label>
              <Input
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                placeholder="Hours"
                min="0"
                step="0.5"
                className="w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                variant="gradient"
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !formData.employeeId || !formData.title || !formData.dueDate}
              >
                {loading ? "Assigning..." : "Assign Task"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/department_lead/tasks")}
                className="flex-1 border-slate-200"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
