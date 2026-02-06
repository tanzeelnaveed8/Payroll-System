"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { usersApi, User } from "@/lib/api/users";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function DeptLeadProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    bio: "",
  });
  const { user: authUser } = useAuth();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getCurrentUserProfile();
      if (response.success && response.data.user) {
        const userData = response.data.user;
        setProfile(userData);
        setFormData({
          name: userData.name || "",
          phone: userData.phone || "",
          address: (userData as any).address || "",
          bio: (userData as any).bio || "",
        });
      }
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await usersApi.updateCurrentUserProfile(formData);
      setIsEditing(false);
      await loadProfile();
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">My Profile</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Manage your profile information
          </p>
        </div>
        {!isEditing && (
          <Button
            variant="gradient"
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20">
          <p className="text-sm text-[#DC2626]">{error}</p>
        </div>
      )}

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0F172A]">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">Name</label>
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            ) : (
              <p className="text-sm text-[#64748B]">{profile?.name || "N/A"}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">Email</label>
            <p className="text-sm text-[#64748B]">{profile?.email || "N/A"}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">Phone</label>
            {isEditing ? (
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            ) : (
              <p className="text-sm text-[#64748B]">{profile?.phone || "N/A"}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">Role</label>
            <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20">
              {profile?.role || "dept_lead"}
            </Badge>
          </div>
          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button
                variant="gradient"
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  loadProfile();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
