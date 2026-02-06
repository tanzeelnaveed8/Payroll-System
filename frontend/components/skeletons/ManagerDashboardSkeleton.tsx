"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import KPICardSkeleton from "./KPICardSkeleton";

/**
 * Manager Dashboard Skeleton
 * 
 * Provides a complete skeleton layout that matches the manager dashboard structure.
 * Prevents Cumulative Layout Shift (CLS) by maintaining exact dimensions and spacing.
 * 
 * Features:
 * - Matches header layout with refresh button
 * - 4 KPI card skeletons
 * - Team Performance and Approval Overview cards
 * - Daily Team Performance section with filters
 * - Fully responsive
 * - Accessible
 */
export default function ManagerDashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header Section Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <Skeleton className="h-8 sm:h-10 w-64 sm:w-80 mb-2" />
          <Skeleton className="h-4 w-96 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Skeleton className="h-10 w-full sm:w-32" />
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <KPICardSkeleton key={index} />
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance Card Skeleton */}
        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>

        {/* Approval Overview Card Skeleton */}
        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Team Performance Card Skeleton */}
      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Skeleton */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Skeleton className="h-10 w-full sm:w-40" />
            <Skeleton className="h-10 w-full sm:w-40" />
          </div>

          {/* Performance Updates List Skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="p-4 border-2 border-slate-300 rounded-lg bg-white"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton circle className="h-10 w-10" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
