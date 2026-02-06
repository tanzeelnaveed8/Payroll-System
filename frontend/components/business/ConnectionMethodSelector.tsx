"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { AuthType } from "@/lib/services/businessService";
import { cn } from "@/lib/utils";

interface ConnectionMethodSelectorProps {
  selectedMethod: "standard-api";
  onMethodChange: (method: "standard-api") => void;
}

export default function ConnectionMethodSelector({
  selectedMethod,
  onMethodChange,
}: ConnectionMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <Card
        className={cn(
          "border-2 cursor-pointer transition-all duration-200",
          selectedMethod === "standard-api"
            ? "border-[#2563EB] bg-blue-50/30"
            : "border-slate-200 bg-white hover:border-slate-300"
        )}
        onClick={() => onMethodChange("standard-api")}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3 w-full">
            <input
              type="radio"
              checked={selectedMethod === "standard-api"}
              onChange={() => onMethodChange("standard-api")}
              className="mt-1 w-4 h-4 text-[#2563EB] border-slate-300 focus:ring-[#2563EB]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1 w-full">
                <h4 className="font-semibold text-[#0F172A] break-words">
                  Standard API
                </h4>
                <span className="px-2 py-0.5 bg-[#16A34A]/10 text-[#16A34A] text-xs font-medium rounded whitespace-nowrap">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-[#64748B] break-words">
                Connect using our standardized API contract. Your project must implement the required
                endpoints to enable integration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

