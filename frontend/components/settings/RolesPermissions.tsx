"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { ROLES } from "@/lib/constants/roles";

export default function RolesPermissions() {
  const roles = [
    {
      id: ROLES.ADMIN,
      name: "Administrator",
      description: "Full system access and configuration",
      permissions: [
        "Manage all employees",
        "Process payroll",
        "Configure system settings",
        "View all reports",
        "Manage departments",
        "Approve/reject requests",
      ],
    },
    {
      id: ROLES.MANAGER,
      name: "Manager",
      description: "Team management and approvals",
      permissions: [
        "View team members",
        "Approve time sheets",
        "Approve leave requests",
        "View team reports",
        "Manage team schedules",
      ],
    },
    {
      id: ROLES.EMPLOYEE,
      name: "Employee",
      description: "Self-service and personal information",
      permissions: [
        "View own profile",
        "Submit time sheets",
        "Request leave",
        "View own pay stubs",
        "Update personal information",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Role Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#64748B] mb-6">
            Role-based access control is configured at the system level. Contact your system administrator
            to modify permissions.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roles.map((role) => (
              <div
                key={role.id}
                className="p-4 border border-slate-200 rounded-lg hover:border-[#2563EB] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[#0F172A]">{role.name}</h3>
                    <p className="text-xs text-[#64748B] mt-1">{role.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20">
                    {role.id}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#0F172A]">Permissions:</p>
                  <ul className="space-y-1">
                    {role.permissions.map((permission, idx) => (
                      <li key={idx} className="text-xs text-[#64748B] flex items-start gap-2">
                        <svg
                          className="w-4 h-4 text-[#16A34A] mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



