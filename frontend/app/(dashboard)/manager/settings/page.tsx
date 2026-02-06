"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import Link from "next/link";
import { managerService } from "@/lib/services/managerService";
import type { ManagerSettings, Session } from "@/lib/api/manager";
import { settingsService } from "@/lib/services/settingsService";
import WorkingDaysDisplay from "@/components/settings/WorkingDaysDisplay";

export default function ManagerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<ManagerSettings | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [companySettings, setCompanySettings] = useState<{ timezone?: string; workingDays?: string[] } | null>(null);

  // Local state for form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [approvalNotifications, setApprovalNotifications] = useState(true);
  const [defaultPeriod, setDefaultPeriod] = useState("current-month");

  useEffect(() => {
    loadSettings();
    loadSessions();
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const allSettings = await settingsService.getSettings();
      if (allSettings.company) {
        setCompanySettings({
          timezone: allSettings.company.timezone,
          workingDays: allSettings.company.workingDays,
        });
      }
    } catch (error) {
      console.error('Failed to load company settings:', error);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await managerService.getSettings();
      setSettings(data);
      setName(data.profile.name);
      setEmail(data.profile.email);
      setRole(data.profile.role);
      setEmailNotifications(data.preferences.emailNotifications);
      setApprovalNotifications(data.preferences.approvalNotifications);
      setDefaultPeriod(data.preferences.defaultPeriod || "current-month");
      setHasChanges(false);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load settings. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await managerService.getSessions();
      setSessions(data);
    } catch (err) {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: {
        name?: string;
        preferences?: {
          emailNotifications?: boolean;
          approvalNotifications?: boolean;
          defaultPeriod?: string;
        };
      } = {
        name: name !== settings.profile.name ? name : undefined,
        preferences: {
          emailNotifications: emailNotifications !== settings.preferences.emailNotifications 
            ? emailNotifications 
            : undefined,
          approvalNotifications: approvalNotifications !== settings.preferences.approvalNotifications 
            ? approvalNotifications 
            : undefined,
          defaultPeriod: defaultPeriod !== settings.preferences.defaultPeriod 
            ? defaultPeriod 
            : undefined,
        },
      };

      // Remove undefined values
      if (updateData.preferences) {
        Object.keys(updateData.preferences).forEach(key => {
          if (updateData.preferences![key as keyof typeof updateData.preferences] === undefined) {
            delete updateData.preferences![key as keyof typeof updateData.preferences];
          }
        });
        if (Object.keys(updateData.preferences).length === 0) {
          delete updateData.preferences;
        }
      }

      if (!updateData.name && !updateData.preferences) {
        setError("No changes to save");
        setSaving(false);
        return;
      }

      const updatedSettings = await managerService.updateSettings(updateData);
      setSettings(updatedSettings);
      setHasChanges(false);
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
      
      // Reload sessions to get updated info
      await loadSessions();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to save settings. Please try again.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = () => {
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Manager Settings</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Manage your profile, preferences, and security settings
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-[#64748B]">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Manager Settings</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Manage your profile, preferences, and security settings
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load settings. Please try again.</p>
          <Button
            onClick={loadSettings}
            className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Manager Settings</h1>
        <p className="text-sm sm:text-base text-[#64748B]">
          Manage your profile, preferences, and security settings
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <Card className="border-2 border-slate-300 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">Name</label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setHasChanges(true);
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">Email</label>
            <Input value={email} disabled className="bg-slate-50" />
            <p className="text-xs text-[#64748B]">Email cannot be changed</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#0F172A]">Role:</span>
            <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-slate-300 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Email Notifications</p>
                <p className="text-xs text-[#64748B]">Receive email updates about team activities</p>
              </div>
              <button
                onClick={() => {
                  setEmailNotifications(!emailNotifications);
                  handlePreferenceChange();
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailNotifications ? "bg-[#2563EB]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailNotifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Approval Notifications</p>
                <p className="text-xs text-[#64748B]">Get notified when approvals are pending</p>
              </div>
              <button
                onClick={() => {
                  setApprovalNotifications(!approvalNotifications);
                  handlePreferenceChange();
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  approvalNotifications ? "bg-[#2563EB]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    approvalNotifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">Default Dashboard Period</label>
            <Select
              value={defaultPeriod}
              onChange={(e) => {
                setDefaultPeriod(e.target.value);
                handlePreferenceChange();
              }}
            >
              <option value="current-month">Current Month</option>
              <option value="last-month">Last Month</option>
              <option value="current-quarter">Current Quarter</option>
              <option value="last-quarter">Last Quarter</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {companySettings && (
        <WorkingDaysDisplay
          timezone={companySettings.timezone}
          workingDays={companySettings.workingDays}
        />
      )}

      <Card className="border-2 border-slate-300 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Active Sessions</h3>
            {loadingSessions ? (
              <div className="text-center py-8 text-[#64748B]">
                <p className="text-sm">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-[#64748B]">
                <p className="text-sm">No active sessions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session._id}
                    className="flex items-center justify-between p-3 border-2 border-slate-300 rounded-lg bg-white hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#0F172A]">{session.device || 'Unknown Device'}</p>
                      <p className="text-xs text-[#64748B]">
                        {session.location || 'Unknown Location'} • {session.lastActive || 'Unknown'}
                      </p>
                    </div>
                    {session.current && (
                      <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20">
                        Current
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
        <Button
          variant="gradient"
          disabled={!hasChanges || saving}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Link href="/login" className="flex-1 sm:flex-none">
          <Button
            variant="outline"
            className="w-full sm:w-auto border-slate-200 text-[#64748B] hover:bg-slate-50"
          >
            Logout
          </Button>
        </Link>
      </div>
    </div>
  );
}
