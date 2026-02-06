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
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  bio?: string;
  joinDate?: string;
  baseSalary?: number;
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
  role: 'admin' | 'manager' | 'employee' | 'dept_lead';
  employeeId?: string;
  departmentId?: string;
  department?: string;
  position?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'intern';
  status?: 'active' | 'inactive' | 'on-leave' | 'terminated';
  phone?: string;
  baseSalary?: number;
  skills?: string[];
  fields?: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'admin' | 'manager' | 'employee' | 'dept_lead';
  employeeId?: string;
  departmentId?: string;
  department?: string;
  position?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'intern';
  status?: 'active' | 'inactive' | 'on-leave' | 'terminated';
  phone?: string;
  baseSalary?: number;
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
    try {
      // Validate required fields before making the request
      if (!data.email || !data.password || !data.name || !data.role) {
        throw new Error('Email, password, name, and role are required to create a user');
      }

      const response = await apiClient.post<{ success: boolean; message: string; data: { user: any } }>('/users', data);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create user');
      }
      
      if (!response.data?.user) {
        throw new Error('Invalid response format from server');
      }
      
      return {
        ...response,
        data: { user: transformUser(response.data.user) },
      };
    } catch (error: any) {
      // Log API call error for debugging
      console.error('[UsersAPI] Error creating user:', {
        error: error,
        message: error?.message,
        endpoint: '/users',
        method: 'POST',
        timestamp: new Date().toISOString(),
      });
      
      // Re-throw with original error message
      throw error;
    }
  },

  async updateUser(id: string, data: UpdateUserRequest): Promise<UserResponse> {
    const response = await apiClient.put<{ success: boolean; message: string; data: { user: any } }>(`/users/${id}`, data);
    return {
      ...response,
      data: { user: transformUser(response.data.user) },
    };
  },

  async toggleUserStatus(id: string, status: 'active' | 'inactive'): Promise<UserResponse> {
    const response = await apiClient.patch<{ success: boolean; message: string; data: { user: any } }>(`/users/${id}/status`, { status });
    return {
      ...response,
      data: { user: transformUser(response.data.user) },
    };
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/users/${id}`);
      return response;
    } catch (error: any) {
      console.error('[UsersAPI] Error deleting user:', {
        error: error,
        message: error?.message,
        endpoint: `/users/${id}`,
        method: 'DELETE',
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
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

  async uploadProfilePhoto(file: File): Promise<UserResponse & { photoUrl?: string }> {
    const formData = new FormData();
    formData.append('photo', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    const response = await fetch(`${apiUrl}/users/profile/photo`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to upload profile photo' }));
      throw new Error(error.message || 'Failed to upload profile photo');
    }

    const result = await response.json();
    
    // Use photoUrl from response data if available, otherwise use user.photo
    // Response structure: { success: true, message: '...', data: { user: {...}, photoUrl: '...' } }
    const user = result.data?.user || {};
    const photoUrl = result.data?.photoUrl;
    
    // Update user photo with the photoUrl from response if available
    if (photoUrl) {
      user.photo = photoUrl;
    }
    
    const transformedUser = transformUser(user);
    
    // Return response with photoUrl for easy access
    return {
      ...result,
      data: { user: transformedUser },
      photoUrl: photoUrl || transformedUser.photo,
    };
  },

  async downloadProfilePDF(userId?: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    // Use profile/download for current user, or /:id/download for specific user (admin only)
    const endpoint = userId ? `/users/${userId}/download` : '/users/profile/download';
    
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to download profile PDF' }));
      throw new Error(error.message || 'Failed to download profile PDF');
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'profile.pdf';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

