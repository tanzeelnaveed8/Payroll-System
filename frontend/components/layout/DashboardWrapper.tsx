"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardShell from "./DashboardShell";
import { ROLES, type Role } from "@/lib/constants/roles";
import { useAuth } from "@/lib/contexts/AuthContext";

function getRoleFromPath(pathname: string): Role {
  if (pathname.startsWith("/admin")) return ROLES.ADMIN;
  if (pathname.startsWith("/manager")) return ROLES.MANAGER;
  if (pathname.startsWith("/department_lead") || pathname.startsWith("/dept_lead")) return ROLES.DEPT_LEAD;
  if (pathname.startsWith("/employee")) return ROLES.EMPLOYEE;
  return ROLES.ADMIN;
}

function canAccessRole(userRole: string, pathRole: Role): boolean {
  // Normalize role names
  const normalizedUserRole = userRole?.toLowerCase().trim();
  
  // Managers can access admin routes and manager routes
  if (normalizedUserRole === 'manager' && (pathRole === ROLES.ADMIN || pathRole === ROLES.MANAGER)) return true;
  
  // Dept_lead can access department_lead routes (handle both variations)
  if ((normalizedUserRole === 'dept_lead' || normalizedUserRole === 'department_lead') && pathRole === ROLES.DEPT_LEAD) return true;
  
  // Users can only access their own role routes
  return normalizedUserRole === pathRole;
}

export default function DashboardWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const role = getRoleFromPath(pathname);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
      return;
    }

    if (!loading && user && !canAccessRole(user.role, role)) {
      const normalizedUserRole = user.role?.toLowerCase().trim();
      // Redirect managers trying to access employee routes to admin routes
      if (normalizedUserRole === 'manager' && role === ROLES.EMPLOYEE) {
        router.push("/admin");
      } else if (normalizedUserRole === 'dept_lead' || normalizedUserRole === 'department_lead') {
        // Redirect dept_lead/department_lead to department_lead route
        router.push("/department_lead");
      } else if (normalizedUserRole === 'manager') {
        router.push("/manager");
      } else {
        router.push(`/${normalizedUserRole}`);
      }
    }
  }, [loading, isAuthenticated, user, role, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto"></div>
          <p className="mt-4 text-[#64748B]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[#64748B] mb-4">Please log in to access this page</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8]"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!canAccessRole(user.role, role)) {
    const normalizedUserRole = user.role?.toLowerCase().trim();
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Access Restricted</h1>
            <p className="text-[#64748B] mb-1">You don&apos;t have permission to access this page</p>
            <p className="text-sm text-[#64748B] mb-6">Your role: <span className="font-semibold text-[#2563EB] capitalize">{user.role}</span></p>
          </div>
          <button
            onClick={() => {
              if (normalizedUserRole === 'dept_lead' || normalizedUserRole === 'department_lead') {
                router.push("/department_lead");
              } else if (normalizedUserRole === 'manager') {
                router.push("/manager");
              } else {
                router.push(`/${normalizedUserRole}`);
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg font-semibold transition-all duration-200 transform hover:scale-105"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <DashboardShell role={role}>{children}</DashboardShell>;
}

