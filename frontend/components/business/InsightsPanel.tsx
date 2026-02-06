"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import KpiCard from "./KpiCard";
import { ProjectInsights } from "@/lib/services/businessService";
import { projectsApi } from "@/lib/api/projects";
import { cn } from "@/lib/utils";

interface InsightsPanelProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

const getRiskBadge = (risk: "low" | "medium" | "high") => {
  const styles = {
    low: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
    medium: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
    high: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20",
  };
  return styles[risk];
};

const SimpleLineChart = ({ data }: { data: { labels: string[]; values: number[] } }) => {
  const maxValue = Math.max(...data.values, 1);
  const minValue = Math.min(...data.values);
  const range = maxValue - minValue || 1;

  const points = data.values.map((value, index) => {
    const x = (index / (data.values.length - 1 || 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 80;
    return `${x},${y}`;
  });

  return (
    <div className="w-full h-48 bg-slate-50 rounded-lg p-3 sm:p-4 flex flex-col justify-between">
      <svg viewBox="0 0 100 100" className="w-full flex-1" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="#2563EB"
          strokeWidth="0.5"
          points={points.join(" ")}
        />
        {data.values.map((_, index) => {
          const x = (index / (data.values.length - 1 || 1)) * 100;
          const y = 100 - ((data.values[index] - minValue) / range) * 80;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1"
              fill="#2563EB"
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] sm:text-xs text-[#64748B] mt-2">
        {data.labels.map((label, idx) => (
          <span key={idx} className="truncate max-w-[40px] text-center">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

const SimpleBarChart = ({ data }: { data: { labels: string[]; values: number[] } }) => {
  const maxValue = Math.max(...data.values, 1);

  return (
    <div className="w-full h-48 bg-slate-50 rounded-lg p-3 sm:p-4 flex flex-col justify-between">
      <div className="flex items-end justify-between flex-1 gap-1 sm:gap-2">
        {data.values.map((value, index) => {
          const height = (value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-slate-200 rounded-t relative" style={{ height: `${height}%` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-[#2563EB] to-[#3B82F6] rounded-t"></div>
              </div>
              <span className="text-[10px] sm:text-xs text-[#64748B] text-center">
                {data.labels[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function InsightsPanel({ projectId, projectName, onClose }: InsightsPanelProps) {
  const [insights, setInsights] = useState<ProjectInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      try {
        const { businessService } = await import("@/lib/services/businessService");
        const data = await businessService.getProjectInsights(projectId);
        setInsights(data);
      } catch (error) {
        console.error('Failed to load insights:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInsights();
  }, [projectId]);

  if (loading) {
    return (
      <Card className="border-2 border-[#2563EB] bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
            <span className="ml-3 text-[#64748B]">Loading insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="border-2 border-slate-200 bg-white">
        <CardContent className="p-6">
          <p className="text-center text-[#64748B]">No insights available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#2563EB] bg-white">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-[#0F172A]">{projectName} Insights</CardTitle>
            <p className="text-sm text-[#64748B] mt-1">Detailed analytics and health metrics</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-200 text-[#64748B] hover:bg-slate-50"
          >
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Users"
            value={insights.kpi.users || 0}
            subtitle="Active users"
            trend={(insights.kpi.growth || 0) > 0 ? "up" : (insights.kpi.growth || 0) < 0 ? "down" : "neutral"}
            trendValue={insights.kpi.growth || 0}
          />
          <KpiCard
            label="Revenue"
            value={insights.kpi.revenue || 0}
            subtitle="Total revenue"
            trend={(insights.kpi.growth || 0) > 0 ? "up" : (insights.kpi.growth || 0) < 0 ? "down" : "neutral"}
            trendValue={insights.kpi.growth || 0}
          />
          <KpiCard
            label="Activity"
            value={`${insights.kpi.activity || 0}%`}
            subtitle="Engagement rate"
          />
          <KpiCard
            label="Growth"
            value={`${(insights.kpi.growth || 0) > 0 ? "+" : ""}${((insights.kpi.growth || 0)).toFixed(1)}%`}
            subtitle="Month over month"
            trend={(insights.kpi.growth || 0) > 0 ? "up" : (insights.kpi.growth || 0) < 0 ? "down" : "neutral"}
            trendValue={insights.kpi.growth || 0}
          />
        </div>

        {insights.chartData && insights.chartData.labels.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-base font-bold text-[#0F172A]">Activity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleLineChart data={insights.chartData} />
              </CardContent>
            </Card>

            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-base font-bold text-[#0F172A]">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={insights.chartData} />
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border border-slate-200 bg-slate-50/50">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#0F172A]">Health Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[#0F172A]">Uptime</p>
                  <span className="text-sm font-bold text-[#16A34A]">
                    {(insights.health.uptime || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-[#16A34A] h-2 rounded-full transition-all"
                    style={{ width: `${insights.health.uptime || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[#0F172A]">Engagement</p>
                  <span className="text-sm font-bold text-[#2563EB]">
                    {(insights.health.engagement || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-[#2563EB] h-2 rounded-full transition-all"
                    style={{ width: `${insights.health.engagement || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[#0F172A]">Risk Level</p>
                  <Badge className={cn("text-xs", getRiskBadge(insights.health.risk))}>
                    {insights.health.risk.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-[#64748B] mt-2">
                  {insights.health.risk === "low"
                    ? "System operating normally"
                    : insights.health.risk === "medium"
                    ? "Monitor closely"
                    : "Action required"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

