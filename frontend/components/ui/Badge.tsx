import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline";
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", "aria-label": ariaLabel, children, ...props }, ref) => {
    // Badge should have accessible label if it's used for status
    const accessibleLabel = ariaLabel || (typeof children === "string" ? children : undefined);
    
    return (
      <div
        ref={ref}
        role="status"
        aria-label={accessibleLabel}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2",
          {
            "border-transparent bg-primary text-primary-foreground":
              variant === "default",
            "border-transparent bg-secondary text-secondary-foreground":
              variant === "secondary",
            "text-foreground": variant === "outline",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;

