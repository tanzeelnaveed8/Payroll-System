"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  /**
   * Width of the skeleton (e.g., "w-full", "w-32", "w-1/2")
   */
  className?: string;
  /**
   * Height of the skeleton (e.g., "h-4", "h-8", "h-12")
   */
  height?: string;
  /**
   * Width of the skeleton (e.g., "w-4", "w-8", "w-full")
   */
  width?: string;
  /**
   * Whether to show a circular skeleton (for avatars, icons)
   */
  circle?: boolean;
  /**
   * Number of lines to show (for text skeletons)
   */
  lines?: number;
  /**
   * Whether to show the last line as shorter (for paragraph effect)
   */
  lastLineShort?: boolean;
}

/**
 * Base Skeleton Component
 * 
 * Provides a shimmer animation placeholder that matches the final content layout.
 * Prevents Cumulative Layout Shift (CLS) by maintaining exact dimensions.
 * 
 * Features:
 * - Smooth shimmer animation
 * - Theme-aware colors
 * - Accessible (aria-label for screen readers)
 * - Supports various shapes (rectangular, circular, text lines)
 * 
 * Usage:
 * ```tsx
 * <Skeleton className="w-full h-8" />
 * <Skeleton circle className="w-12 h-12" />
 * <Skeleton lines={3} lastLineShort />
 * ```
 */
export default function Skeleton({
  className,
  height = "h-4",
  width = "w-full",
  circle = false,
  lines,
  lastLineShort = false,
}: SkeletonProps) {
  // If lines prop is provided, render multiple skeleton lines
  if (lines && lines > 0) {
    return (
      <div className={cn("space-y-2", className)} aria-label="Loading content">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded",
              height,
              index === lines - 1 && lastLineShort ? "w-3/4" : width
            )}
            style={{
              animation: "shimmer 2s ease-in-out infinite",
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  // Single skeleton element
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded",
        circle ? "rounded-full" : "rounded",
        height,
        width,
        className
      )}
      style={{
        animation: "shimmer 2s ease-in-out infinite",
      }}
      aria-label="Loading content"
      role="status"
    />
  );
}
