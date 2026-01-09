"use client";

import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Project } from "@/lib/services/businessService";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  isSelected?: boolean;
  onClick: () => void;
}

const getStatusBadge = (status: Project["status"]) => {
  const styles = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    connected: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
    pending: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
  };
  return styles[status];
};

const getTrendIcon = (trend: Project["trend"]) => {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
};

const getTrendColor = (trend: Project["trend"]) => {
  if (trend === "up") return "text-[#16A34A]";
  if (trend === "down") return "text-[#DC2626]";
  return "text-slate-600";
};

export default function ProjectCard({ project, isSelected, onClick }: ProjectCardProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card
      className={cn(
        "border-2 cursor-pointer transition-all duration-200 hover:shadow-lg",
        isSelected
          ? "border-[#2563EB] bg-blue-50/30 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#0F172A] mb-1">{project.name}</h3>
              {project.category && (
                <p className="text-sm text-[#64748B]">{project.category}</p>
              )}
            </div>
            <Badge className={cn("ml-2", getStatusBadge(project.status))}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div>
              <p className="text-xs text-[#64748B] mb-1">Users</p>
              <p className="text-sm font-semibold text-[#0F172A]">
                {formatNumber(project.kpi.users)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#64748B] mb-1">Revenue</p>
              <p className="text-sm font-semibold text-[#0F172A]">
                ${formatNumber(project.kpi.revenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#64748B] mb-1">Activity</p>
              <p className="text-sm font-semibold text-[#0F172A]">{project.kpi.activity}%</p>
            </div>
            <div>
              <p className="text-xs text-[#64748B] mb-1">Growth</p>
              <div className="flex items-center gap-1">
                <span className={cn("text-sm font-semibold", getTrendColor(project.trend))}>
                  {getTrendIcon(project.trend)} {Math.abs(project.trendPercentage).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View Insights
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

