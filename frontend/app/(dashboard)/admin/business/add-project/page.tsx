"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import StandardContractDisplay from "@/components/business/StandardContractDisplay";
import ConnectionMethodSelector from "@/components/business/ConnectionMethodSelector";
import ConnectionDetailsForm from "@/components/business/ConnectionDetailsForm";
import {
  businessService,
  type AddProjectFormData,
  type AuthType,
  type ProjectStatus,
} from "@/lib/services/businessService";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/hooks/useToast";

const getStatusBadge = (status: ProjectStatus) => {
  const styles: Record<ProjectStatus, string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    connected: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
    pending: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
    archived: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return styles[status];
};

export default function AddProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<AddProjectFormData>({
    name: "",
    category: "",
    owner: "",
    connection: {
      baseUrl: "",
      authType: "api-key",
      apiKey: "",
      token: "",
    },
    status: "draft",
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }

    if (!formData.connection.baseUrl.trim()) {
      newErrors.baseUrl = "Base API URL is required";
    } else {
      try {
        new URL(formData.connection.baseUrl);
      } catch {
        newErrors.baseUrl = "Please enter a valid URL";
      }
    }

    if (formData.connection.authType === "api-key" && (!formData.connection.apiKey || !formData.connection.apiKey.trim())) {
      newErrors.apiKey = "API key is required";
    }

    if (formData.connection.authType === "token" && (!formData.connection.token || !formData.connection.token.trim())) {
      newErrors.token = "Bearer token is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      // If status is "connected", test connection first
      if (formData.status === 'connected' || formData.status === 'pending') {
        // Create a temporary project to test connection
        const testResult = await businessService.testConnection('temp', formData.connection);
        if (!testResult && formData.status === 'connected') {
          setErrors({ 
            submit: 'Connection test failed. Please check your connection settings or save as draft first.' 
          });
          setLoading(false);
          return;
        }
      }

      await businessService.addProject(formData);
      toast.success("Project added successfully!");
      router.push("/admin/business");
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to add project. Please try again.";
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Add New Project</h1>
        <p className="text-sm sm:text-base text-[#64748B]">
          Connect a new project using our standardized API contract
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-[#0F172A] mb-1 block">
                Project Name <span className="text-[#DC2626]">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
                className={errors.name ? "border-[#DC2626]" : ""}
              />
              {errors.name && <p className="text-xs text-[#DC2626] mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#0F172A] mb-1 block">
                  Category (Optional)
                </label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Technology, Retail, Finance"
                />
                <p className="text-xs text-[#64748B] mt-1">Categorize your project for better organization</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#0F172A] mb-1 block">
                  Owner (Optional)
                </label>
                <Input
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  placeholder="Project owner or team"
                />
                <p className="text-xs text-[#64748B] mt-1">Person or team responsible for this project</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#0F172A] mb-1 block">
                Initial Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              >
                <option value="draft">Draft - Save for later</option>
                <option value="pending">Pending - Test connection</option>
                <option value="connected">Connected - Ready to use</option>
              </Select>
              <div className="mt-2 flex items-center gap-2">
                <Badge className={cn("text-xs", getStatusBadge(formData.status))}>
                  {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                </Badge>
                <p className="text-xs text-[#64748B]">
                  {formData.status === "draft"
                    ? "Project will be saved but not connected"
                    : formData.status === "pending"
                    ? "Connection will be tested before activation"
                    : "Project will be immediately connected"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Connection Method</CardTitle>
            <p className="text-sm text-[#64748B] mt-2">
              Select how you want to connect your project. We support standardized API integration.
            </p>
          </CardHeader>
          <CardContent>
            <ConnectionMethodSelector
              selectedMethod="standard-api"
              onMethodChange={() => {}}
            />
          </CardContent>
        </Card>

        <StandardContractDisplay />

        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A]">Connection Details</CardTitle>
            <p className="text-sm text-[#64748B] mt-2">
              Configure your API connection settings. All credentials are encrypted and stored securely.
            </p>
          </CardHeader>
          <CardContent>
            <ConnectionDetailsForm
              baseUrl={formData.connection.baseUrl}
              authType={formData.connection.authType}
              apiKey={formData.connection.apiKey || ""}
              token={formData.connection.token || ""}
              onBaseUrlChange={(value) =>
                setFormData({
                  ...formData,
                  connection: { ...formData.connection, baseUrl: value },
                })
              }
              onAuthTypeChange={(value) =>
                setFormData({
                  ...formData,
                  connection: { ...formData.connection, authType: value },
                })
              }
              onApiKeyChange={(value) =>
                setFormData({
                  ...formData,
                  connection: { ...formData.connection, apiKey: value },
                })
              }
              onTokenChange={(value) =>
                setFormData({
                  ...formData,
                  connection: { ...formData.connection, token: value },
                })
              }
              errors={{
                baseUrl: errors.baseUrl,
                apiKey: errors.apiKey,
                token: errors.token,
              }}
            />
          </CardContent>
        </Card>

        {errors.submit && (
          <div className="p-4 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg">
            <p className="text-sm text-[#DC2626]">{errors.submit}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
          <Button
            type="submit"
            variant="gradient"
            disabled={loading}
            className="flex-1 sm:flex-none sm:w-48 bg-gradient-to-r from-blue-600 to-blue-700 text-white"
          >
            {loading ? "Connecting..." : formData.status === "draft" ? "Save as Draft" : "Connect Project"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 sm:flex-none sm:w-32 border-slate-200 text-[#64748B] hover:bg-slate-50"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

