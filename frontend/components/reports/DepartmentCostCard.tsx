"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { DepartmentCost } from "@/lib/api/reports";

interface DepartmentCostCardProps {
  data: DepartmentCost[];
  onExport: (type: "pdf" | "excel") => void;
}

export default function DepartmentCostCard({ data, onExport }: DepartmentCostCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border border-slate-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-[#0F172A]">Department Cost Breakdown</CardTitle>
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
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data.map((dept, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0F172A]">
                    {dept.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F172A]">
                    {dept.employeeCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#0F172A]">
                    {formatCurrency(dept.totalCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-24 bg-slate-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-[#2563EB] h-2 rounded-full"
                          style={{ width: `${dept.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-[#64748B]">{dept.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-4">
          {data.map((dept, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[#0F172A]">{dept.department}</h3>
                <span className="text-sm font-semibold text-[#0F172A]">
                  {formatCurrency(dept.totalCost)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-[#64748B] mb-2">
                <div>
                  <span className="font-medium text-[#0F172A]">Employees:</span> {dept.employeeCount}
                </div>
                <div>
                  <span className="font-medium text-[#0F172A]">Percentage:</span> {dept.percentage}%
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-[#2563EB] h-2 rounded-full"
                  style={{ width: `${dept.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}



