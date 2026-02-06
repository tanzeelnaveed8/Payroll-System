"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import KPICardSkeleton from "./KPICardSkeleton";

/**
 * Employee Dashboard Skeleton
 * 
 * Provides a complete skeleton layout that matches the employee dashboard structure.
 * Prevents Cumulative Layout Shift (CLS) by maintaining exact dimensions and spacing.
 * 
 * Features:
 * - Matches header layout with refresh button and badge
 * - 4 KPI card skeletons (Hours Logged, Available Leave, Latest Pay, Next Payday)
 * - Timesheet Summary card skeleton
 * - Latest Pay Stub card skeleton
 * - Leave Overview card skeleton
 * - Fully responsive
 * - Accessible
 */
export default function EmployeeDashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header Section Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <Skeleton className="h-8 sm:h-10 w-64 sm:w-80 mb-2" />
          <Skeleton className="h-4 w-96 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-32" />
          <Skeleton className="h-8 w-full sm:w-32" />
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={index}
            className="border-2 border-slate-300 bg-white shadow-sm"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-2 w-2 rounded-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timesheet Summary Card Skeleton */}
        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Weekly timesheet grid skeleton */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="text-center p-2 rounded-lg bg-slate-50 border-2 border-slate-300"
                >
                  <Skeleton className="h-3 w-8 mx-auto mb-1" />
                  <Skeleton className="h-3 w-12 mx-auto mb-2" />
                  <Skeleton className="h-4 w-6 mx-auto" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-10 w-36" />
            </div>
          </CardContent>
        </Card>

        {/* Latest Pay Stub Card Skeleton */}
        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-9 w-32" />
            </div>
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Overview Card Skeleton */}
      <Card className="border-2 border-slate-300 bg-white shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Leave Balance Skeleton */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-full rounded-full mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>

          {/* Upcoming Leaves Skeleton */}
          <div>
            <Skeleton className="h-4 w-48 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border-2 border-slate-300"
                >
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
