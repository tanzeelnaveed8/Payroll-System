"use client";

import { useState, useEffect } from "react";
import CompanySettings from "@/components/settings/CompanySettings";
import PayrollSettings from "@/components/settings/PayrollSettings";
import AttendanceRules from "@/components/settings/AttendanceRules";
import LeavePolicies from "@/components/settings/LeavePolicies";
import RolesPermissions from "@/components/settings/RolesPermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { settingsService, type Settings } from "@/lib/services/settingsService";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load settings. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Save each settings type individually
      const savePromises = [];
      
      if (settings.company) {
        savePromises.push(
          settingsService.updateCompanySettings(settings.company).catch(err => {
            throw new Error('Company settings: ' + (err instanceof Error ? err.message : 'Failed'));
          })
        );
      }

      if (settings.payroll) {
        savePromises.push(
          settingsService.updatePayrollSettings(settings.payroll).catch(err => {
            throw new Error('Payroll settings: ' + (err instanceof Error ? err.message : 'Failed'));
          })
        );
      }

      if (settings.attendance) {
        savePromises.push(
          settingsService.updateAttendanceRules(settings.attendance).catch(err => {
            throw new Error('Attendance settings: ' + (err instanceof Error ? err.message : 'Failed'));
          })
        );
      }

      if (settings.leavePolicies && settings.leavePolicies.length > 0) {
        savePromises.push(
          settingsService.updateLeavePolicies(settings.leavePolicies).catch(err => {
            throw new Error('Leave policies: ' + (err instanceof Error ? err.message : 'Failed'));
          })
        );
      }

      await Promise.all(savePromises);
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
      // Reload settings to get updated data
      await loadSettings();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to save settings. Please try again.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "company", label: "Company Settings", icon: "🏢" },
    { id: "payroll", label: "Payroll Settings", icon: "💰" },
    { id: "attendance", label: "Attendance Rules", icon: "⏰" },
    { id: "leave", label: "Leave Policies", icon: "📅" },
    { id: "roles", label: "Roles & Permissions", icon: "👥" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
          <p className="mt-4 text-[#64748B]">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-[#DC2626]">Failed to load settings</p>
        <Button variant="outline" onClick={loadSettings} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] mb-2">
            System Settings
          </h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Configure payroll, workforce, and system preferences
          </p>
        </div>
        <Button
          variant="gradient"
          size="default"
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-600 text-sm">{success}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "company" && (
          <CompanySettings
            settings={settings.company || {}}
            onChange={(company) => setSettings({ ...settings, company })}
          />
        )}

        {activeTab === "payroll" && (
          <PayrollSettings
            settings={settings.payroll || {}}
            onChange={(payroll) => setSettings({ ...settings, payroll })}
          />
        )}

        {activeTab === "attendance" && (
          <AttendanceRules
            rules={settings.attendance || {}}
            onChange={(attendance) => setSettings({ ...settings, attendance })}
          />
        )}

        {activeTab === "leave" && (
          <LeavePolicies
            policies={settings.leavePolicies || []}
            onChange={(leavePolicies) => setSettings({ ...settings, leavePolicies })}
          />
        )}

        {activeTab === "roles" && <RolesPermissions />}
      </div>
    </div>
  );
}



