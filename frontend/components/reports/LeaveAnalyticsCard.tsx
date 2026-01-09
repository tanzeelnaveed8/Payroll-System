"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { LeaveAnalytics } from "@/lib/api/reports";

interface LeaveAnalyticsCardProps {
  data: LeaveAnalytics;
  onExport: (type: "pdf" | "excel") => void;
}

export default function LeaveAnalyticsCard({ data, onExport }: LeaveAnalyticsCardProps) {
  return (
    <Card className="border border-slate-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[#0F172A]">Leave Analytics</CardTitle>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-[#64748B] mb-1">Total Leaves</p>
            <p className="text-xl font-bold text-[#0F172A]">{data.totalLeaves}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-[#64748B] mb-1">Approved</p>
            <p className="text-xl font-bold text-[#16A34A]">{data.approvedLeaves}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-[#64748B] mb-1">Pending</p>
            <p className="text-xl font-bold text-[#F59E0B]">{data.pendingLeaves}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-[#64748B] mb-1">Rejected</p>
            <p className="text-xl font-bold text-[#DC2626]">{data.rejectedLeaves}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#0F172A] mb-3">Leave Types Breakdown</p>
          {data.leaveTypes.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-[#0F172A]">{item.type}</span>
              <span className="text-sm font-semibold text-[#64748B]">{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}



