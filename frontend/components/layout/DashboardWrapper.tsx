"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardShell from "./DashboardShell";
import { ROLES, type Role } from "@/lib/constants/roles";
import { useAuth } from "@/lib/contexts/AuthContext";

function getRoleFromPath(pathname: string): Role {
  if (pathname.startsWith("/admin")) return ROLES.ADMIN;
  if (pathname.startsWith("/manager")) return ROLES.MANAGER;
  if (pathname.startsWith("/employee")) return ROLES.EMPLOYEE;
  return ROLES.ADMIN;
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
      router.push("/login");
      return;
    }

    if (!loading && user && user.role !== role) {
      router.push(`/${user.role}`);
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
    return null;
  }

  if (user.role !== role) {
    return null;
  }

  return <DashboardShell role={role}>{children}</DashboardShell>;
}

