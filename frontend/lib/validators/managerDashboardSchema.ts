import { z } from "zod";

/**
 * Manager Dashboard Validation Schema
 * 
 * This schema defines the strict contract for manager dashboard API responses.
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
 * Dashboard Data Schema
 */
export const ManagerDashboardSchema = z.object({
  teamMembers: z.number().int().min(0, "Team members must be a non-negative integer"),
  directReports: z.number().int().min(0, "Direct reports must be a non-negative integer"),
  pendingApprovals: z.number().int().min(0, "Pending approvals must be a non-negative integer"),
  timesheetsSubmitted: z.number().int().min(0, "Timesheets submitted must be a non-negative integer"),
  leaveRequestsPending: z.number().int().min(0, "Leave requests pending must be a non-negative integer"),
});

/**
 * TypeScript type derived from schema
 * This ensures type safety and single source of truth
 */
export type ManagerDashboardData = z.infer<typeof ManagerDashboardSchema>;

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: z.ZodError };

/**
 * Validate manager dashboard data
 * 
 * @param data - Raw data from API (unknown type for safety)
 * @returns Validation result with either valid data or error information
 */
export function validateManagerDashboardData(
  data: unknown
): ValidationResult<ManagerDashboardData> {
  try {
    const validatedData = ManagerDashboardSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Log validation errors for observability
      console.error("[Validation Error] Manager Dashboard data validation failed:", {
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
 * Safe parse manager dashboard data
 * 
 * Similar to validateManagerDashboardData but uses safeParse for better error handling
 * 
 * @param data - Raw data from API
 * @returns Zod safeParse result
 */
export function safeParseManagerDashboardData(data: unknown) {
  return ManagerDashboardSchema.safeParse(data);
}
