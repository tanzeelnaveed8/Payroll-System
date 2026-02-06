"use client";

import { Employee } from "@/lib/services/employeeService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmployeeTasks from "./EmployeeTasks";
import FileList from "@/components/files/FileList";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/AuthContext";
import { usersApi } from "@/lib/api/users";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getProfileImageUrl } from "@/lib/utils/profileImage";

interface EmployeeDetailDrawerProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (employee: Employee) => void;
}

const getStatusBadge = (status: Employee["status"]) => {
  const styles = {
    active: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
    inactive: "bg-slate-100 text-slate-700 border-slate-200",
    "on-leave": "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
    terminated: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20",
  };
  return styles[status];
};

export default function EmployeeDetailDrawer({
  employee,
  isOpen,
  onClose,
  onEdit,
}: EmployeeDetailDrawerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState(employee);
  
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canManageEmployee = isAdmin || isManager; // Admins and managers can edit/deactivate
  const canViewDocuments = canManageEmployee; // Admins and managers can view employee documents
  const canManageStatus = canManageEmployee; // Only admin and manager can deactivate/activate
  
  // Update current employee when prop changes
  useEffect(() => {
    setCurrentEmployee(employee);
  }, [employee]);
  
  const handleToggleStatus = async () => {
    if (!canManageStatus) {
      setError('You do not have permission to change user status');
      return;
    }

    const newStatus = currentEmployee.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} ${currentEmployee.name}? ${newStatus === 'inactive' ? 'They will not be able to login.' : 'They will be able to login again.'}`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await usersApi.toggleUserStatus(currentEmployee.id, newStatus);
      if (response.success && response.data?.user) {
        setCurrentEmployee(response.data.user);
        // Optionally refresh the employee list by calling a callback
        // You might want to add an onEmployeeUpdated callback prop
      } else {
        setError(response.message || `Failed to ${action} employee`);
      }
    } catch (err: any) {
      const errorMessage = err?.message || `Failed to ${action} employee. Please try again.`;
      setError(errorMessage);
      console.error(`Error ${action}ing employee:`, err);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] break-words flex-1 min-w-0 pr-2">Employee Details</h2>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-slate-200">
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
              {employee.photo ? (
                <Image
                  src={getProfileImageUrl(employee.photo)}
                  alt={employee.name || "Employee"}
                  width={80}
                  height={80}
                  className="object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.avatar-fallback') as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div className={`avatar-fallback h-full w-full flex items-center justify-center ${employee.photo ? 'hidden' : ''}`}>
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {employee.name ? employee.name.charAt(0).toUpperCase() : "?"}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A] break-words leading-tight mb-1 sm:mb-2">{currentEmployee.name || "Unknown Employee"}</h3>
              <p className="text-xs sm:text-sm text-[#64748B] break-words leading-relaxed mb-2 sm:mb-0">{currentEmployee.email || "No email"}</p>
              <Badge className={cn("mt-2 sm:mt-2 inline-block", getStatusBadge(currentEmployee.status || "active"))}>
                {currentEmployee.status ? currentEmployee.status.replace("-", " ") : "Active"}
              </Badge>
            </div>
          </div>

          <Card className="border border-slate-200">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-bold text-[#0F172A]">Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-[#64748B] mb-1">Department</p>
                  <p className="text-sm font-medium text-[#0F172A] break-words">{currentEmployee.department || "N/A"}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#64748B] mb-1">Role</p>
                  <p className="text-sm font-medium text-[#0F172A] capitalize break-words">{currentEmployee.role || "N/A"}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#64748B] mb-1">Employment Type</p>
                  <p className="text-sm font-medium text-[#0F172A] capitalize break-words">
                    {currentEmployee.employmentType ? currentEmployee.employmentType.replace("-", " ") : "N/A"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#64748B] mb-1">Monthly Salary</p>
                  <p className="text-sm font-medium text-[#0F172A] break-words">
                    {currentEmployee.baseSalary ? `Rs ${currentEmployee.baseSalary.toLocaleString()}` : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-bold text-[#0F172A]">Contract Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-[#64748B] mb-1">Join Date</p>
                  <p className="text-sm font-medium text-[#0F172A] break-words">
                    {currentEmployee.joinDate ? new Date(currentEmployee.joinDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                {(currentEmployee as any).contractStart && (
                  <div className="min-w-0">
                    <p className="text-xs text-[#64748B] mb-1">Contract Start</p>
                    <p className="text-sm font-medium text-[#0F172A] break-words">
                      {new Date((currentEmployee as any).contractStart).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {(currentEmployee as any).contractEnd && (
                  <div className="min-w-0">
                    <p className="text-xs text-[#64748B] mb-1">Contract End</p>
                    <p className="text-sm font-medium text-[#0F172A] break-words">
                      {new Date((currentEmployee as any).contractEnd).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-bold text-[#0F172A]">Employment Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#16A34A]"></div>
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">
                      {currentEmployee.status 
                        ? currentEmployee.status.charAt(0).toUpperCase() + currentEmployee.status.slice(1).replace("-", " ")
                        : "Active"}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {currentEmployee.joinDate 
                        ? `Since ${new Date(currentEmployee.joinDate).toLocaleDateString()}`
                        : "No join date"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <EmployeeTasks employeeId={currentEmployee.id} />

          {canViewDocuments && (
            <Card className="border border-slate-200">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="break-words">Employee Documents</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileList
                  entityType="employee_document"
                  entityId={currentEmployee.id}
                  showUpload={false}
                  onFileDeleted={() => {
                    // Documents will reload automatically
                  }}
                />
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-slate-200">
            {canManageEmployee && (
              <Button
                variant="default"
                className="w-full sm:flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm md:text-base h-10 sm:h-11 px-4 sm:px-6 font-semibold shadow-sm hover:shadow-md transition-all"
                onClick={() => onEdit?.(currentEmployee)}
              >
                Edit Employee
              </Button>
            )}
            {canManageStatus && (
              <Button
                variant="outline"
                onClick={handleToggleStatus}
                disabled={loading}
                className={`w-full sm:flex-1 text-xs sm:text-sm md:text-base h-10 sm:h-11 px-4 sm:px-6 font-semibold shadow-sm hover:shadow-md transition-all ${
                  currentEmployee.status === 'active'
                    ? "border-2 border-[#DC2626]/30 text-[#DC2626] hover:bg-[#DC2626]/10 hover:border-[#DC2626]/50 active:bg-[#DC2626]/15"
                    : "border-2 border-[#16A34A]/30 text-[#16A34A] hover:bg-[#16A34A]/10 hover:border-[#16A34A]/50 active:bg-[#16A34A]/15"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading 
                  ? (currentEmployee.status === 'active' ? 'Deactivating...' : 'Activating...')
                  : (currentEmployee.status === 'active' ? 'Deactivate' : 'Activate')
                }
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


