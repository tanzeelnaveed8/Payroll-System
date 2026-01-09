"use client";

import { Employee, EmployeeSort } from "@/lib/services/employeeService";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface EmployeeTableProps {
  employees: Employee[];
  selectedEmployees: string[];
  onSelectEmployee: (id: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  allSelected: boolean;
  sort: EmployeeSort;
  onSortChange: (field: keyof Employee, direction: "asc" | "desc") => void;
  pagination: { page: number; pageSize: number; total: number };
  onPageChange: (page: number) => void;
  onViewEmployee: (id: string) => void;
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

const getSortIcon = (field: keyof Employee, currentSort: EmployeeSort) => {
  if (currentSort.field === field) {
    return currentSort.direction === "asc" ? "▲" : "▼";
  }
  return "◆";
};

export default function EmployeeTable({
  employees,
  selectedEmployees,
  onSelectEmployee,
  onSelectAll,
  allSelected,
  sort,
  onSortChange,
  pagination,
  onPageChange,
  onViewEmployee,
}: EmployeeTableProps) {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="w-full">
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
              {[
                { label: "Employee", field: "name" as keyof Employee },
                { label: "Department", field: "department" as keyof Employee },
                { label: "Role", field: "role" as keyof Employee },
                { label: "Employment Type", field: "employmentType" as keyof Employee },
                { label: "Join Date", field: "joinDate" as keyof Employee },
                { label: "Status", field: "status" as keyof Employee },
                { label: "Actions", field: null },
              ].map((col) => (
                <th
                  key={col.label}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                  onClick={() =>
                    col.field && onSortChange(col.field, sort.field === col.field && sort.direction === "asc" ? "desc" : "asc")
                  }
                >
                  <div className="flex items-center">
                    {col.label}
                    {col.field && (
                      <span className="ml-1 text-slate-400 text-xs">
                        {getSortIcon(col.field, sort)}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={(e) => onSelectEmployee(employee.id, e.target.checked)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
                      {employee.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={employee.photo}
                          alt={employee.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {employee.name ? employee.name.charAt(0).toUpperCase() : "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#0F172A]">{employee.name || "Unknown"}</div>
                      <div className="text-xs text-[#64748B]">{employee.email || "No email"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F172A]">
                  {employee.department || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F172A] capitalize">
                  {employee.role || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F172A] capitalize">
                  {employee.employmentType ? employee.employmentType.replace("-", " ") : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F172A]">
                  {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={getStatusBadge(employee.status || "active")}>
                    {employee.status ? employee.status.replace("-", " ") : "Active"}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewEmployee(employee.id)}
                    className="border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {employees.map((employee) => (
          <div key={employee.id} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-[#2563EB]"
                  checked={selectedEmployees.includes(employee.id)}
                  onChange={(e) => onSelectEmployee(employee.id, e.target.checked)}
                />
                <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
                  {employee.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={employee.photo}
                      alt={employee.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="text-base font-bold text-white">
                        {employee.name ? employee.name.charAt(0).toUpperCase() : "?"}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-base text-[#0F172A]">{employee.name || "Unknown"}</h3>
              </div>
              <Badge className={getStatusBadge(employee.status || "active")}>
                {employee.status ? employee.status.replace("-", " ") : "Active"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-[#64748B] mb-3">
              <div>
                <span className="font-medium text-[#0F172A]">Department:</span> {employee.department || "N/A"}
              </div>
              <div>
                <span className="font-medium text-[#0F172A]">Role:</span> {employee.role ? employee.role.charAt(0).toUpperCase() + employee.role.slice(1) : "N/A"}
              </div>
              <div>
                <span className="font-medium text-[#0F172A]">Type:</span>{" "}
                {employee.employmentType ? employee.employmentType.replace("-", " ") : "N/A"}
              </div>
              <div>
                <span className="font-medium text-[#0F172A]">Join Date:</span>{" "}
                {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : "N/A"}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewEmployee(employee.id)}
              className="w-full border-[#2563EB]/20 text-[#2563EB]"
            >
              View Details
            </Button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 px-6 py-4 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-[#0F172A]">
            Page {pagination.page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

