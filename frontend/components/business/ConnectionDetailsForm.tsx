"use client";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { AuthType } from "@/lib/services/businessService";

interface ConnectionDetailsFormProps {
  baseUrl: string;
  authType: AuthType;
  apiKey: string;
  token: string;
  onBaseUrlChange: (value: string) => void;
  onAuthTypeChange: (value: AuthType) => void;
  onApiKeyChange: (value: string) => void;
  onTokenChange: (value: string) => void;
  errors?: {
    baseUrl?: string;
    apiKey?: string;
    token?: string;
  };
}

export default function ConnectionDetailsForm({
  baseUrl,
  authType,
  apiKey,
  token,
  onBaseUrlChange,
  onAuthTypeChange,
  onApiKeyChange,
  onTokenChange,
  errors,
}: ConnectionDetailsFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-[#0F172A] mb-1 block">
          Base API URL <span className="text-[#DC2626]">*</span>
        </label>
        <Input
          type="url"
          value={baseUrl}
          onChange={(e) => onBaseUrlChange(e.target.value)}
          placeholder="https://api.example.com"
          className={errors?.baseUrl ? "border-[#DC2626]" : ""}
        />
        {errors?.baseUrl && (
          <p className="text-xs text-[#DC2626] mt-1">{errors.baseUrl}</p>
        )}
        <p className="text-xs text-[#64748B] mt-1">
          The base URL where your API endpoints are hosted
        </p>
      </div>

      <div>
        <label className="text-sm font-semibold text-[#0F172A] mb-1 block">
          Authentication Type <span className="text-[#DC2626]">*</span>
        </label>
        <Select
          value={authType}
          onChange={(e) => onAuthTypeChange(e.target.value as AuthType)}
        >
          <option value="api-key">API Key</option>
          <option value="token">Bearer Token</option>
          <option value="oauth">OAuth 2.0</option>
        </Select>
        <p className="text-xs text-[#64748B] mt-1">
          Select the authentication method your API uses
        </p>
      </div>

      {authType === "api-key" && (
        <div>
          <label className="text-sm font-semibold text-[#0F172A] mb-1 block">
            API Key <span className="text-[#DC2626]">*</span>
          </label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Enter your API key"
            className={errors?.apiKey ? "border-[#DC2626]" : ""}
          />
          {errors?.apiKey && (
            <p className="text-xs text-[#DC2626] mt-1">{errors.apiKey}</p>
          )}
          <p className="text-xs text-[#64748B] mt-1">
            Your API key will be securely stored and used for authentication
          </p>
        </div>
      )}

      {authType === "token" && (
        <div>
          <label className="text-sm font-semibold text-[#0F172A] mb-1 block">
            Bearer Token <span className="text-[#DC2626]">*</span>
          </label>
          <Input
            type="password"
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            placeholder="Enter your bearer token"
            className={errors?.token ? "border-[#DC2626]" : ""}
          />
          {errors?.token && (
            <p className="text-xs text-[#DC2626] mt-1">{errors.token}</p>
          )}
          <p className="text-xs text-[#64748B] mt-1">
            Your bearer token will be securely stored and used for authentication
          </p>
        </div>
      )}

      {authType === "oauth" && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-[#0F172A] font-medium mb-2">OAuth 2.0 Configuration</p>
          <p className="text-xs text-[#64748B]">
            OAuth 2.0 authentication will be configured during the connection process. You&apos;ll be
            redirected to authorize the application.
          </p>
        </div>
      )}
    </div>
  );
}

