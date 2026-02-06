"use client";

import { useState, useEffect } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { EmployeeFilter, type EmploymentType, type EmploymentStatus } from "@/lib/services/employeeService";
import { employeeService } from "@/lib/services/employeeService";

interface EmployeeFiltersProps {
  filters: EmployeeFilter;
  onFilterChange: (newFilters: Partial<EmployeeFilter>) => void;
}

const employmentTypeOptions = [
  { value: "", label: "All Types" },
  { value: "full-time", label: "Full-Time" },
  { value: "part-time", label: "Part-Time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on-leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];

const formatRoleLabel = (role: string): string => {
  const roleMap: Record<string, string> = {
    'admin': 'Administrator',
    'manager': 'Manager',
    'employee': 'Employee',
    'dept_lead': 'Department Lead',
  };
  return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');
};

export default function EmployeeFilters({ filters, onFilterChange }: EmployeeFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [departments, setDepartments] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    employeeService.getDepartments().then(setDepartments);
    employeeService.getRoles().then(setRoles);
  }, []);

  const handleChange = (field: keyof EmployeeFilter, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value || undefined }));
  };

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleClear = () => {
    const cleared: EmployeeFilter = {};
    setLocalFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#0F172A]">Search</label>
          <Input
            placeholder="Name, email, department..."
            value={localFilters.search || ""}
            onChange={(e) => handleChange("search", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#0F172A]">Department</label>
          <Select
            value={localFilters.department || ""}
            onChange={(e) => handleChange("department", e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#0F172A]">Role</label>
          <Select
            value={localFilters.role || ""}
            onChange={(e) => handleChange("role", e.target.value)}
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {formatRoleLabel(role)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#0F172A]">Employment Type</label>
          <Select
            value={localFilters.employmentType || ""}
            onChange={(e) => handleChange("employmentType", e.target.value)}
          >
            {employmentTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#0F172A]">Status</label>
          <Select
            value={localFilters.status || ""}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleClear} className="text-[#64748B] border-[#E2E8F0]">
          Clear
        </Button>
        <Button
          variant="default"
          onClick={handleApply}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
}



