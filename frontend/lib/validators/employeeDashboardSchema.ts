import { z } from "zod";

/**
 * Employee Dashboard Validation Schema
 * 
 * This schema defines the strict contract for employee dashboard API responses.
 * It serves as the single source of truth for:
 * - TypeScript types (derived via z.infer)
 * - Runtime validation
 * - API contract documentation
 * 
 * Why this prevents production incidents:
 * 1. Catches API changes immediately - if backend changes response structure, validation fails
 * 2. Prevents runtime crashes - invalid data is caught before reaching components
 * 3. Prevents silent data corruption - ensures all required fields are present and correct types
 * 4. Provides observability - validation errors are logged for debugging
 * 5. Type safety - TypeScript types are derived from schema, ensuring consistency
 */

/**
 * KPIs Schema
 */
const KPIsSchema = z.object({
  hoursLogged: z.number().min(0, "Hours logged must be non-negative"),
  availableLeave: z.number().min(0, "Available leave must be non-negative"),
  latestPay: z.number().min(0, "Latest pay must be non-negative"),
  nextPayday: z.string().nullable(),
});

/**
 * Weekly Timesheet Entry Schema
 */
const WeeklyTimesheetEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  day: z.string().min(1, "Day is required"),
  hours: z.number().min(0, "Hours must be non-negative"),
  status: z.string().min(1, "Status is required"),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
});

/**
 * Weekly Timesheet Schema
 */
const WeeklyTimesheetSchema = z.object({
  hours: z.number().min(0, "Total hours must be non-negative"),
  regularHours: z.number().min(0, "Regular hours must be non-negative"),
  overtimeHours: z.number().min(0, "Overtime hours must be non-negative"),
  entries: z.array(WeeklyTimesheetEntrySchema).min(0, "Entries array is required"),
});

/**
 * Latest Paystub Schema
 */
const LatestPaystubSchema = z.object({
  id: z.string().min(1, "Paystub ID is required"),
  payDate: z.string().min(1, "Pay date is required"),
  grossPay: z.number().min(0, "Gross pay must be non-negative"),
  netPay: z.number().min(0, "Net pay must be non-negative"),
  status: z.string().min(1, "Status is required"),
  payPeriodStart: z.string().min(1, "Pay period start is required"),
  payPeriodEnd: z.string().min(1, "Pay period end is required"),
  pdfUrl: z.string().url().optional().or(z.string().min(0).optional()),
});

/**
 * Leave Balance Schema
 */
const LeaveBalanceSchema = z.object({
  annual: z.object({
    total: z.number().min(0, "Annual leave total must be non-negative"),
    used: z.number().min(0, "Annual leave used must be non-negative"),
    remaining: z.number().min(0, "Annual leave remaining must be non-negative"),
  }),
  sick: z.object({
    total: z.number().min(0, "Sick leave total must be non-negative"),
    used: z.number().min(0, "Sick leave used must be non-negative"),
    remaining: z.number().min(0, "Sick leave remaining must be non-negative"),
  }),
  casual: z.object({
    total: z.number().min(0, "Casual leave total must be non-negative"),
    used: z.number().min(0, "Casual leave used must be non-negative"),
    remaining: z.number().min(0, "Casual leave remaining must be non-negative"),
  }),
}).nullable();

/**
 * Upcoming Leave Schema
 */
const UpcomingLeaveSchema = z.object({
  id: z.string().min(1, "Leave ID is required"),
  leaveType: z.string().min(1, "Leave type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  totalDays: z.number().int().min(1, "Total days must be at least 1"),
});

/**
 * Leave Overview Schema
 */
const LeaveOverviewSchema = z.object({
  balance: LeaveBalanceSchema,
  upcomingLeaves: z.array(UpcomingLeaveSchema).min(0, "Upcoming leaves array is required"),
});

/**
 * Employee Dashboard Data Schema
 * 
 * This is the main schema that validates the entire dashboard response.
 * All nested schemas are composed here to create a complete validation contract.
 */
export const EmployeeDashboardSchema = z.object({
  kpis: KPIsSchema,
  weeklyTimesheet: WeeklyTimesheetSchema,
  latestPaystub: LatestPaystubSchema.nullable(),
  leaveOverview: LeaveOverviewSchema,
});

/**
 * TypeScript type derived from schema
 * This ensures type safety and single source of truth
 */
export type EmployeeDashboardData = z.infer<typeof EmployeeDashboardSchema>;

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: z.ZodError };

/**
 * Validate employee dashboard data
 * 
 * @param data - Raw data from API (unknown type for safety)
 * @returns Validation result with either valid data or error information
 */
export function validateEmployeeDashboardData(
  data: unknown
): ValidationResult<EmployeeDashboardData> {
  try {
    const validatedData = EmployeeDashboardSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Log validation errors for observability
      console.error("[Validation Error] Employee Dashboard data validation failed:", {
        errors: error.issues,
        data: data,
        timestamp: new Date().toISOString(),
      });

      // Create user-friendly error message
      const errorMessages = error.issues.map((err) => {
        const path = err.path.join(".");
        return `${path ? `${path}: ` : ""}${err.message}`;
      });

      return {
        success: false,
        error: `Invalid dashboard data: ${errorMessages.join("; ")}`,
        details: error,
      };
    }

    // Handle unexpected errors
    console.error("[Validation Error] Unexpected error during validation:", error);
    return {
      success: false,
      error: "An unexpected error occurred while validating dashboard data",
    };
  }
}

/**
 * Safe parse employee dashboard data
 * 
 * Similar to validateEmployeeDashboardData but uses safeParse for better error handling
 * 
 * @param data - Raw data from API
 * @returns Zod safeParse result
 */
export function safeParseEmployeeDashboardData(data: unknown) {
  return EmployeeDashboardSchema.safeParse(data);
}
