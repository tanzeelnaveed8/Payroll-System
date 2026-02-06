"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Employee, type EmploymentType, type EmploymentStatus } from "@/lib/services/employeeService";
import { employeeService } from "@/lib/services/employeeService";
import { ROLES } from "@/lib/constants/roles";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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
];


export default function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    photo: "",
    department: "",
    role: "",
    employmentType: "full-time" as EmploymentType,
    status: "active" as EmploymentStatus,
    joinDate: new Date().toISOString().split("T")[0],
    baseSalary: "",
    contractStart: "",
    contractEnd: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    employeeService.getDepartments().then(setDepartments);
    employeeService.getRoles().then(setRoles);
  }, []);

  // Map backend role values to frontend labels
  useEffect(() => {
    const labelMap: Record<string, string> = {
      'admin': 'Admin',
      'manager': 'Manager',
      'dept_lead': 'Department Lead',
      'employee': 'Employee'
    };
    setRoleOptions(roles.map(role => ({
      value: role,
      label: labelMap[role] || role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')
    })));
  }, [roles]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate password
    if (!formData.password || formData.password.length < 8) {
      setError("Password is required and must be at least 8 characters long");
      setLoading(false);
      return;
    }

    // Validate password strength (optional but recommended)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      setLoading(false);
      return;
    }

    try {
      // Validate monthly salary for employee and manager roles
      if ((formData.role === 'employee' || formData.role === 'manager') && (!formData.baseSalary || parseFloat(formData.baseSalary) <= 0)) {
        setError("Monthly salary is required and must be a positive number for employees and managers");
        setLoading(false);
        return;
      }

      // Create user with password - password will be hashed by backend
      await employeeService.addEmployee({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        photo: formData.photo || undefined,
        department: formData.department,
        role: formData.role,
        employmentType: formData.employmentType,
        status: formData.status,
        joinDate: formData.joinDate,
        baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : undefined,
        contractStart: formData.contractStart || undefined,
        contractEnd: formData.contractEnd || undefined,
      });
      
      setFormData({
        name: "",
        email: "",
        password: "",
        photo: "",
        department: "",
        role: "",
        employmentType: "full-time",
        status: "active",
        joinDate: new Date().toISOString().split("T")[0],
        baseSalary: "",
        contractStart: "",
        contractEnd: "",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      // Extract error message from API response with better error handling
      let errorMessage = "Failed to add employee. Please try again.";
      
      if (err?.message) {
        errorMessage = err.message;
        
        // Handle network errors with more user-friendly messages
        if (err.message.includes('Network error') || err.message.includes('Failed to fetch')) {
          errorMessage = err.message; // Use the improved message from apiClient
        } else if (err.message.includes('Unable to connect')) {
          errorMessage = err.message; // Use the detailed connection error
        } else {
          // For other errors, use the message as-is
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Log detailed error for debugging
      console.error("[AddEmployeeModal] Error adding employee:", {
        error: err,
        message: err?.message,
        stack: err?.stack,
        formData: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department,
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-[#0F172A]">Add New Employee</CardTitle>
            <button
              onClick={onClose}
              className="text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Email <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0F172A]">
                Password <span className="text-[#DC2626]">*</span>
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password for employee login"
                required
                minLength={8}
              />
              <p className="text-xs text-[#64748B]">
                Password must be at least 8 characters long with uppercase, lowercase, and number.
                <br />
                <span className="font-medium text-amber-600">Share this password securely with the employee for login.</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0F172A]">
                Photo URL (Optional)
              </label>
              <Input
                type="url"
                value={formData.photo}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                placeholder="https://example.com/photo.jpg"
              />
              <p className="text-xs text-[#64748B]">
                Enter a URL for the employee photo. If not provided, initials will be used.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Department <span className="text-[#DC2626]">*</span>
                </label>
                <Select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Role <span className="text-[#DC2626]">*</span>
                </label>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="">Select role</option>
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Employment Type <span className="text-[#DC2626]">*</span>
                </label>
                <Select
                  value={formData.employmentType}
                  onChange={(e) =>
                    setFormData({ ...formData, employmentType: e.target.value as EmploymentType })
                  }
                  required
                >
                  {employmentTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Status <span className="text-[#DC2626]">*</span>
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as EmploymentStatus })
                  }
                  required
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              {(formData.role === 'employee' || formData.role === 'manager') && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]">
                    Monthly Salary (Rs) <span className="text-[#DC2626]">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    placeholder="Enter monthly salary"
                    required
                  />
                  <p className="text-xs text-[#64748B]">
                    Monthly salary in PKR (required for employees and managers)
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Join Date <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  required
                />
              </div>
              {formData.employmentType === "contract" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#0F172A]">Contract Start</label>
                    <Input
                      type="date"
                      value={formData.contractStart}
                      onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#0F172A]">Contract End</label>
                    <Input
                      type="date"
                      value={formData.contractEnd}
                      onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 mb-1">Error</p>
                    <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-600 hover:text-red-800 transition-colors flex-shrink-0"
                    aria-label="Dismiss error"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="gradient"
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                {loading ? "Saving..." : "Save Employee"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


