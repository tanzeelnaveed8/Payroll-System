import { z } from "zod";

/**
 * Department Lead Dashboard Validation Schema
 * 
 * This schema defines the strict contract for department lead dashboard API responses.
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
 * Department Lead Dashboard Data Schema
 * 
 * This is the main schema that validates the entire dashboard response.
 * All nested schemas are composed here to create a complete validation contract.
 */
export const DeptLeadDashboardSchema = z.object({
  departmentEmployees: z.number().int().min(0, "Department employees must be a non-negative integer"),
  activeTasks: z.number().int().min(0, "Active tasks must be a non-negative integer"),
  pendingTasks: z.number().int().min(0, "Pending tasks must be a non-negative integer"),
  completedTasks: z.number().int().min(0, "Completed tasks must be a non-negative integer"),
  inProgressTasks: z.number().int().min(0, "In progress tasks must be a non-negative integer"),
  overdueTasks: z.number().int().min(0, "Overdue tasks must be a non-negative integer"),
  teamPerformance: z.number().min(0).max(100, "Team performance must be between 0 and 100"),
  timesheetsPending: z.number().int().min(0, "Timesheets pending must be a non-negative integer"),
});

/**
 * TypeScript type derived from schema
 * This ensures type safety and single source of truth
 */
export type DeptLeadDashboardData = z.infer<typeof DeptLeadDashboardSchema>;

/**
 * Custom error class for validation failures
 * Provides structured error information for better debugging
 */
export class DeptLeadDashboardValidationError extends Error {
  constructor(
    message: string,
    public readonly validationDetails?: unknown
  ) {
    super(message);
    this.name = 'DeptLeadDashboardValidationError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DeptLeadDashboardValidationError);
    }
  }
}

/**
 * Validates department lead dashboard data against the schema
 * 
 * @param data - The data to validate (unknown type for safety)
 * @returns Validation result with success flag and either validated data or error details
 */
export function validateDeptLeadDashboardData(
  data: unknown
): { success: true; data: DeptLeadDashboardData } | { success: false; error: string; details?: z.ZodError } {
  try {
    const validatedData = DeptLeadDashboardSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[Validation Error] Department Lead Dashboard data validation failed:", {
        issues: error.issues,
        data: data,
        timestamp: new Date().toISOString(),
      });
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
    console.error("[Validation Error] Unexpected error during validation:", error);
    return {
      success: false,
      error: "An unexpected error occurred while validating dashboard data",
    };
  }
}

/**
 * Safe parse function that returns a Zod result
 * Useful for cases where you want to handle validation without throwing
 */
export function safeParseDeptLeadDashboardData(data: unknown) {
  return DeptLeadDashboardSchema.safeParse(data);
}
