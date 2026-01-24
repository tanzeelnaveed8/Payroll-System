import { apiClient } from './client';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  employeeId: string | { _id: string; name: string; email: string; employeeId?: string };
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedDate: string;
  completedDate?: string;
  startDate?: string;
  assignedBy: string | { _id: string; name: string; email: string };
  assignedByName?: string;
  progress: number;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  category?: string;
  attachments?: string[];
  employeeName?: string;
  employeeEmail?: string;
  employeeDepartment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TasksResponse {
  success: boolean;
  message: string;
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TaskResponse {
  success: boolean;
  message: string;
  data: { task: Task };
}

const transformTask = (task: any): Task => ({
  id: task._id || task.id,
  employeeId: task.employeeId?._id || task.employeeId || '',
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  assignedDate: task.assignedDate,
  completedDate: task.completedDate,
  startDate: task.startDate,
  assignedBy: task.assignedBy?._id || task.assignedBy || '',
  assignedByName: task.assignedByName || task.assignedBy?.name,
  progress: task.progress || 0,
  estimatedHours: task.estimatedHours,
  actualHours: task.actualHours,
  tags: task.tags || [],
  category: task.category,
  attachments: task.attachments || [],
  employeeName: task.employeeName || task.employeeId?.name,
  employeeEmail: task.employeeEmail || task.employeeId?.email,
  employeeDepartment: task.employeeDepartment || task.employeeId?.department,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

export const taskApi = {
  async getTasks(filters: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
    search?: string;
    employeeId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedBy?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
  } = {}): Promise<TasksResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== ('' as any)) {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    const response = await apiClient.get<{ success: boolean; message: string; data: any[]; pagination: any }>(`/tasks${query ? `?${query}` : ''}`);
    return {
      ...response,
      data: Array.isArray(response.data) ? response.data.map(transformTask) : [],
    };
  },

  async getTaskById(id: string): Promise<TaskResponse> {
    const response = await apiClient.get<{ success: boolean; message: string; data: { task: any } }>(`/tasks/${id}`);
    return {
      ...response,
      data: { task: transformTask(response.data.task) },
    };
  },

  async createTask(data: {
    employeeId: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate: string;
    estimatedHours?: number;
    tags?: string[];
    category?: string;
    attachments?: string[];
  }): Promise<TaskResponse> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { task: any } }>('/tasks', data);
    return {
      ...response,
      data: { task: transformTask(response.data.task) },
    };
  },

  async updateTask(id: string, data: Partial<Task>): Promise<TaskResponse> {
    const response = await apiClient.put<{ success: boolean; message: string; data: { task: any } }>(`/tasks/${id}`, data);
    return {
      ...response,
      data: { task: transformTask(response.data.task) },
    };
  },

  async updateTaskStatus(id: string, status: TaskStatus): Promise<TaskResponse> {
    const response = await apiClient.put<{ success: boolean; message: string; data: { task: any } }>(`/tasks/${id}/status`, { status });
    return {
      ...response,
      data: { task: transformTask(response.data.task) },
    };
  },

  async deleteTask(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/tasks/${id}`);
  },

  async getEmployeeTasks(employeeId: string, filters: {
    page?: number;
    limit?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
  } = {}): Promise<TasksResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== ('' as any)) {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    const response = await apiClient.get<{ success: boolean; message: string; data: any[]; pagination: any }>(`/tasks/employee/${employeeId}${query ? `?${query}` : ''}`);
    return {
      ...response,
      data: Array.isArray(response.data) ? response.data.map(transformTask) : [],
    };
  },

  async getEmployeeCurrentTasks(employeeId: string): Promise<{ success: boolean; message: string; data: { tasks: Task[] } }> {
    const response = await apiClient.get<{ success: boolean; message: string; data: { tasks: any[] } }>(`/tasks/employee/${employeeId}/current`);
    return {
      ...response,
      data: {
        tasks: Array.isArray(response.data.tasks) ? response.data.tasks.map(transformTask) : [],
      },
    };
  },

  async getEmployeeUpcomingTasks(employeeId: string): Promise<{ success: boolean; message: string; data: { tasks: Task[] } }> {
    const response = await apiClient.get<{ success: boolean; message: string; data: { tasks: any[] } }>(`/tasks/employee/${employeeId}/upcoming`);
    return {
      ...response,
      data: {
        tasks: Array.isArray(response.data.tasks) ? response.data.tasks.map(transformTask) : [],
      },
    };
  },
};

