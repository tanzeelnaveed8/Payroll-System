import { apiClient } from './client';
import type { User, UsersResponse } from './users';

export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  managerId?: string;
  parentDepartmentId?: string;
  annualBudget?: number;
  monthlyBudget?: number;
  currentSpend?: number;
  employeeCount: number;
  activeEmployeeCount: number;
  costCenter?: string;
  location?: string;
  timezone?: string;
  workingDays?: string[];
  status: 'active' | 'inactive';
}

export interface DepartmentsResponse {
  success: boolean;
  message: string;
  data: Department[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DepartmentResponse {
  success: boolean;
  message: string;
  data: { department: Department };
}

export interface CreateDepartmentRequest {
  name: string;
  code?: string;
  description?: string;
  managerId?: string;
  parentDepartmentId?: string;
  annualBudget?: number;
  monthlyBudget?: number;
  costCenter?: string;
  location?: string;
  timezone?: string;
  workingDays?: string[];
  status?: 'active' | 'inactive';
}

export interface UpdateDepartmentRequest {
  name?: string;
  code?: string;
  description?: string;
  managerId?: string;
  parentDepartmentId?: string;
  annualBudget?: number;
  monthlyBudget?: number;
  costCenter?: string;
  location?: string;
  timezone?: string;
  workingDays?: string[];
  status?: 'active' | 'inactive';
}

export interface DepartmentFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  status?: string;
}

const transformDepartment = (dept: any): Department => ({
  id: dept._id || dept.id,
  name: dept.name,
  code: dept.code,
  description: dept.description,
  managerId: dept.managerId?._id || dept.managerId,
  parentDepartmentId: dept.parentDepartmentId?._id || dept.parentDepartmentId,
  annualBudget: dept.annualBudget,
  monthlyBudget: dept.monthlyBudget,
  currentSpend: dept.currentSpend,
  employeeCount: dept.employeeCount || 0,
  activeEmployeeCount: dept.activeEmployeeCount || 0,
  costCenter: dept.costCenter,
  location: dept.location,
  timezone: dept.timezone,
  workingDays: dept.workingDays,
  status: dept.status,
});

export const departmentsApi = {
  async getDepartments(filters: DepartmentFilters = {}): Promise<DepartmentsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    const response = await apiClient.get<{ success: boolean; message: string; data: any[]; pagination: any }>(`/departments${query ? `?${query}` : ''}`);
    return {
      ...response,
      data: response.data.map(transformDepartment),
    };
  },

  async getDepartmentById(id: string): Promise<DepartmentResponse> {
    const response = await apiClient.get<{ success: boolean; message: string; data: { department: any } }>(`/departments/${id}`);
    return {
      ...response,
      data: { department: transformDepartment(response.data.department) },
    };
  },

  async createDepartment(data: CreateDepartmentRequest): Promise<DepartmentResponse> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { department: any } }>('/departments', data);
    return {
      ...response,
      data: { department: transformDepartment(response.data.department) },
    };
  },

  async updateDepartment(id: string, data: UpdateDepartmentRequest): Promise<DepartmentResponse> {
    const response = await apiClient.put<{ success: boolean; message: string; data: { department: any } }>(`/departments/${id}`, data);
    return {
      ...response,
      data: { department: transformDepartment(response.data.department) },
    };
  },

  async deleteDepartment(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/departments/${id}`);
  },

  async getDepartmentEmployees(id: string, filters: { page?: number; limit?: number; status?: string } = {}): Promise<UsersResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    const response = await apiClient.get<{ success: boolean; message: string; data: any[]; pagination: any }>(`/departments/${id}/employees${query ? `?${query}` : ''}`);
    return {
      ...response,
      data: response.data.map((user: any) => ({
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        departmentId: user.departmentId?._id || user.departmentId,
        position: user.position,
        employmentType: user.employmentType,
        status: user.status,
        photo: user.photo,
        phone: user.phone,
        joinDate: user.joinDate,
        baseSalary: user.baseSalary,
        hourlyRate: user.hourlyRate,
        managerId: user.managerId?._id || user.managerId,
      })),
    };
  },
};

