import { z } from "zod";

/**
 * Admin Dashboard Validation Schema
 * 
 * This schema defines the strict contract for admin dashboard API responses.
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
 * Payroll Status Schema
 */
const PayrollStatusSchema = z.object({
  total: z.number().min(0, "Total payroll must be non-negative"),
  status: z.string().min(1, "Status is required"),
  nextPayday: z.string().nullable(),
});

/**
 * KPIs Schema
 */
const KPIsSchema = z.object({
  totalEmployees: z.number().int().min(0, "Total employees must be a non-negative integer"),
  employeeGrowth: z.number().min(-100).max(1000, "Employee growth percentage must be between -100 and 1000"),
  newHiresLast30Days: z.number().int().min(0, "New hires must be a non-negative integer"),
  payrollStatus: PayrollStatusSchema,
  pendingApprovals: z.number().int().min(0, "Pending approvals must be a non-negative integer"),
  pendingTimesheets: z.number().int().min(0, "Pending timesheets must be a non-negative integer"),
  pendingLeaveRequests: z.number().int().min(0, "Pending leave requests must be a non-negative integer"),
  pendingPayroll: z.number().int().min(0, "Pending payroll must be a non-negative integer"),
  totalDepartments: z.number().int().min(0, "Total departments must be a non-negative integer"),
  averageSalary: z.number().min(0, "Average salary must be non-negative"),
  leaveRequestsThisMonth: z.number().int().min(0, "Leave requests this month must be a non-negative integer"),
  timesheetCompletionRate: z.number().min(0).max(100, "Timesheet completion rate must be between 0 and 100"),
  compliance: z.number().min(0).max(100, "Compliance rate must be between 0 and 100"),
});

/**
 * Recent Payroll Activity Item Schema
 */
const RecentPayrollActivityItemSchema = z.object({
  id: z.string().min(1, "Payroll activity ID is required"),
  period: z.string().min(1, "Period is required"),
  amount: z.number().min(0, "Amount must be non-negative"),
  status: z.string().min(1, "Status is required"),
  date: z.string().min(1, "Date is required"),
  employees: z.number().int().min(0, "Employee count must be a non-negative integer"),
});

/**
 * Department Schema
 */
const DepartmentSchema = z.object({
  id: z.string().min(1, "Department ID is required"),
  name: z.string().min(1, "Department name is required"),
  employees: z.number().int().min(0, "Employee count must be a non-negative integer"),
  payroll: z.number().min(0, "Payroll must be non-negative"),
  bgColor: z.string().min(1, "Background color is required"),
  barColor: z.string().min(1, "Bar color is required"),
});

/**
 * Department Breakdown Schema
 */
const DepartmentBreakdownSchema = z.object({
  departments: z.array(DepartmentSchema).min(0, "Departments array is required"),
  largestDepartment: z.string().nullable(),
});

/**
 * Admin Dashboard Data Schema
 * 
 * This is the main schema that validates the entire dashboard response.
 * All nested schemas are composed here to create a complete validation contract.
 */
export const AdminDashboardSchema = z.object({
  kpis: KPIsSchema,
  recentPayrollActivity: z.array(RecentPayrollActivityItemSchema).min(0, "Recent payroll activity array is required"),
  departmentBreakdown: DepartmentBreakdownSchema,
});

/**
 * TypeScript type derived from schema
 * This ensures type safety and single source of truth
 */
export type AdminDashboardData = z.infer<typeof AdminDashboardSchema>;

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: z.ZodError };

/**
 * Validate admin dashboard data
 * 
 * @param data - Raw data from API (unknown type for safety)
 * @returns Validation result with either valid data or error information
 */
export function validateAdminDashboardData(
  data: unknown
): ValidationResult<AdminDashboardData> {
  try {
    const validatedData = AdminDashboardSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Log validation errors for observability
      console.error("[Validation Error] Admin Dashboard data validation failed:", {
        errors: error.issues,
        data: data,
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
 * Safe parse admin dashboard data
 * 
 * Similar to validateAdminDashboardData but uses safeParse for better error handling
 * 
 * @param data - Raw data from API
 * @returns Zod safeParse result
 */
export function safeParseAdminDashboardData(data: unknown) {
  return AdminDashboardSchema.safeParse(data);
}
