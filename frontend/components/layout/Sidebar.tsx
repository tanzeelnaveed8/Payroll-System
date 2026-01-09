"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation, type Role, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: Role;
}

const iconMap: Record<string, string> = {
  dashboard: "📊",
  users: "👥",
  "dollar-sign": "💰",
  "bar-chart": "📈",
  business: "🏢",
  settings: "⚙️",
  clock: "🕐",
  calendar: "📅",
  "check-circle": "✅",
  "file-text": "📄",
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navigation[role];
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#0F172A] text-white shadow-lg"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-72 bg-[#0F172A] border-r border-[#1E293B] shadow-2xl transition-transform duration-300",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center px-6 border-b border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-lg overflow-hidden p-1.5">
                <img 
                  src="/payroll logo.png" 
                  alt="InsightPayroll Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">InsightPayroll</h1>
                <p className="text-xs text-slate-400 capitalize">{role}</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
            {navItems.map((item: NavItem) => {
              const isActive = pathname === item.href;
              const icon = item.icon ? iconMap[item.icon] || "•" : "•";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-700/20" />
                  )}
                  <span className="text-lg relative z-10">{icon}</span>
                  <span className="relative z-10 flex-1">{item.title}</span>
                  {isActive && (
                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-[#1E293B]">
            <Link
              href={role === "admin" ? "/admin/profile" : role === "manager" ? "/manager/profile" : "/employee/profile"}
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{role.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">User Profile</p>
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
