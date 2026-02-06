"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { LeavePolicy } from "@/lib/services/settingsService";
import type { LeaveType } from "@/lib/services/leaveService";

interface LeavePoliciesProps {
  policies: LeavePolicy[];
  onChange: (policies: LeavePolicy[]) => void;
}

export default function LeavePolicies({ policies, onChange }: LeavePoliciesProps) {
  const handlePolicyChange = (policyId: string | undefined, index: number, field: keyof LeavePolicy, value: any) => {
    const updated = [...policies];
    // Use ID to find the policy, fallback to index if ID is missing
    const policyIndex = policyId 
      ? updated.findIndex(p => (p.id || p.type) === policyId)
      : index;
    
    if (policyIndex === -1) {
      // If not found by ID, use the provided index
      const current = updated[index];
      if (!current) return;
      updated[index] = { ...current, [field]: value };
    } else {
      const current = updated[policyIndex];
      if (!current) return;
      updated[policyIndex] = { ...current, [field]: value };
    }
    onChange(updated);
  };

  const getLeaveTypeColor = (type: LeavePolicy["type"]) => {
    const colors: Record<LeaveType, string> = {
      paid: "bg-green-100 text-green-700 border-green-200",
      unpaid: "bg-gray-100 text-gray-700 border-gray-200",
      sick: "bg-red-100 text-red-700 border-red-200",
      annual: "bg-purple-100 text-purple-700 border-purple-200",
      casual: "bg-blue-100 text-blue-700 border-blue-200",
      maternity: "bg-pink-100 text-pink-700 border-pink-200",
      paternity: "bg-indigo-100 text-indigo-700 border-indigo-200",
      emergency: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[type];
  };

  return (
    <div className="space-y-6">
      {policies.map((policy, index) => {
        // Use ID or type as stable identifier
        const policyId = policy.id || policy.type;
        return (
          <Card key={policyId || index} className="border-2 border-slate-300 bg-white shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1 rounded-lg border-2 text-sm font-semibold ${getLeaveTypeColor(
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
                    checked={policy.enabled ?? true}
                    onChange={(e) => handlePolicyChange(policyId, index, "enabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2563EB] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
                </label>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]">
                    Max Days <span className="text-[#DC2626]">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={policy.maxDays ?? 0}
                    onChange={(e) =>
                      handlePolicyChange(policyId, index, "maxDays", parseInt(e.target.value) || 0)
                    }
                    className="border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
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
                    value={policy.accrualRate ?? 0}
                    onChange={(e) =>
                      handlePolicyChange(policyId, index, "accrualRate", parseFloat(e.target.value) || 0)
                    }
                    className="border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
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
                    value={policy.carryForwardLimit ?? 0}
                    onChange={(e) =>
                      handlePolicyChange(
                        policyId,
                        index,
                        "carryForwardLimit",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
                  />
                  <p className="text-xs text-[#64748B]">Max days to carry to next year</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]">Policy Name</label>
                  <Input
                    value={policy.name ?? ''}
                    onChange={(e) => handlePolicyChange(policyId, index, "name", e.target.value)}
                    placeholder="Leave type name"
                    className="border-2 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 text-[#0F172A]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}



