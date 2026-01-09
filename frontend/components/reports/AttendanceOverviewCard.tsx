"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { AttendanceOverview } from "@/lib/api/reports";

interface AttendanceOverviewCardProps {
  data: AttendanceOverview;
  onExport: (type: "pdf" | "excel") => void;
}

export default function AttendanceOverviewCard({
  data,
  onExport,
}: AttendanceOverviewCardProps) {
  return (
    <Card className="border border-slate-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[#0F172A]">Attendance Overview</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport("pdf")}
              className="border-slate-200 text-[#64748B] hover:bg-slate-50"
            >
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport("excel")}
              className="border-slate-200 text-[#64748B] hover:bg-slate-50"
            >
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-[#64748B] mb-1">Total Days</p>
            <p className="text-xl font-bold text-[#0F172A]">{data.totalDays}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-[#64748B] mb-1">Present Days</p>
            <p className="text-xl font-bold text-[#16A34A]">{data.presentDays}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-[#64748B] mb-1">Absent Days</p>
            <p className="text-xl font-bold text-[#DC2626]">{data.absentDays}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-[#64748B] mb-1">Late Arrivals</p>
            <p className="text-xl font-bold text-[#F59E0B]">{data.lateArrivals}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-[#64748B] mb-1">Attendance Rate</p>
            <p className="text-xl font-bold text-[#2563EB]">{data.attendanceRate}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



