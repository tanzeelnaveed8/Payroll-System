"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function StandardContractDisplay() {
  const requiredMetrics = [
    { name: "Users", description: "Total active user count", endpoint: "GET /api/v1/metrics/users" },
    { name: "Activity", description: "User engagement percentage", endpoint: "GET /api/v1/metrics/activity" },
    { name: "Revenue", description: "Total revenue amount", endpoint: "GET /api/v1/metrics/revenue" },
    { name: "Growth", description: "Growth percentage (MoM)", endpoint: "GET /api/v1/metrics/growth" },
    { name: "Health", description: "System health indicators", endpoint: "GET /api/v1/metrics/health" },
  ];

  return (
    <Card className="border-2 border-slate-200 bg-slate-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[#0F172A]">Standard API Contract</CardTitle>
          <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20">Required</Badge>
        </div>
        <p className="text-sm text-[#64748B] mt-2">
          Your project API must implement these standardized endpoints to enable integration.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requiredMetrics.map((metric, index) => (
            <div
              key={index}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-[#0F172A]">{metric.name}</h4>
                    <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20 text-xs">
                      Required
                    </Badge>
                  </div>
                  <p className="text-sm text-[#64748B] mb-2">{metric.description}</p>
                  <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200">
                    <code className="text-xs text-[#0F172A] font-mono">{metric.endpoint}</code>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-[#0F172A] mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Expected Response Format
            </h4>
            <div className="mt-2 p-3 bg-white rounded border border-blue-200">
              <pre className="text-xs text-[#0F172A] font-mono overflow-x-auto">
{`{
  "value": number,
  "timestamp": "ISO 8601",
  "unit": "string"
}`}
              </pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

