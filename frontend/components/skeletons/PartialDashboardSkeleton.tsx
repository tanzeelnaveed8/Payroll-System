"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

/**
 * Partial Dashboard Skeleton
 * 
 * Shows a subtle overlay skeleton during background refresh.
 * Used when data exists but is being refreshed in the background.
 * Provides visual feedback without disrupting the user experience.
 */
export default function PartialDashboardSkeleton() {
  return (
    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-2"></div>
        <p className="text-xs text-[#64748B] font-medium">Refreshing...</p>
      </div>
    </div>
  );
}
