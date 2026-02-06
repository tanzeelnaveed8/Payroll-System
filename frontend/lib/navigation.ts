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
    { title: "Progress Updates", href: "/admin/progress-updates", icon: "bar-chart" },
    { title: "Business", href: "/admin/business", icon: "business" },
    { title: "Settings", href: "/admin/settings", icon: "settings" },
  ],
  [ROLES.MANAGER]: [
    { title: "Dashboard", href: "/manager", icon: "dashboard" },
    { title: "Team", href: "/manager/team", icon: "users" },
    { title: "Tasks", href: "/manager/tasks", icon: "check-square" },
    { title: "Approvals", href: "/manager/approvals", icon: "clock" },
    { title: "Reports", href: "/manager/reports", icon: "bar-chart" },
    { title: "Progress Updates", href: "/admin/progress-updates", icon: "bar-chart" },
    { title: "Settings", href: "/manager/settings", icon: "settings" },
  ],
  [ROLES.DEPT_LEAD]: [
    { title: "Dashboard", href: "/department_lead", icon: "dashboard" },
    { title: "Team", href: "/department_lead/team", icon: "users" },
    { title: "Employee Reports", href: "/department_lead/employee-reports", icon: "file-text" },
    { title: "Tasks", href: "/department_lead/tasks", icon: "check-square" },
    { title: "Timesheets", href: "/department_lead/timesheets", icon: "clock" },
    { title: "Progress Updates", href: "/department_lead/progress-updates", icon: "bar-chart" },
    { title: "Reports", href: "/department_lead/reports", icon: "bar-chart" },
    { title: "Profile", href: "/department_lead/profile", icon: "user" },
  ],
  [ROLES.EMPLOYEE]: [
    { title: "Dashboard", href: "/employee", icon: "dashboard" },
    { title: "Daily Reports", href: "/employee/daily-reports", icon: "file-text" },
    { title: "Time Sheet", href: "/employee/timesheet", icon: "clock" },
    { title: "Tasks", href: "/employee/tasks", icon: "check-square" },
    { title: "Pay Stubs", href: "/employee/paystubs", icon: "file-text" },
    { title: "Leave", href: "/employee/leave", icon: "calendar" },
    { title: "Profile", href: "/employee/profile", icon: "user" },
  ],
};

