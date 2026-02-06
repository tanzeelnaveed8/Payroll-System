"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ProjectCard from "@/components/business/ProjectCard";
import InsightsPanel from "@/components/business/InsightsPanel";
import KpiCard from "@/components/business/KpiCard";
import {
  businessService,
  type Project,
  type AggregatedInsights,
} from "@/lib/services/businessService";

export default function AdminBusinessPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [aggregatedInsights, setAggregatedInsights] = useState<AggregatedInsights | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(() => {
    const date = new Date();
    return date.toISOString().split("T")[0];
  });

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsData, aggregatedData] = await Promise.all([
        businessService.getProjects(),
        businessService.getAggregatedInsights(),
      ]);
      setProjects(projectsData);
      setAggregatedInsights(aggregatedData);
    } catch (error: any) {
      // Error handled silently - UI will show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(selectedProjectId === projectId ? null : projectId);
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Business Overview</h1>
          <p className="text-sm sm:text-base text-[#64748B]">
            Centralized view of all connected projects
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[#0F172A] whitespace-nowrap">Date Filter:</label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-auto"
            />
          </div>
          <Button
            variant="gradient"
            size="default"
            onClick={() => router.push("/admin/business/add-project")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
          >
            + Add Project
          </Button>
        </div>
      </div>

      {aggregatedInsights && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Total Projects"
            value={aggregatedInsights.totalProjects}
            subtitle="All projects"
          />
          <KpiCard
            label="Total Users"
            value={aggregatedInsights.totalUsers}
            subtitle="Across all projects"
          />
          <KpiCard
            label="Total Revenue"
            value={aggregatedInsights.totalRevenue}
            subtitle="Combined revenue"
          />
          <KpiCard
            label="Avg Activity"
            value={`${aggregatedInsights.totalActivity}%`}
            subtitle="Average engagement"
          />
          <KpiCard
            label="Avg Growth"
            value={`${aggregatedInsights.averageGrowth > 0 ? "+" : ""}${aggregatedInsights.averageGrowth.toFixed(1)}%`}
            subtitle="Average growth rate"
            trend={aggregatedInsights.averageGrowth > 0 ? "up" : aggregatedInsights.averageGrowth < 0 ? "down" : "neutral"}
            trendValue={aggregatedInsights.averageGrowth}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
          <span className="ml-3 text-[#64748B]">Loading projects...</span>
        </div>
      ) : (
        <>
          <Card className="border border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0F172A]">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isSelected={selectedProjectId === project.id}
                    onClick={() => handleProjectSelect(project.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedProject && (
            <InsightsPanel
              projectId={selectedProject.id}
              projectName={selectedProject.name}
              onClose={() => setSelectedProjectId(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

