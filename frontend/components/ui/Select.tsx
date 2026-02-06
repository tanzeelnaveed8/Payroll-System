import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, "aria-label": ariaLabel, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    return (
      <div className="relative w-full min-w-0">
        <select
          className={cn(
            "flex h-11 sm:h-12 w-full min-w-0 appearance-none rounded-xl border-2 border-[#2563EB]/30 bg-white px-3 sm:px-4 py-2.5 sm:py-3 pr-10 text-base sm:text-sm text-[#0F172A] ring-offset-background placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:border-[#2563EB] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm cursor-pointer",
            className
          )}
          ref={ref}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          {...props}
        >
          {children}
        </select>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
          aria-hidden="true"
        >
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-[#64748B]" />
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
