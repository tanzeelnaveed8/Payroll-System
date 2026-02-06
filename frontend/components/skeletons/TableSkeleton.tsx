"use client";

import Skeleton from "@/components/ui/Skeleton";

interface TableSkeletonProps {
  /**
   * Number of rows to show
   */
  rows?: number;
  /**
   * Number of columns to show
   */
  columns?: number;
  /**
   * Whether to show header row
   */
  showHeader?: boolean;
}

/**
 * Table Skeleton
 * 
 * Provides a skeleton layout for tables that matches the final table structure.
 * Prevents layout shift when table data loads.
 * 
 * Usage:
 * ```tsx
 * <TableSkeleton rows={5} columns={4} showHeader />
 * ```
 */
export default function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="w-full" aria-label="Loading table data" role="status">
      {showHeader && (
        <div className="grid gap-4 mb-4 pb-3 border-b border-slate-200">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-20" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4 py-2"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className="h-4"
                width={colIndex === 0 ? "w-3/4" : "w-full"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
