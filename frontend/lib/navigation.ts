import { ROLES, type Role } from "./constants/roles";

export type { Role } from "./constants/roles";

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  roles?: Role[];
}

export const navigation: Record<Role, NavItem[]> = {
  [ROLES.ADMIN]: [
    { title: "Dashboard", href: "/admin", icon: "dashboard" },
    { title: "Employees", href: "/admin/employees", icon: "users" },
    { title: "Departments", href: "/admin/departments", icon: "business" },
    { title: "Timesheets", href: "/admin/timesheets", icon: "clock" },
    { title: "Payroll", href: "/admin/payroll", icon: "dollar-sign" },
    { title: "Reports", href: "/admin/reports", icon: "bar-chart" },
    { title: "Business", href: "/admin/business", icon: "business" },
    { title: "Settings", href: "/admin/settings", icon: "settings" },
  ],
  [ROLES.MANAGER]: [
    { title: "Dashboard", href: "/manager", icon: "dashboard" },
    { title: "Team", href: "/manager/team", icon: "users" },
    { title: "Time Approval", href: "/manager/approvals", icon: "check-circle" },
    { title: "Reports", href: "/manager/reports", icon: "bar-chart" },
  ],
  [ROLES.EMPLOYEE]: [
    { title: "Dashboard", href: "/employee", icon: "dashboard" },
    { title: "Time Sheet", href: "/employee/timesheet", icon: "clock" },
    { title: "Pay Stubs", href: "/employee/paystubs", icon: "file-text" },
    { title: "Leave", href: "/employee/leave", icon: "calendar" },
  ],
};

