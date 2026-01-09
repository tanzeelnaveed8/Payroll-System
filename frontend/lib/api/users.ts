import { apiClient } from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId?: string;
  department?: string;
  departmentId?: string;
  position?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'intern';
  status: 'active' | 'inactive' | 'on-leave' | 'terminated';
  photo?: string;
  phone?: string;
  joinDate?: string;
  baseSalary?: number;
  hourlyRate?: number;
  managerId?: string;
  skills?: string[];
  fields?: string[];
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: { user: User };
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  employeeId?: string;
  departmentId?: string;
  department?: string;
  position?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'intern';
  status?: 'active' | 'inactive' | 'on-leave' | 'terminated';
  phone?: string;
  baseSalary?: number;
  hourlyRate?: number;
  skills?: string[];
  fields?: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'admin' | 'manager' | 'employee';
  employeeId?: string;
  departmentId?: string;
  department?: string;
  position?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'intern';
  status?: 'active' | 'inactive' | 'on-leave' | 'terminated';
  phone?: string;
  baseSalary?: number;
  hourlyRate?: number;
  skills?: string[];
  fields?: string[];
}

export interface UserFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  role?: string;
  status?: string;
  employmentType?: string;
  departmentId?: string;
  department?: string;
}

const transformUser = (user: any): User => ({
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
  skills: user.skills || [],
  fields: user.fields || [],
});

export const usersApi = {
  async getUsers(filters: UserFilters = {}): Promise<UsersResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    const response = await apiClient.get<{ success: boolean; message: string; data: any[]; pagination: any }>(`/users${query ? `?${query}` : ''}`);
    return {
      ...response,
      data: response.data.map(transformUser),
    };
  },

  async getUserById(id: string): Promise<UserResponse> {
    const response = await apiClient.get<{ success: boolean; message: string; data: { user: any } }>(`/users/${id}`);
    return {
      ...response,
      data: { user: transformUser(response.data.user) },
    };
  },

  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { user: any } }>('/users', data);
    return {
      ...response,
      data: { user: transformUser(response.data.user) },
    };
  },

  async updateUser(id: string, data: UpdateUserRequest): Promise<UserResponse> {
    const response = await apiClient.put<{ success: boolean; message: string; data: { user: any } }>(`/users/${id}`, data);
    return {
      ...response,
      data: { user: transformUser(response.data.user) },
    };
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/users/${id}`);
  },

  async getCurrentUserProfile(): Promise<UserResponse> {
    const response = await apiClient.get<{ success: boolean; message: string; data: { user: any } }>('/users/profile');
    return {
      ...response,
      data: { user: transformUser(response.data.user) },
    };
  },

  async updateCurrentUserProfile(data: UpdateUserRequest): Promise<UserResponse> {
    const response = await apiClient.put<{ success: boolean; message: string; data: { user: any } }>('/users/profile', data);
    return {
      ...response,
      data: { user: transformUser(response.data.user) },
    };
  },

  async getUniqueRoles(): Promise<{ success: boolean; data: { roles: string[] } }> {
    return apiClient.get('/users/roles');
  },

  async getUniqueDepartments(): Promise<{ success: boolean; data: { departments: string[] } }> {
    return apiClient.get('/users/departments');
  },
};

