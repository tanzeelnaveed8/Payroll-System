"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { usersApi, User } from "@/lib/api/users";
import { useAuth } from "@/lib/contexts/AuthContext";
import { toast } from "@/lib/hooks/useToast";
import { getProfileImageUrl } from "@/lib/utils/profileImage";

export default function AdminProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
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
        // Handle address: can be string or object
        let addressValue = "";
        if (userData.address) {
          if (typeof userData.address === 'string') {
            addressValue = userData.address;
          } else if (typeof userData.address === 'object' && userData.address.street) {
            // If it's an object, extract the street or format it
            addressValue = userData.address.street || "";
            if (userData.address.city) {
              addressValue += (addressValue ? ", " : "") + userData.address.city;
            }
            if (userData.address.state) {
              addressValue += (addressValue ? ", " : "") + userData.address.state;
            }
            if (userData.address.zipCode) {
              addressValue += (addressValue ? " " : "") + userData.address.zipCode;
            }
            if (userData.address.country) {
              addressValue += (addressValue ? ", " : "") + userData.address.country;
            }
          }
        }
        setFormData({
          name: userData.name || "",
          phone: userData.phone || "",
          address: addressValue,
          bio: userData.bio || "",
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load profile";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Validate required fields
      if (!formData.name || formData.name.trim().length < 2) {
        const errorMsg = "Name must be at least 2 characters";
        setError(errorMsg);
        toast.error(errorMsg);
        setSaving(false);
        return;
      }
      
      const response = await usersApi.updateCurrentUserProfile(formData);
      if (response.success) {
        // Reload profile to get updated data
        await loadProfile();
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        const errorMsg = response.message || "Failed to update profile";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      // Extract more detailed error message
      let errorMessage = "Failed to update profile. Please try again.";
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      // Handle address: can be string or object
      let addressValue = "";
      if (profile.address) {
        if (typeof profile.address === 'string') {
          addressValue = profile.address;
        } else if (typeof profile.address === 'object' && profile.address.street) {
          // If it's an object, extract the street or format it
          addressValue = profile.address.street || "";
          if (profile.address.city) {
            addressValue += (addressValue ? ", " : "") + profile.address.city;
          }
          if (profile.address.state) {
            addressValue += (addressValue ? ", " : "") + profile.address.state;
          }
          if (profile.address.zipCode) {
            addressValue += (addressValue ? " " : "") + profile.address.zipCode;
          }
          if (profile.address.country) {
            addressValue += (addressValue ? ", " : "") + profile.address.country;
          }
        }
      }
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        address: addressValue,
        bio: profile.bio || "",
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleDownloadProfile = async () => {
    try {
      setDownloading(true);
      setError(null);
      await usersApi.downloadProfilePDF();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to download profile PDF. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Profile not found"}</p>
          <Button onClick={loadProfile}>Retry</Button>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
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
            className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white"
            onClick={() => setIsEditing(true)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </Button>
        )}
      </div>

      {error && !isEditing && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border border-slate-200 bg-white sticky top-6 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="relative h-48 w-48 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center shadow-xl ring-4 ring-blue-100 overflow-hidden">
                    {profile.photo ? (
                      <Image
                        key={profile.photo}
                        src={getProfileImageUrl(profile.photo)}
                        alt={profile.name}
                        fill
                        sizes="192px"
                        className="rounded-2xl object-cover"
                        onError={(e) => {
                          // If image fails to load, show initials instead
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.avatar-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className={`avatar-fallback h-full w-full flex items-center justify-center ${profile.photo ? 'hidden' : ''}`}>
                      <span className="text-6xl font-bold text-white">{getInitials(profile.name)}</span>
                    </div>
                  </div>
                  <label className={`absolute bottom-0 right-0 h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-700'}`}>
                      {uploading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validate file size (5MB limit)
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("File size exceeds 5MB limit. Please choose a smaller image.");
                              return;
                            }
                            
                            // Validate file type
                            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                            if (!allowedTypes.includes(file.type)) {
                              toast.error("Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.");
                              return;
                            }
                            
                            try {
                              setUploading(true);
                              setError(null);
                              const response = await usersApi.uploadProfilePhoto(file);
                              if (response.success && response.data.user) {
                                // Update profile with new photo URL - use photoUrl from response or user.photo
                                const photoUrl = (response as any).photoUrl || response.data.user.photo;
                                const updatedUser = {
                                  ...response.data.user,
                                  photo: photoUrl
                                };
                                setProfile(updatedUser);
                                
                                // Reload profile after a short delay to ensure latest data
                                setTimeout(() => {
                                  loadProfile();
                                }, 800);
                              }
                            } catch (err: any) {
                              const errorMessage = err.message || "Failed to upload profile photo";
                              setError(errorMessage);
                              toast.error(errorMessage);
                            } finally {
                              setUploading(false);
                              // Reset file input
                              e.target.value = '';
                            }
                          }
                        }}
                        disabled={uploading}
                      />
                    </label>
                </div>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-center font-bold text-lg mb-4"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-[#0F172A] mb-2">{profile.name}</h2>
                )}
                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 mb-4 px-4 py-1.5 text-sm font-semibold">
                  {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1) || "Administrator"}
                </Badge>
                <div className="w-full space-y-4 text-center mt-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-[#64748B] mb-1 font-medium">Employee ID</p>
                    <p className="text-sm font-semibold text-[#0F172A]">{profile.employeeId || "N/A"}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-[#64748B] mb-1 font-medium">Status</p>
                    <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20">
                      {profile.status === "active" ? "Active" : profile.status || "Active"}
                    </Badge>
                  </div>
                  {profile.department && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-[#64748B] mb-1 font-medium">Department</p>
                      <p className="text-sm font-semibold text-[#0F172A]">{profile.department}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-2 block">Full Name</label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-[#0F172A] py-2">{profile.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-2 block">Email Address</label>
                  <p className="text-sm font-semibold text-[#0F172A] py-2">{profile.email}</p>
                  <p className="text-xs text-[#64748B] mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-2 block">Phone Number</label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-[#0F172A] py-2">{profile.phone || "Not provided"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-2 block">Department</label>
                  <p className="text-sm font-semibold text-[#0F172A] py-2">{profile.department || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-2 block">Join Date</label>
                  <p className="text-sm font-semibold text-[#0F172A] py-2">
                    {profile.joinDate
                      ? new Date(profile.joinDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-2 block">Role</label>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1) || "Administrator"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-2 block">Address</label>
                {isEditing ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your address"
                    className="w-full min-h-[100px] rounded-xl border-2 border-blue-300 bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500 transition-all"
                  />
                ) : (
                  <p className="text-sm font-semibold text-[#0F172A] py-2">
                    {formData.address || "Not provided"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="w-full min-h-[120px] rounded-xl border-2 border-blue-300 bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500 transition-all"
                />
              ) : (
                <p className="text-sm text-[#64748B] leading-relaxed py-2">
                  {formData.bio || "No bio provided yet."}
                </p>
              )}
            </CardContent>
          </Card>

          {isEditing ? (
            <div className="flex gap-3 pt-4">
              <Button
                variant="gradient"
                className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white flex-1 sm:flex-initial"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="border-slate-200 flex-1 sm:flex-initial"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-200">
                <CardTitle className="text-lg font-bold text-[#0F172A]">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 justify-start"
                    onClick={handleDownloadProfile}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Profile
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
