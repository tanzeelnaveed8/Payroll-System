"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Employee, employeeService, type EmploymentType, type EmploymentStatus } from "@/lib/services/employeeService";

interface EditEmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: (updated: Employee) => void;
}

const employmentTypeOptions = [
  { value: "full-time", label: "Full-Time" },
  { value: "part-time", label: "Part-Time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on-leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];

export default function EditEmployeeModal({
  isOpen,
  employee,
  onClose,
  onSuccess,
}: EditEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    photo: "",
    department: "",
    role: "",
    employmentType: "full-time" as EmploymentType,
    status: "active" as EmploymentStatus,
    baseSalary: "",
    position: "",
    phone: "",
    employeeId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    employeeService.getDepartments().then(setDepartments);
    employeeService.getRoles().then(setRoles);
  }, []);

  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        name: employee.name || "",
        email: employee.email || "",
        photo: employee.photo || "",
        department: employee.department || "",
        role: employee.role || "",
        employmentType: (employee.employmentType as EmploymentType) || "full-time",
        status: (employee.status as EmploymentStatus) || "active",
        baseSalary: employee.baseSalary != null ? String(employee.baseSalary) : "",
        position: employee.position || "",
        phone: employee.phone || "",
        employeeId: employee.employeeId || "",
      });
      setError(null);
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setLoading(true);
    setError(null);

    try {
      // Validate monthly salary for employee and manager roles
      if (
        (formData.role === "employee" || formData.role === "manager") &&
        (formData.baseSalary === "" || parseFloat(formData.baseSalary) <= 0)
      ) {
        setError("Monthly salary is required and must be a positive number for employees and managers");
        setLoading(false);
        return;
      }

      const updated = await employeeService.updateEmployee(employee.id, {
        name: formData.name,
        email: formData.email,
        photo: formData.photo || undefined,
        department: formData.department || undefined,
        role: formData.role,
        employmentType: formData.employmentType,
        status: formData.status,
        baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : undefined,
        position: formData.position || undefined,
        phone: formData.phone || undefined,
        employeeId: formData.employeeId || undefined,
      });

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      const message =
        err?.message ||
        "Failed to update employee. Please review the details and try again.";
      setError(message);
      console.error("Failed to update employee:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl">
        <Card className="border border-slate-200 shadow-2xl">
          <CardHeader className="pb-3 sm:pb-4 border-b border-slate-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-[#0F172A]">
              Edit Employee
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                    Full Name <span className="text-[#DC2626]">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter full name"
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                    Email <span className="text-[#DC2626]">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="Enter work email"
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                    Role <span className="text-[#DC2626]">*</span>
                  </label>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                    className="text-xs sm:text-sm"
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1).replace("_", " ")}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                    Department
                  </label>
                  <Select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="text-xs sm:text-sm"
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                    Employment Type
                  </label>
                  <Select
                    value={formData.employmentType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employmentType: e.target.value as EmploymentType,
                      })
                    }
                    className="text-xs sm:text-sm"
                  >
                    {employmentTypeOptions.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as EmploymentStatus,
                      })
                    }
                    className="text-xs sm:text-sm"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                    Monthly Salary (PKR)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={formData.baseSalary}
                    onChange={(e) =>
                      setFormData({ ...formData, baseSalary: e.target.value })
                    }
                    placeholder="Enter monthly salary"
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                    Position / Job Title
                  </label>
                  <Input
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    placeholder="e.g. Senior Developer"
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                    Employee ID
                  </label>
                  <Input
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeId: e.target.value })
                    }
                    placeholder="Optional employee code"
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 block">
                    Phone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Contact number"
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="gradient"
                  className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs sm:text-sm"
                >
                  {loading ? "Saving changes..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={onClose}
                  className="w-full sm:flex-1 text-xs sm:text-sm"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

