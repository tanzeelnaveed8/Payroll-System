"use client";

import { useState } from "react";
import { ROLES, type Role } from "@/lib/constants/roles";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import NotificationBell from "@/components/notifications/NotificationBell";

interface TopNavProps {
  role: Role;
}

export default function TopNav({ role }: TopNavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const settingsPath = 
    role === ROLES.MANAGER ? "/manager/settings" : 
    role === ROLES.EMPLOYEE ? "/employee/profile" : 
    "/admin/settings";

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 sm:gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 shadow-sm">
      {role === ROLES.MANAGER && (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1.5">
            <img src="/payroll logo.png" alt="InsightPayroll" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg font-bold text-[#0F172A] hidden sm:block">InsightPayroll</h1>
        </div>
      )}
      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationBell />
          {role !== ROLES.MANAGER && (
            <div className="hidden sm:flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
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
          {role === ROLES.MANAGER ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || "M"}
                  </span>
                </div>
                <span className="hidden sm:inline text-sm font-semibold text-[#0F172A]">
                  {user?.name || "Manager"}
                </span>
                <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
                    <Link href="/manager" className="block px-4 py-2 text-sm text-[#0F172A] hover:bg-slate-50">
                      Profile
                    </Link>
                    <Link href={settingsPath} className="block px-4 py-2 text-sm text-[#0F172A] hover:bg-slate-50">
                      Settings
                    </Link>
                    <div className="border-t border-slate-200" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-[#DC2626] hover:bg-slate-50"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href={settingsPath}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-2 border-slate-200 bg-white hover:bg-[#F8FAFC] text-[#2563EB] font-semibold text-xs sm:text-sm px-3 sm:px-4"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="hidden sm:inline ml-1">Settings</span>
                </Button>
              </Link>
              <Button 
                variant="default" 
                size="sm" 
                className="bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-md text-xs sm:text-sm px-3 sm:px-4"
                onClick={handleLogout}
              >
                <span className="hidden sm:inline mr-1">Logout</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
