"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import type { PayrollSettings } from "@/lib/services/settingsService";

interface PayrollSettingsProps {
  settings: PayrollSettings;
  onChange: (settings: PayrollSettings) => void;
}

export default function PayrollSettings({ settings, onChange }: PayrollSettingsProps) {
  const [showAddBonus, setShowAddBonus] = useState(false);
  const [showAddDeduction, setShowAddDeduction] = useState(false);

  // Ensure overtimeRules is properly initialized
  const overtimeRules = settings.overtimeRules || {
    enabled: true,
    rate: 1.5,
    threshold: 40,
  };

  const handleBonusToggle = (id: string) => {
    const bonuses = (settings.bonuses || []).map((b) =>
      b.id === id 
        ? { 
            ...b, 
            enabled: !b.enabled,
            id: b.id || `bonus-${Date.now()}`,
            name: b.name || "",
            type: b.type || "fixed",
            value: b.value ?? 0,
            applicableRoles: b.applicableRoles || [],
          } 
        : b
    );
    onChange({ ...settings, bonuses });
  };

  const handleDeductionToggle = (id: string) => {
    const deductions = (settings.deductions || []).map((d) =>
      d.id === id 
        ? { 
            ...d, 
            enabled: !d.enabled,
            id: d.id || `ded-${Date.now()}`,
            name: d.name || "",
            type: d.type || "fixed",
            value: d.value ?? 0,
            mandatory: d.mandatory ?? false,
          } 
        : d
    );
    onChange({ ...settings, deductions });
  };

  const handleAddBonus = () => {
    const newBonus = {
      id: `bonus-${Date.now()}`,
      name: "",
      type: "fixed" as const,
      value: 0,
      enabled: true,
      applicableRoles: [],
    };
    onChange({ ...settings, bonuses: [...(settings.bonuses || []), newBonus] });
    setShowAddBonus(false);
  };

  const handleAddDeduction = () => {
    const newDeduction = {
      id: `ded-${Date.now()}`,
      name: "",
      type: "fixed" as const,
      value: 0,
      enabled: true,
      mandatory: false,
    };
    onChange({ ...settings, deductions: [...(settings.deductions || []), newDeduction] });
    setShowAddDeduction(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Salary Cycle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">
              Payment Frequency <span className="text-[#DC2626]">*</span>
            </label>
            <Select
              value={settings.salaryCycle || "monthly"}
              onChange={(e) =>
                onChange({ ...settings, salaryCycle: e.target.value as "monthly" | "bi-weekly" })
              }
            >
              <option value="monthly">Monthly</option>
              <option value="bi-weekly">Bi-Weekly</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Overtime Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-[#0F172A]">Enable Overtime</label>
              <p className="text-xs text-[#64748B]">Calculate overtime pay for hours beyond threshold</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={overtimeRules.enabled ?? false}
                onChange={(e) => {
                  onChange({
                    ...settings,
                    overtimeRules: {
                      enabled: e.target.checked,
                      rate: overtimeRules.rate ?? 1.5,
                      threshold: overtimeRules.threshold ?? 40,
                      doubleTimeThreshold: overtimeRules.doubleTimeThreshold,
                    },
                  });
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2563EB] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
            </label>
          </div>

          {overtimeRules.enabled && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]">
                    Overtime Rate <span className="text-[#DC2626]">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    max="3"
                    value={overtimeRules.rate ?? 1.5}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 1 && value <= 3) {
                        onChange({
                          ...settings,
                          overtimeRules: {
                            enabled: overtimeRules.enabled ?? true,
                            rate: value,
                            threshold: overtimeRules.threshold ?? 40,
                            doubleTimeThreshold: overtimeRules.doubleTimeThreshold,
                          },
                        });
                      }
                    }}
                    placeholder="1.5"
                  />
                  <p className="text-xs text-[#64748B]">Multiplier for overtime hours (e.g., 1.5x)</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]">
                    Threshold Hours <span className="text-[#DC2626]">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="168"
                    value={overtimeRules.threshold ?? 40}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 168) {
                        onChange({
                          ...settings,
                          overtimeRules: {
                            enabled: overtimeRules.enabled ?? true,
                            rate: overtimeRules.rate ?? 1.5,
                            threshold: value,
                            doubleTimeThreshold: overtimeRules.doubleTimeThreshold,
                          },
                        });
                      }
                    }}
                    placeholder="40"
                  />
                  <p className="text-xs text-[#64748B]">Hours per week before overtime applies</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-[#0F172A]">Bonuses</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddBonus}
              className="border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap w-full sm:w-auto"
            >
              + Add Bonus
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(settings.bonuses || []).map((bonus, index) => (
            <div
              key={bonus.id || index}
              className="p-4 border border-slate-200 rounded-lg space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={bonus.enabled}
                      onChange={() => handleBonusToggle(bonus.id || "")}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 sm:w-11 sm:h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2563EB] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
                  </label>
                  <Input
                    value={bonus.name || ""}
                    onChange={(e) => {
                      const bonuses = (settings.bonuses || []).map((b) =>
                        b.id === bonus.id 
                          ? { 
                              ...b, 
                              name: e.target.value,
                              id: b.id || `bonus-${Date.now()}`,
                              type: b.type || "fixed",
                              value: b.value ?? 0,
                              enabled: b.enabled ?? true,
                              applicableRoles: b.applicableRoles || [],
                            } 
                          : b
                      );
                      onChange({ ...settings, bonuses });
                    }}
                    placeholder="Bonus name"
                    className="flex-1 min-w-0 text-sm sm:text-base"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChange({
                      ...settings,
                      bonuses: (settings.bonuses || []).filter((b) => b.id !== bonus.id),
                    });
                  }}
                  className="text-red-600 hover:text-red-700 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 whitespace-nowrap w-full sm:w-auto"
                >
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A]">Type</label>
                  <Select
                    value={bonus.type}
                    onChange={(e) => {
                      const bonuses = (settings.bonuses || []).map((b) =>
                        b.id === bonus.id
                          ? { 
                              ...b, 
                              type: e.target.value as "fixed" | "percentage",
                              id: b.id || `bonus-${Date.now()}`,
                              name: b.name || "",
                              value: b.value ?? 0,
                              enabled: b.enabled ?? true,
                              applicableRoles: b.applicableRoles || [],
                            }
                          : b
                      );
                      onChange({ ...settings, bonuses });
                    }}
                    className="text-sm sm:text-base"
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A]">Value</label>
                  <Input
                    type="number"
                    min="0"
                    value={bonus.value ?? 0}
                    onChange={(e) => {
                      const bonuses = (settings.bonuses || []).map((b) =>
                        b.id === bonus.id
                          ? { 
                              ...b, 
                              value: parseFloat(e.target.value) || 0,
                              id: b.id || `bonus-${Date.now()}`,
                              name: b.name || "",
                              type: b.type || "fixed",
                              enabled: b.enabled ?? true,
                              applicableRoles: b.applicableRoles || [],
                            }
                          : b
                      );
                      onChange({ ...settings, bonuses });
                    }}
                    placeholder="0"
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-[#0F172A]">Deductions</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddDeduction}
              className="border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap w-full sm:w-auto"
            >
              + Add Deduction
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(settings.deductions || []).map((deduction, index) => (
            <div
              key={deduction.id || index}
              className="p-4 border border-slate-200 rounded-lg space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={deduction.enabled}
                      onChange={() => handleDeductionToggle(deduction.id || "")}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 sm:w-11 sm:h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2563EB] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
                  </label>
                  <Input
                    value={deduction.name || ""}
                    onChange={(e) => {
                      const deductions = (settings.deductions || []).map((d) =>
                        d.id === deduction.id 
                          ? { 
                              ...d, 
                              name: e.target.value,
                              id: d.id || `ded-${Date.now()}`,
                              type: d.type || "fixed",
                              value: d.value ?? 0,
                              enabled: d.enabled ?? true,
                              mandatory: d.mandatory ?? false,
                            } 
                          : d
                      );
                      onChange({ ...settings, deductions });
                    }}
                    placeholder="Deduction name"
                    className="flex-1 min-w-0 text-sm sm:text-base"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChange({
                      ...settings,
                      deductions: (settings.deductions || []).filter((d) => d.id !== deduction.id),
                    });
                  }}
                  className="text-red-600 hover:text-red-700 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 whitespace-nowrap w-full sm:w-auto"
                >
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A]">Type</label>
                  <Select
                    value={deduction.type}
                    onChange={(e) => {
                      const deductions = (settings.deductions || []).map((d) =>
                        d.id === deduction.id
                          ? { 
                              ...d, 
                              type: e.target.value as "fixed" | "percentage",
                              id: d.id || `ded-${Date.now()}`,
                              name: d.name || "",
                              value: d.value ?? 0,
                              enabled: d.enabled ?? true,
                              mandatory: d.mandatory ?? false,
                            }
                          : d
                      );
                      onChange({ ...settings, deductions });
                    }}
                    className="text-sm sm:text-base"
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-[#0F172A]">Value</label>
                  <Input
                    type="number"
                    min="0"
                    value={deduction.value ?? 0}
                    onChange={(e) => {
                      const deductions = (settings.deductions || []).map((d) =>
                        d.id === deduction.id
                          ? { 
                              ...d, 
                              value: parseFloat(e.target.value) || 0,
                              id: d.id || `ded-${Date.now()}`,
                              name: d.name || "",
                              type: d.type || "fixed",
                              enabled: d.enabled ?? true,
                              mandatory: d.mandatory ?? false,
                            }
                          : d
                      );
                      onChange({ ...settings, deductions });
                    }}
                    placeholder="0"
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

