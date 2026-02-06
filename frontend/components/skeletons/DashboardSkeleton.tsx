"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import KPICardSkeleton from "./KPICardSkeleton";

/**
 * Admin Dashboard Skeleton
 * 
 * Provides a complete skeleton layout that matches the admin dashboard structure.
 * Prevents Cumulative Layout Shift (CLS) by maintaining exact dimensions and spacing.
 * 
 * Features:
 * - Matches header layout
 * - 4 KPI card skeletons
 * - Secondary metrics row
 * - Payroll activity section
 * - Quick actions section
 * - Department breakdown section
 * - Fully responsive
 * - Accessible
 */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-6">
      {/* Header Section Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-2" />
          <Skeleton className="h-4 w-72 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Skeleton className="h-10 w-full sm:w-32" />
          <Skeleton className="h-10 w-full sm:w-36" />
          <Skeleton className="h-10 w-full sm:w-28" />
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <KPICardSkeleton key={index} />
        ))}
      </div>

      {/* Secondary Metrics Row Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={index}
            className="border-2 border-slate-300 bg-white shadow-sm"
          >
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Recent Payroll Activity Skeleton */}
        <Card className="lg:col-span-2 border-2 border-slate-300 bg-white shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 border-slate-200 bg-slate-50"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Skeleton circle className="h-10 w-10 sm:h-12 sm:w-12" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-start sm:items-end gap-2 sm:gap-1">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Skeleton */}
        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="h-10 sm:h-11 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown Skeleton */}
      <Card className="border border-slate-200 bg-white">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-28" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="p-4 sm:p-5 rounded-lg border-2 border-slate-300 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton circle className="h-10 w-10 sm:h-12 sm:w-12" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
