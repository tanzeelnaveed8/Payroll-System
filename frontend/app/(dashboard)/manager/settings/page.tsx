"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import Link from "next/link";

export default function ManagerSettingsPage() {
  const [name, setName] = useState("John Manager");
  const [email] = useState("john.manager@company.com");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [approvalNotifications, setApprovalNotifications] = useState(true);
  const [defaultPeriod, setDefaultPeriod] = useState("current-month");
  const [hasChanges, setHasChanges] = useState(false);

  const handlePreferenceChange = () => {
    setHasChanges(true);
  };

  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      setSessions([]);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Manager Settings</h1>
        <p className="text-sm sm:text-base text-[#64748B]">
          Manage your profile, preferences, and security settings
        </p>
      </div>

      <Card className="border border-slate-200 bg-white">
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
              Manager
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white">
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

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Button
              variant="outline"
              className="border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
            >
              Change Password
            </Button>
          </div>
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
                {sessions.map((session, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
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
          disabled={!hasChanges}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setHasChanges(false)}
        >
          Save Changes
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
