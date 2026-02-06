import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { Role } from "@/lib/constants/roles";
import SkipNavigation from "@/components/accessibility/SkipNavigation";

interface DashboardShellProps {
  children: ReactNode;
  role: Role;
}

export default function DashboardShell({
  children,
  role,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] max-w-screen-2xl mx-auto">
      <SkipNavigation />
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 sm:ml-64 md:ml-64 lg:ml-64 xl:ml-72 2xl:ml-72">
        <TopNav role={role} />
        <main id="main-content" className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
