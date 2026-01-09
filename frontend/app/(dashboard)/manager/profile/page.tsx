"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ManagerProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Manager",
    email: "john.manager@company.com",
    role: "Manager",
    employeeId: "MGR001",
    department: "Engineering",
    phone: "+1 (555) 234-5678",
    joinDate: "2021-03-20",
    status: "active",
    address: "456 Management Ave, New York, NY 10002",
    emergencyContact: "Jane Manager - +1 (555) 876-5432",
    bio: "Experienced engineering manager leading high-performing teams in software development.",
    teamSize: 12,
    directReports: 8,
  });

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">My Profile</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            {isEditing ? "Update your profile information" : "View and manage your profile"}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border border-slate-200 bg-white sticky top-6">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="h-48 w-48 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-6xl font-bold text-white">JM</span>
                </div>
                {isEditing ? (
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="text-center font-bold text-lg mb-4"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-[#0F172A] mb-2">{profile.name}</h2>
                )}
                <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20 mb-4">
                  {profile.role}
                </Badge>
                <div className="w-full space-y-3 text-center">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Employee ID</p>
                    <p className="text-sm font-semibold text-[#0F172A]">{profile.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Status</p>
                    <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20">
                      Active
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Team Size</p>
                    <p className="text-sm font-semibold text-[#0F172A]">{profile.teamSize} members</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Direct Reports</p>
                    <p className="text-sm font-semibold text-[#0F172A]">{profile.directReports}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Full Name</p>
                  {isEditing ? (
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-[#0F172A]">{profile.name}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Email Address</p>
                  <p className="text-sm font-semibold text-[#0F172A]">{profile.email}</p>
                  <p className="text-xs text-[#64748B] mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Phone Number</p>
                  {isEditing ? (
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-[#0F172A]">{profile.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Department</p>
                  {isEditing ? (
                    <Input
                      value={profile.department}
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-[#0F172A]">{profile.department}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Join Date</p>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {new Date(profile.joinDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Role</p>
                  <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20">
                    {profile.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-[#64748B] mb-1">Address</p>
                {isEditing ? (
                  <Input
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-semibold text-[#0F172A]">{profile.address}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Emergency Contact</p>
                {isEditing ? (
                  <Input
                    value={profile.emergencyContact}
                    onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-semibold text-[#0F172A]">{profile.emergencyContact}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">About</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full min-h-[100px] rounded-xl border-2 border-[#2563EB]/30 bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:border-[#2563EB] transition-all"
                />
              ) : (
                <p className="text-sm text-[#64748B] leading-relaxed">{profile.bio}</p>
              )}
            </CardContent>
          </Card>

          {isEditing && (
            <div className="flex gap-3">
              <Button
                variant="gradient"
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                onClick={handleSave}
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                className="border-slate-200"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

