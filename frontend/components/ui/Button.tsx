import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "gradient";
  size?: "default" | "sm" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", "aria-label": ariaLabel, children, ...props }, ref) => {
    // Ensure button has accessible label (either aria-label or children)
    const accessibleLabel = ariaLabel || (typeof children === "string" ? children : undefined);
    
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transform hover:scale-[1.02] active:scale-[0.98]",
          {
            "gradient-primary text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40":
              variant === "gradient",
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg":
              variant === "default",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md":
              variant === "secondary",
            "border-2 border-primary/20 bg-background hover:bg-primary/5 hover:border-primary/40 text-primary shadow-sm hover:shadow-md":
              variant === "outline",
            "hover:bg-accent/10 hover:text-accent text-foreground": variant === "ghost",
            "h-11 px-6 text-base": size === "default",
            "h-9 rounded-lg px-4 text-sm": size === "sm",
            "h-14 rounded-2xl px-8 text-lg": size === "lg",
          },
          className
        )}
        ref={ref}
        aria-label={accessibleLabel}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
