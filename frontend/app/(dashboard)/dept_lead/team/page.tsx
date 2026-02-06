"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmployeeDetailDrawer from "@/components/employees/EmployeeDetailDrawer";
import { employeeService, type Employee } from "@/lib/services/employeeService";

export default function DeptLeadTeamPage() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch department employees
      // For now, using placeholder
      setEmployees([]);
    } catch (error: any) {
      console.error('Failed to load team data:', error);
      alert(error?.message || 'Failed to load team data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEmployeeClick = async (employeeId: string) => {
    try {
      const employee = await employeeService.getEmployee(employeeId);
      setSelectedEmployee(employee);
      setIsDrawerOpen(true);
    } catch (error: any) {
      console.error('Failed to load employee details:', error);
      alert(error?.message || 'Failed to load employee details.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Department Team</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Manage employees in your department
          </p>
        </div>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-bold text-[#0F172A]">
              Team Members ({filteredEmployees.length})
            </CardTitle>
            <Input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]">
              <p className="text-sm mb-2">No employees found</p>
              <p className="text-xs">Employees in your department will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((employee) => (
                <Card
                  key={employee.id}
                  className="border border-slate-200 bg-white hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleEmployeeClick(employee.id || '')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold">
                        {employee.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-[#0F172A] truncate">
                          {employee.name || 'Unknown'}
                        </h3>
                        <p className="text-xs text-[#64748B] truncate">{employee.email}</p>
                        {employee.employeeId && (
                          <p className="text-xs text-[#64748B] mt-1">ID: {employee.employeeId}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              employee.status === 'active'
                                ? 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20'
                                : 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20'
                            }`}
                          >
                            {employee.status || 'active'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEmployee && (
        <EmployeeDetailDrawer
          employee={selectedEmployee}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
}
