"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function DeptLeadTimesheetsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Department Timesheets</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            View and manage timesheets for your department
          </p>
        </div>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Timesheets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-[#64748B]">
            <p className="text-sm mb-2">Timesheet management coming soon</p>
            <p className="text-xs">This feature will allow you to view and approve timesheets for your department</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
