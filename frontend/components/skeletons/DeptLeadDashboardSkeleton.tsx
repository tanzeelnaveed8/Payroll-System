"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

/**
 * Department Lead Dashboard Skeleton
 * 
 * Provides a complete skeleton layout that matches the Department Lead dashboard structure.
 * Prevents Cumulative Layout Shift (CLS) by maintaining exact dimensions and spacing.
 * 
 * Features:
 * - Matches header layout with refresh button, Assign Task, and View Reports buttons
 * - 6 KPI card skeletons (grid layout: 1 col mobile, 2 cols tablet, 3 cols desktop, 6 cols xl)
 * - Team Performance card skeleton with completion rate circle
 * - Quick Actions card skeleton with 4 action buttons
 * - Recent Tasks card skeleton with task list items
 * - Fully responsive
 * - Accessible
 */
export default function DeptLeadDashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header Section Skeleton */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <Skeleton className="h-8 sm:h-10 lg:h-12 w-64 sm:w-80 lg:w-96 mb-2" />
          <Skeleton className="h-4 sm:h-5 lg:h-6 w-full sm:w-96 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-32" />
          <Skeleton className="h-10 w-full sm:w-36" />
          <Skeleton className="h-10 w-full sm:w-28" />
        </div>
      </header>

      {/* KPI Cards Grid Skeleton - 6 cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card
            key={index}
            className="border border-slate-200 bg-white hover:shadow-xl transition-all duration-300"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-2 w-2 rounded-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Performance Card Skeleton (lg:col-span-2) */}
        <Card className="border border-slate-200 bg-white lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Completion Rate Section Skeleton */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-9 w-20" />
              </div>
              <div className="w-24 h-24 relative">
                {/* Circular progress skeleton */}
                <div className="w-24 h-24 rounded-full border-8 border-slate-200 flex items-center justify-center">
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </div>
            
            {/* Task Status Breakdown Skeleton */}
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="text-center p-4 bg-slate-50 rounded-lg">
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              ))}
            </div>
            
            {/* Manage Team Button Skeleton */}
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        {/* Quick Actions Card Skeleton */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl"
              >
                <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                <Skeleton className="h-5 w-32 flex-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks Card Skeleton */}
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-8 w-40 mb-1" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Task List Items Skeleton */}
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="p-6 bg-white border-2 border-slate-200 rounded-xl"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    {/* Title and Badges Row */}
                    <div className="flex items-start gap-3 mb-3 flex-wrap">
                      <Skeleton className="h-6 w-48" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-20 rounded" />
                        <Skeleton className="h-6 w-16 rounded" />
                      </div>
                    </div>
                    
                    {/* Description */}
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    
                    {/* Task Details Row */}
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrow Icon Skeleton */}
                  <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
