"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

/**
 * KPI Card Skeleton
 * 
 * Matches the exact layout of KPI cards in the dashboard.
 * Prevents layout shift when data loads.
 * 
 * Features:
 * - Matches card dimensions and spacing
 * - Includes header with icon placeholder
 * - Shows value and description placeholders
 * - Responsive design
 */
export default function KPICardSkeleton() {
  return (
    <Card className="relative overflow-hidden border-2 border-slate-300 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton circle className="h-10 w-10 sm:h-12 sm:w-12" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-2">
          <Skeleton className="h-8 sm:h-10 w-20 sm:w-24" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-3 w-32 mb-2" />
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
          <Skeleton className="h-3 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}
