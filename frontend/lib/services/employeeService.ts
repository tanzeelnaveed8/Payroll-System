import {
  employeeApi,
  type CurrentTimesheet,
  type Paystub,
  type PaystubDetail,
  type LeaveBalance,
  type LeaveRequest,
  type CreateLeaveRequestData,
} from '@/lib/api/employee';
import { usersApi, type User, type UserFilters } from '@/lib/api/users';
import {
  validateEmployeeDashboardData,
  type EmployeeDashboardData,
} from '../validators/employeeDashboardSchema';

// Employment types matching User interface from @/lib/api/users
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern';
export type EmploymentStatus = 'active' | 'inactive' | 'on-leave' | 'terminated';

const mapId = (obj: any): any => {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(mapId);
  }
  if (typeof obj === 'object') {
    const mapped = { ...obj };
    if (mapped._id && !mapped.id) {
      mapped.id = mapped._id;
    }
    return mapped;
  }
  return obj;
};

/**
 * Custom error class for validation failures
 */
export class EmployeeDashboardValidationError extends Error {
  constructor(
    message: string,
    public readonly validationDetails?: unknown
  ) {
    super(message);
    this.name = 'EmployeeDashboardValidationError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EmployeeDashboardValidationError);
    }
  }
}

export const employeeService = {
  /**
   * Get employee dashboard data with validation
   * 
   * This method:
   * 1. Fetches raw data from API
   * 2. Validates against EmployeeDashboardSchema
   * 3. Returns validated, type-safe data
   * 
   * If validation fails:
   * - Logs detailed error information for observability
   * - Throws user-friendly error message
   * - Prevents invalid data from reaching components
   * 
   * @throws {EmployeeDashboardValidationError} If API response doesn't match schema
   */
  async getDashboard(): Promise<EmployeeDashboardData> {
    try {
      // Fetch raw data from API (unknown type for safety)
      const response = await employeeApi.getDashboard();
      
      // Extract data from API response wrapper
      let rawData: unknown;
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        rawData = (response as { success: boolean; data: unknown }).data;
      } else {
        rawData = response;
      }
      
      // Map IDs if needed (for backward compatibility)
      let mappedData: unknown = rawData;
      if (rawData && typeof rawData === 'object' && rawData !== null) {
        const data = rawData as any;
        mappedData = {
          ...data,
          latestPaystub: data.latestPaystub ? mapId(data.latestPaystub) : null,
          leaveOverview: {
            ...data.leaveOverview,
            upcomingLeaves: data.leaveOverview?.upcomingLeaves?.map(mapId) || [],
          },
        };
      }
      
      // Validate against schema - this is the critical safety check
      const validationResult = validateEmployeeDashboardData(mappedData);
      
      if (!validationResult.success) {
        // Log validation error with full context for observability
        // Note: userId will be added by the calling component if available
        console.error('[Employee Service] Dashboard data validation failed:', {
          error: validationResult.error,
          details: validationResult.details,
          rawData: mappedData,
          timestamp: new Date().toISOString(),
          service: 'employeeService',
          method: 'getDashboard',
        });

        // Throw user-friendly error that will be caught by React Query
        throw new EmployeeDashboardValidationError(
          validationResult.error,
          validationResult.details
        );
      }

      // At this point, data is guaranteed to match EmployeeDashboardSchema
      return validationResult.data;
    } catch (error) {
      // Re-throw validation errors as-is
      if (error instanceof EmployeeDashboardValidationError) {
        throw error;
      }

      // Log and re-throw other errors (network, etc.)
      if (error instanceof Error) {
        console.error('[Employee Service] Failed to fetch dashboard data:', {
          error: error.message,
          name: error.name,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }

      // Handle unexpected error types
      throw new Error('An unexpected error occurred while fetching dashboard data');
    }
  },

  async getCurrentTimesheet(): Promise<CurrentTimesheet> {
    const response = await employeeApi.getCurrentTimesheet();
    if (response.success && response.data) {
      const data = response.data;
      return {
        ...data,
        period: data.period ? mapId(data.period) : null,
        timesheets: data.timesheets.map(mapId),
      };
    }
    throw new Error(response.message || 'Failed to load timesheet');
  },

  async submitTimesheet(timesheetIds: string[]): Promise<void> {
    const response = await employeeApi.submitTimesheet(timesheetIds);
    if (!response.success) {
      throw new Error(response.message || 'Failed to submit timesheet');
    }
  },

  async getPaystubs(page = 1, limit = 10): Promise<{ paystubs: Paystub[]; pagination: any }> {
    const response = await employeeApi.getPaystubs(page, limit);
    if (response.success && response.data) {
      return {
        paystubs: response.data.map(mapId),
        pagination: response.pagination,
      };
    }
    return { paystubs: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  },

  async getPaystubById(id: string): Promise<PaystubDetail> {
    const response = await employeeApi.getPaystubById(id);
    if (response.success && response.data?.paystub) {
      return mapId(response.data.paystub);
    }
    throw new Error(response.message || 'Failed to load paystub');
  },

  async getLeaveBalance(): Promise<LeaveBalance> {
    const response = await employeeApi.getLeaveBalance();
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to load leave balance');
  },

  async getLeaveRequests(page = 1, limit = 10): Promise<{ leaveRequests: LeaveRequest[]; pagination: any }> {
    const response = await employeeApi.getLeaveRequests(page, limit);
    if (response.success && response.data) {
      return {
        leaveRequests: response.data.map(mapId),
        pagination: response.pagination,
      };
    }
    return { leaveRequests: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  },

  async createLeaveRequest(data: CreateLeaveRequestData): Promise<LeaveRequest> {
    const response = await employeeApi.createLeaveRequest(data);
    if (response.success && response.data?.leaveRequest) {
      return mapId(response.data.leaveRequest);
    }
    throw new Error(response.message || 'Failed to create leave request');
  },

  async getDepartments(): Promise<string[]> {
    try {
      const response = await usersApi.getUniqueDepartments();
      if (response.success && response.data?.departments) {
        return response.data.departments;
      }
      return [];
    } catch (error) {
      console.error('Failed to load departments:', error);
      return [];
    }
  },

  async getRoles(): Promise<string[]> {
    try {
      const response = await usersApi.getUniqueRoles();
      if (response.success && response.data?.roles) {
        return response.data.roles;
      }
      return [];
    } catch (error) {
      console.error('Failed to load roles:', error);
      return [];
    }
  },

  async getEmployees(
    filters: EmployeeFilter = {},
    sort: EmployeeSort = { field: 'name', direction: 'asc' },
    pagination: { page: number; pageSize: number } = { page: 1, pageSize: 10 }
  ): Promise<{ items: Employee[]; total: number }> {
    try {
      const userFilters: UserFilters = {
        page: pagination.page,
        limit: pagination.pageSize,
        sort: String(sort.field),
        order: sort.direction,
        ...filters,
      };

      const response = await usersApi.getUsers(userFilters);
      if (response.success && response.data) {
        return {
          items: response.data.map(mapId) as Employee[],
          total: response.pagination?.total || 0,
        };
      }
      return { items: [], total: 0 };
    } catch (error) {
      console.error('Failed to load employees:', error);
      throw error;
    }
  },

  async getEmployee(id: string): Promise<Employee | null> {
    try {
      const response = await usersApi.getUserById(id);
      if (response.success && response.data?.user) {
        return mapId(response.data.user) as Employee;
      }
      return null;
    } catch (error) {
      console.error('Failed to load employee:', error);
      throw error;
    }
  },

  async addEmployee(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    department?: string;
    position?: string;
    employmentType?: EmploymentType;
    status?: EmploymentStatus;
    photo?: string;
    phone?: string;
    employeeId?: string;
    joinDate?: string;
    contractStart?: string;
    contractEnd?: string;
    baseSalary?: number;
  }): Promise<Employee> {
    try {
      // Map form data to CreateUserRequest format
      const createUserData: any = {
        name: data.name,
        email: data.email,
        password: data.password, // Password required for user creation
        role: data.role || 'employee',
        department: data.department,
        position: data.position,
        employmentType: data.employmentType || 'full-time',
        status: data.status || 'active',
        photo: data.photo,
        phone: data.phone,
        employeeId: data.employeeId,
        joinDate: data.joinDate,
      };

      // Add monthly salary (required for employee and manager roles)
      if ((data.role === 'employee' || data.role === 'manager') && data.baseSalary) {
        createUserData.baseSalary = data.baseSalary;
      }

      // Add contract dates if employment type is contract
      if (data.employmentType === 'contract') {
        if (data.contractStart) {
          createUserData.contractStart = data.contractStart;
        }
        if (data.contractEnd) {
          createUserData.contractEnd = data.contractEnd;
        }
      }

      // Log request data for debugging (without sensitive info)
      console.log('[EmployeeService] Creating employee:', {
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
        employmentType: data.employmentType,
        timestamp: new Date().toISOString(),
      });

      const response = await usersApi.createUser(createUserData);
      
      if (response.success && response.data?.user) {
        return mapId(response.data.user) as Employee;
      }
      
      // If response is not successful, throw with message
      throw new Error(response.message || 'Failed to create employee');
    } catch (error: any) {
      // Enhanced error logging for production debugging
      console.error('[EmployeeService] Failed to add employee:', {
        error: error,
        message: error?.message,
        stack: error?.stack,
        name: 'name' in data ? data.name : undefined,
        email: 'email' in data ? data.email : undefined,
        role: 'role' in data ? data.role : undefined,
        timestamp: new Date().toISOString(),
      });
      
      // Re-throw with original error message
      // The error message will be handled by AddEmployeeModal
      throw error;
    }
  },

  /**
   * Delete an employee (Admin only)
   * Only inactive employees can be deleted
   * Active employees must be deactivated first
   */
  async deleteEmployee(id: string): Promise<void> {
    try {
      console.log('[EmployeeService] Deleting employee:', {
        id: id,
        timestamp: new Date().toISOString(),
      });

      const response = await usersApi.deleteUser(id);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete employee');
      }
    } catch (error: any) {
      // Enhanced error logging for production debugging
      console.error('[EmployeeService] Failed to delete employee:', {
        error: error,
        message: error?.message,
        stack: error?.stack,
        id: id,
        timestamp: new Date().toISOString(),
      });
      
      // Re-throw with original error message
      throw error;
    }
  },

  async updateEmployee(
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: string;
      department?: string;
      position?: string;
      employmentType?: EmploymentType;
      status?: EmploymentStatus;
      photo?: string;
      phone?: string;
      employeeId?: string;
      baseSalary?: number;
      skills?: string[];
      fields?: string[];
    }
  ): Promise<Employee> {
    try {
      const updateData: import('@/lib/api/users').UpdateUserRequest = {
        name: data.name,
        email: data.email,
        role: data.role as any,
        department: data.department,
        position: data.position,
        employmentType: data.employmentType,
        status: data.status,
        phone: data.phone,
        employeeId: data.employeeId,
        baseSalary: data.baseSalary,
        skills: data.skills,
        fields: data.fields,
      };

      const response = await usersApi.updateUser(id, updateData);
      if (response.success && response.data?.user) {
        return mapId(response.data.user) as Employee;
      }
      throw new Error(response.message || 'Failed to update employee');
    } catch (error) {
      console.error('Failed to update employee:', error);
      throw error;
    }
  },
};

// Export types for admin employee management
export type Employee = User;

export type EmployeeFilter = {
  search?: string;
  department?: string;
  role?: string;
  status?: string;
  employmentType?: string;
};
export type EmployeeSort = {
  field: keyof Employee;
  direction: 'asc' | 'desc';
};

export type {
  EmployeeDashboardData,
  CurrentTimesheet,
  Paystub,
  PaystubDetail,
  LeaveBalance,
  LeaveRequest,
};
