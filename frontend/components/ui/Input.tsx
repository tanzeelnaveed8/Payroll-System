import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, "aria-label": ariaLabel, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 sm:h-12 w-full min-w-0 rounded-xl border-2 border-[#2563EB]/30 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-sm text-[#0F172A] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:border-[#2563EB] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
          type === "date" && "text-[#0F172A]",
          className
        )}
        ref={ref}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;
