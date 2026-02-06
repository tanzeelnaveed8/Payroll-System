# Data Validation & Contract Safety

This directory contains Zod validation schemas that serve as the **single source of truth** for API contracts.

## Why This Matters

### Prevents Production Incidents

1. **Catches API Changes Immediately**
   - If the backend changes the response structure, validation fails immediately
   - No silent data corruption or runtime crashes
   - Developers are alerted to breaking changes during development

2. **Prevents Runtime Crashes**
   - Invalid data is caught before reaching React components
   - Type-safe data flows through the application
   - Components can trust the data structure

3. **Prevents Silent Data Corruption**
   - Ensures all required fields are present
   - Validates data types (numbers, strings, arrays, etc.)
   - Validates data ranges (e.g., percentages 0-100)

4. **Provides Observability**
   - Validation errors are logged with full context
   - Includes raw API response for debugging
   - Timestamps for tracking when issues occur

5. **Type Safety**
   - TypeScript types are derived from schemas using `z.infer`
   - Single source of truth - schema defines both runtime validation and types
   - No drift between types and validation logic

## Architecture

```
API Response (unknown)
    ↓
adminApi.getDashboard() - Returns raw unknown data
    ↓
adminService.getDashboardData() - Validates using schema
    ↓
validateAdminDashboardData() - Zod schema validation
    ↓
Validated AdminDashboardData (type-safe)
    ↓
React Components - Can safely use data
```

## Usage

### Schema Definition

```typescript
// lib/validators/adminDashboardSchema.ts
export const AdminDashboardSchema = z.object({
  kpis: KPIsSchema,
  recentPayrollActivity: z.array(RecentPayrollActivityItemSchema),
  departmentBreakdown: DepartmentBreakdownSchema,
});

// Type is derived from schema
export type AdminDashboardData = z.infer<typeof AdminDashboardSchema>;
```

### Validation

```typescript
// lib/services/adminService.ts
const rawData = await adminApi.getDashboard();
const validationResult = validateAdminDashboardData(rawData);

if (!validationResult.success) {
  // Log error and throw user-friendly error
  throw new DashboardValidationError(validationResult.error);
}

// Data is now guaranteed to match schema
const validatedData = validationResult.data;
```

### Error Handling

```typescript
// Components catch validation errors
try {
  const data = await adminService.getDashboardData();
} catch (error) {
  if (error instanceof DashboardValidationError) {
    // Show validation-specific error message
  }
}
```

## Best Practices

1. **Always validate at the service layer** - Never trust API responses
2. **Log validation errors with context** - Include raw data and timestamps
3. **Derive types from schemas** - Use `z.infer` for type safety
4. **Provide user-friendly error messages** - Don't expose technical details
5. **Fail fast** - Throw errors immediately when validation fails

## Adding New Schemas

1. Define the schema using Zod
2. Export the type using `z.infer<typeof YourSchema>`
3. Create a validation function
4. Use in the service layer
5. Update error handling in components
