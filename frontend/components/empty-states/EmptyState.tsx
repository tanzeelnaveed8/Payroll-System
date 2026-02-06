"use client";

import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface EmptyStateProps {
  /**
   * Icon to display (can be emoji, SVG, or React component)
   */
  icon?: React.ReactNode;
  /**
   * Main title/heading
   */
  title: string;
  /**
   * Descriptive message
   */
  message: string;
  /**
   * Optional action button
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "gradient" | "outline";
  };
  /**
   * Optional secondary action
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether to show in a card
   */
  showCard?: boolean;
}

/**
 * Reusable Empty State Component
 * 
 * Provides consistent empty state UI across the application.
 * Suitable for enterprise software with clear messaging and actionable CTAs.
 * 
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon="📊"
 *   title="No data available"
 *   message="There is no data to display at this time."
 *   action={{
 *     label: "Refresh",
 *     onClick: () => refetch()
 *   }}
 * />
 * ```
 */
export default function EmptyState({
  icon,
  title,
  message,
  action,
  secondaryAction,
  size = "md",
  showCard = false,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      icon: "w-12 h-12",
      iconContainer: "w-16 h-16",
      title: "text-base",
      message: "text-sm",
      padding: "py-8",
    },
    md: {
      icon: "w-16 h-16",
      iconContainer: "w-20 h-20",
      title: "text-lg",
      message: "text-sm",
      padding: "py-12",
    },
    lg: {
      icon: "w-20 h-20",
      iconContainer: "w-24 h-24",
      title: "text-xl",
      message: "text-base",
      padding: "py-16",
    },
  };

  const classes = sizeClasses[size];

  const content = (
    <div className={`text-center ${classes.padding}`}>
      {/* Icon */}
      {icon && (
        <div
          className={`${classes.iconContainer} mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center`}
        >
          {typeof icon === "string" ? (
            <span className="text-3xl">{icon}</span>
          ) : (
            <div className={classes.icon}>{icon}</div>
          )}
        </div>
      )}

      {/* Title */}
      <h3 className={`${classes.title} font-semibold text-[#0F172A] mb-2`}>{title}</h3>

      {/* Message */}
      <p className={`${classes.message} text-[#64748B] mb-6 max-w-md mx-auto`}>{message}</p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <Button
              variant={action.variant || "gradient"}
              onClick={action.onClick}
              className={
                action.variant === "outline"
                  ? "border-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              }
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (showCard) {
    return (
      <Card className="border-2 border-slate-300 bg-white shadow-sm">
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return content;
}
