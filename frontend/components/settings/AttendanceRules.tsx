"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import type { AttendanceRules } from "@/lib/services/settingsService";

interface AttendanceRulesProps {
  rules: AttendanceRules;
  onChange: (rules: AttendanceRules) => void;
}

export default function AttendanceRules({ rules, onChange }: AttendanceRulesProps) {
  return (
    <Card className="border border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#0F172A]">Attendance Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#0F172A]">
            Daily Working Hours <span className="text-[#DC2626]">*</span>
          </label>
          <Input
            type="number"
            min="1"
            max="24"
            value={rules.dailyWorkingHours}
            onChange={(e) =>
              onChange({ ...rules, dailyWorkingHours: parseInt(e.target.value) || 8 })
            }
            placeholder="8"
          />
          <p className="text-xs text-[#64748B]">Standard working hours per day</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#0F172A]">
            Late Arrival Threshold (minutes) <span className="text-[#DC2626]">*</span>
          </label>
          <Input
            type="number"
            min="0"
            value={rules.lateArrivalThreshold}
            onChange={(e) =>
              onChange({ ...rules, lateArrivalThreshold: parseInt(e.target.value) || 15 })
            }
            placeholder="15"
          />
          <p className="text-xs text-[#64748B]">Minutes after scheduled time before marking as late</p>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-[#0F172A]">Overtime Eligibility</label>
              <p className="text-xs text-[#64748B]">Enable overtime calculation based on weekly hours</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rules.overtimeEligibility.enabled}
                onChange={(e) =>
                  onChange({
                    ...rules,
                    overtimeEligibility: {
                      ...rules.overtimeEligibility,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2563EB] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
            </label>
          </div>

          {rules.overtimeEligibility.enabled && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0F172A]">
                Minimum Hours for Overtime <span className="text-[#DC2626]">*</span>
              </label>
              <Input
                type="number"
                min="0"
                value={rules.overtimeEligibility.minimumHours}
                onChange={(e) =>
                  onChange({
                    ...rules,
                    overtimeEligibility: {
                      ...rules.overtimeEligibility,
                      minimumHours: parseInt(e.target.value) || 40,
                    },
                  })
                }
                placeholder="40"
              />
              <p className="text-xs text-[#64748B]">Weekly hours required before overtime applies</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}



