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
  const [localSettings, setLocalSettings] = useState<CompanySettings>(settings || {});

  // Normalize working days to lowercase for consistent comparison
  const normalizeWorkingDays = (days: string[] | undefined): string[] => {
    if (!days || !Array.isArray(days)) return [];
    return days.map(day => day.toLowerCase().trim());
  };

  // Keep local settings in sync when parent settings change (e.g. after save or reload)
  useEffect(() => {
    const normalizedSettings = {
      ...settings,
      workingDays: normalizeWorkingDays(settings?.workingDays),
    };
    setLocalSettings(normalizedSettings || {});
  }, [settings]);

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
    // Normalize day to lowercase for consistent comparison
    const normalizedDay = day.toLowerCase().trim();
    const currentDays = normalizeWorkingDays(localSettings.workingDays);
    
    // Check if day is already selected (case-insensitive)
    const isSelected = currentDays.some(d => d.toLowerCase() === normalizedDay);
    
    const newDays = isSelected
      ? currentDays.filter((d) => d.toLowerCase() !== normalizedDay)
      : [...currentDays, normalizedDay];
    
    const updated = { ...localSettings, workingDays: newDays };
    setLocalSettings(updated);
    onChange(updated);
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
              value={localSettings.timezone || ""}
              onChange={(e) => {
                const updated = { ...localSettings, timezone: e.target.value };
                setLocalSettings(updated);
                onChange(updated);
              }}
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
              {workingDays.map((day) => {
                const normalizedCurrentDays = normalizeWorkingDays(localSettings.workingDays);
                const isSelected = normalizedCurrentDays.some(d => d.toLowerCase() === day.value.toLowerCase());
                
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleWorkingDayToggle(day.value)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                        : "border-slate-200 bg-white text-[#64748B] hover:border-slate-300"
                    }`}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${day.label} as working day`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#64748B]">Select the days your company operates</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

