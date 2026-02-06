"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmployeeDetailDrawer from "@/components/employees/EmployeeDetailDrawer";
import { employeeService, type Employee } from "@/lib/services/employeeService";
import { deptLeadService } from "@/lib/services/deptLeadService";
import { useAuth } from "@/lib/contexts/AuthContext";
import { toast } from "@/lib/hooks/useToast";

export default function DepartmentLeadTeamPage() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Use dept_lead specific API to get all department employees
      const teamMembers = await deptLeadService.getTeam();
      // Map team members to Employee format
      const mappedEmployees: Employee[] = teamMembers.map(member => ({
        id: member.id || member._id,
        _id: member._id || member.id,
        name: member.name,
        email: member.email,
        role: 'employee',
        employeeId: member.employeeId,
        department: member.department,
        position: member.position,
        status: (member.status as 'active' | 'inactive' | 'on-leave' | 'terminated') || 'active',
      }));
      setEmployees(mappedEmployees);
      setTotal(mappedEmployees.length);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load team data';
      toast.error(errorMessage);
      setEmployees([]);
      setTotal(0);
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
      if (employee) {
        setSelectedEmployee(employee);
        setIsDrawerOpen(true);
      } else {
        toast.error('Employee not found');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load employee details.';
      toast.error(errorMessage);
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
            View and manage employees in your department
          </p>
        </div>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-[#0F172A]">
                Team Members
              </CardTitle>
              <p className="text-sm text-[#64748B] mt-1">
                {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'} in your department
              </p>
            </div>
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
            <div className="text-center py-16 text-[#64748B]">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-base font-semibold mb-2 text-[#0F172A]">No employees found</p>
              <p className="text-sm">Employees in your department will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEmployees.map((employee) => (
                <Card
                  key={employee.id}
                  className="border-2 border-slate-200 bg-white hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                  onClick={() => handleEmployeeClick(employee.id || '')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {employee.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-[#0F172A] truncate group-hover:text-[#2563EB] transition-colors">
                          {employee.name || 'Unknown'}
                        </h3>
                        <p className="text-sm text-[#64748B] truncate mt-1">{employee.email}</p>
                        {employee.employeeId && (
                          <p className="text-xs text-[#64748B] mt-1 font-mono">ID: {employee.employeeId}</p>
                        )}
                        {employee.department && (
                          <p className="text-xs text-[#64748B] mt-1">{employee.department}</p>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                          <Badge
                            className={`text-xs font-semibold px-2.5 py-1 ${
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
          {total > pageSize && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-slate-200">
              <p className="text-xs sm:text-sm text-[#64748B]">
                Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className={`${
                    page === 1 || loading
                      ? "border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50"
                      : "border-2 border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white bg-white shadow-sm hover:shadow-md active:bg-[#1D4ED8] active:border-[#1D4ED8]"
                  } font-semibold px-4 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm transition-all`}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * pageSize >= total || loading}
                  className={`${
                    page * pageSize >= total || loading
                      ? "border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50"
                      : "border-2 border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white bg-white shadow-sm hover:shadow-md active:bg-[#1D4ED8] active:border-[#1D4ED8]"
                  } font-semibold px-4 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm transition-all`}
                >
                  Next
                </Button>
              </div>
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
