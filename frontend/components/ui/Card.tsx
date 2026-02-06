import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, role, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role={role || "article"}
        className={cn(
          "rounded-xl sm:rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl text-card-foreground shadow-xl",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-4 sm:p-6 lg:p-8", className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          "text-lg sm:text-xl lg:text-2xl font-bold leading-none tracking-tight",
          className
        )}
        {...props}
      />
    );
  }
);

CardTitle.displayName = "CardTitle";

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("p-4 sm:p-6 lg:p-8 pt-0", className)} {...props} />
    );
  }
);

CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
