"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import type { CompanySettings } from "@/lib/services/settingsService";
import { settingsService } from "@/lib/services/settingsService";
import type { Timezone } from "@/lib/api/settings";

interface CompanySettingsProps {
  settings: CompanySettings;
  onChange: (settings: CompanySettings) => void;
}

export default function CompanySettings({ settings, onChange }: CompanySettingsProps) {
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [loadingTimezones, setLoadingTimezones] = useState(true);

  useEffect(() => {
    const loadTimezones = async () => {
      try {
        const tzList = await settingsService.getTimezones();
        setTimezones(tzList);
      } catch (error) {
        console.error('Failed to load timezones:', error);
      } finally {
        setLoadingTimezones(false);
      }
    };
    loadTimezones();
  }, []);
  const workingDays = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  const handleWorkingDayToggle = (day: string) => {
    const newDays = settings.workingDays.includes(day)
      ? settings.workingDays.filter((d) => d !== day)
      : [...settings.workingDays, day];
    onChange({ ...settings, workingDays: newDays });
  };

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">
              Company Name <span className="text-[#DC2626]">*</span>
            </label>
            <Input
              value={settings.companyName}
              onChange={(e) => onChange({ ...settings, companyName: e.target.value })}
              placeholder="Enter company name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">Company Logo</label>
            <div className="flex items-center gap-4">
              {settings.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logoUrl}
                  alt="Company logo"
                  className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                />
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        onChange({ ...settings, logoUrl: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-sm"
                />
                <p className="text-xs text-[#64748B] mt-1">Upload PNG, JPG or SVG (max 2MB)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Time & Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">
              Timezone <span className="text-[#DC2626]">*</span>
            </label>
            <Select
              value={settings.timezone || ""}
              onChange={(e) => onChange({ ...settings, timezone: e.target.value })}
              disabled={loadingTimezones}
            >
              {loadingTimezones ? (
                <option value="">Loading timezones...</option>
              ) : (
                timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))
              )}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">
              Working Days <span className="text-[#DC2626]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {workingDays.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleWorkingDayToggle(day.value)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    (settings.workingDays || []).includes(day.value)
                      ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                      : "border-slate-200 bg-white text-[#64748B] hover:border-slate-300"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#64748B]">Select the days your company operates</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

