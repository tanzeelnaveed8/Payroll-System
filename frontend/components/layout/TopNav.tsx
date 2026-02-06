"use client";

import { useState } from "react";
import Image from "next/image";
import { ROLES, type Role } from "@/lib/constants/roles";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import { Settings, LogOut, User, ChevronDown } from "lucide-react";

interface TopNavProps {
  role: Role;
}

export default function TopNav({ role }: TopNavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const settingsPath =
    role === ROLES.MANAGER ? "/admin/settings" :
    role === ROLES.DEPT_LEAD ? "/department_lead/profile" :
    role === ROLES.EMPLOYEE ? "/employee/profile" :
    "/admin/settings";

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-[56px] sm:min-h-16 items-center gap-2 sm:gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 shadow-sm py-2">
      {(role === ROLES.MANAGER || role === ROLES.DEPT_LEAD) && (
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 flex-shrink-0 flex items-center justify-center">
            <Image
              src="/payroll logo.png"
              alt="MeeTech Labs"
              width={48}
              height={48}
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          <h1 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-[#0F172A] leading-tight min-w-0 flex-1 truncate">
            MeeTech Labs
          </h1>
        </div>
      )}
      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          {role !== ROLES.MANAGER && role !== ROLES.DEPT_LEAD && (
            <div className="hidden sm:flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-xs sm:text-sm font-bold text-white">
                  {role.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-[#0F172A] capitalize">
                  {role} Dashboard
                </p>
                <p className="text-xs text-[#64748B]">Welcome back</p>
              </div>
            </div>
          )}
          {(role === ROLES.MANAGER || role === ROLES.DEPT_LEAD) ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] sm:text-xs font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || "M"}
                  </span>
                </div>
                <span className="hidden sm:inline text-sm font-semibold text-[#0F172A] truncate max-w-[120px]">
                  {user?.name || "Manager"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#64748B] flex-shrink-0" />
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
                    <Link
                      href={role === ROLES.DEPT_LEAD ? "/department_lead/profile" : "/admin/profile"}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#0F172A] hover:bg-slate-50 rounded-t-lg"
                    >
                      <User className="w-4 h-4 text-[#64748B]" />
                      Profile
                    </Link>
                    {role === ROLES.MANAGER && (
                      <Link href={settingsPath} className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#0F172A] hover:bg-slate-50">
                        <Settings className="w-4 h-4 text-[#64748B]" />
                        Settings
                      </Link>
                    )}
                    <div className="border-t border-slate-200" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-[#DC2626] hover:bg-slate-50 rounded-b-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href={settingsPath}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-2 border-slate-200 bg-white hover:bg-[#F8FAFC] text-[#2563EB] font-semibold text-xs sm:text-sm px-2.5 sm:px-4 h-8 sm:h-9"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">Settings</span>
                </Button>
              </Link>
              <Button
                variant="default"
                size="sm"
                className="bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-md text-xs sm:text-sm px-2.5 sm:px-4 h-8 sm:h-9"
                onClick={handleLogout}
              >
                <span className="hidden sm:inline mr-1.5">Sign Out</span>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
