"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { LeavePolicy } from "@/lib/services/settingsService";

interface LeavePoliciesProps {
  policies: LeavePolicy[];
  onChange: (policies: LeavePolicy[]) => void;
}

export default function LeavePolicies({ policies, onChange }: LeavePoliciesProps) {
  const handlePolicyChange = (id: string, field: keyof LeavePolicy, value: any) => {
    const updated = policies.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    onChange(updated);
  };

  const getLeaveTypeColor = (type: LeavePolicy["type"]) => {
    const colors = {
      paid: "bg-blue-100 text-blue-700 border-blue-200",
      unpaid: "bg-slate-100 text-slate-700 border-slate-200",
      sick: "bg-orange-100 text-orange-700 border-orange-200",
      annual: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colors[type];
  };

  return (
    <div className="space-y-6">
      {policies.map((policy) => (
        <Card key={policy.id} className="border border-slate-200 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1 rounded-lg border text-sm font-semibold ${getLeaveTypeColor(
                    policy.type
                  )}`}
                >
                  {policy.type.charAt(0).toUpperCase() + policy.type.slice(1)}
                </div>
                <CardTitle className="text-lg font-bold text-[#0F172A]">{policy.name}</CardTitle>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.enabled}
                  onChange={(e) => handlePolicyChange(policy.id, "enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2563EB] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
              </label>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Max Days <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  value={policy.maxDays}
                  onChange={(e) =>
                    handlePolicyChange(policy.id, "maxDays", parseInt(e.target.value) || 0)
                  }
                />
                <p className="text-xs text-[#64748B]">Maximum days per year</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Accrual Rate <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={policy.accrualRate}
                  onChange={(e) =>
                    handlePolicyChange(policy.id, "accrualRate", parseFloat(e.target.value) || 0)
                  }
                />
                <p className="text-xs text-[#64748B]">Days accrued per month</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Carry Forward Limit <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  value={policy.carryForwardLimit}
                  onChange={(e) =>
                    handlePolicyChange(
                      policy.id,
                      "carryForwardLimit",
                      parseInt(e.target.value) || 0
                    )
                  }
                />
                <p className="text-xs text-[#64748B]">Max days to carry to next year</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">Policy Name</label>
                <Input
                  value={policy.name}
                  onChange={(e) => handlePolicyChange(policy.id, "name", e.target.value)}
                  placeholder="Leave type name"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



