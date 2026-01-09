"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  className?: string;
}

export default function KpiCard({
  label,
  value,
  subtitle,
  trend,
  trendValue,
  className,
}: KpiCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === "number") {
      if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
      return val.toString();
    }
    return val;
  };

  return (
    <Card className={cn("border border-slate-200 bg-white", className)}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-[#0F172A]">{formatValue(value)}</p>
            {trend && trendValue !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded",
                  trend === "up" && "bg-[#16A34A]/10 text-[#16A34A]",
                  trend === "down" && "bg-[#DC2626]/10 text-[#DC2626]",
                  trend === "neutral" && "bg-slate-100 text-slate-600"
                )}
              >
                {trend === "up" && "↑"}
                {trend === "down" && "↓"}
                {trend === "neutral" && "→"}
                {Math.abs(trendValue).toFixed(1)}%
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs text-[#64748B]">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

