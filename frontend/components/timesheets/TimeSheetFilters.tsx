"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import type { TimesheetFilter } from "@/lib/services/timesheetService";

interface TimeSheetFiltersProps {
  filters: TimesheetFilter;
  onFilterChange: (filters: TimesheetFilter) => void;
  departments: string[];
  roles: string[];
}

export default function TimeSheetFilters({
  filters,
  onFilterChange,
  departments,
  roles,
}: TimeSheetFiltersProps) {
  const [localFilters, setLocalFilters] = useState<TimesheetFilter>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (key: keyof TimesheetFilter, value: string) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: TimesheetFilter = {};
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <Card className="border border-slate-200 bg-white">
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-[#0F172A]">
              Employee Name
            </label>
            <Input
              placeholder="Search by name"
              value={localFilters.employeeName || ""}
              onChange={(e) => handleChange("employeeName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-[#0F172A]">
              Department
            </label>
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

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-[#0F172A]">
              Role
            </label>
            <Select
              value={localFilters.role || ""}
              onChange={(e) => handleChange("role", e.target.value)}
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-[#0F172A]">
              Date From
            </label>
            <Input
              type="date"
              value={localFilters.dateFrom || ""}
              onChange={(e) => handleChange("dateFrom", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-[#0F172A]">
              Date To
            </label>
            <Input
              type="date"
              value={localFilters.dateTo || ""}
              onChange={(e) => handleChange("dateTo", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-[#0F172A]">
              Status
            </label>
            <Select
              value={localFilters.status || ""}
              onChange={(e) => handleChange("status", e.target.value as any)}
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="default" 
            onClick={handleReset}
            className="border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-colors"
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

