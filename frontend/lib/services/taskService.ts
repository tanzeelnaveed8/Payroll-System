import { taskApi, type Task, type TaskStatus, type TaskPriority } from '@/lib/api/tasks';

export type { Task, TaskStatus, TaskPriority } from '@/lib/api/tasks';

export interface TaskFilters {
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
}

export interface TaskSort {
  field: string;
  direction: 'asc' | 'desc';
}

export const taskService = {
  async getTasks(filters: TaskFilters = {}, sort: TaskSort = { field: 'assignedDate', direction: 'desc' }, page: number = 1, pageSize: number = 10): Promise<{ data: Task[]; total: number }> {
    const response = await taskApi.getTasks({
      ...filters,
      page,
      limit: pageSize,
      sort: sort.field,
      order: sort.direction,
    });
    return {
      data: response.data,
      total: response.pagination.total,
    };
  },

  async getTask(id: string): Promise<Task | null> {
    try {
      const response = await taskApi.getTaskById(id);
      return response.data.task;
    } catch {
      return null;
    }
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
  }): Promise<Task> {
    const response = await taskApi.createTask(data);
    return response.data.task;
  },

  async assignTask(data: {
    employeeId: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
  }): Promise<Task> {
    // assignTask is an alias for createTask (status is ignored as it defaults to pending)
    return this.createTask({
      employeeId: data.employeeId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
    });
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const response = await taskApi.updateTask(id, data);
    return response.data.task;
  },

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const response = await taskApi.updateTaskStatus(id, status);
    return response.data.task;
  },

  async deleteTask(id: string): Promise<void> {
    await taskApi.deleteTask(id);
  },

  async getEmployeeTasks(employeeId: string, filters: {
    page?: number;
    limit?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
  } = {}): Promise<{ data: Task[]; total: number }> {
    const response = await taskApi.getEmployeeTasks(employeeId, filters);
    return {
      data: response.data,
      total: response.pagination.total,
    };
  },

  async getEmployeeCurrentTasks(employeeId: string): Promise<Task[]> {
    try {
      const response = await taskApi.getEmployeeCurrentTasks(employeeId);
      return Array.isArray(response.data.tasks) ? response.data.tasks : [];
    } catch (error) {
      console.error("Failed to load current tasks:", error);
      return [];
    }
  },

  async getEmployeeUpcomingTasks(employeeId: string): Promise<Task[]> {
    try {
      const response = await taskApi.getEmployeeUpcomingTasks(employeeId);
      return Array.isArray(response.data.tasks) ? response.data.tasks : [];
    } catch (error) {
      console.error("Failed to load upcoming tasks:", error);
      return [];
    }
  },

  // Wrapper methods for component compatibility
  async getCurrentTasks(employeeId: string): Promise<Task[]> {
    return this.getEmployeeCurrentTasks(employeeId);
  },

  async getUpcomingTasks(employeeId: string): Promise<Task[]> {
    return this.getEmployeeUpcomingTasks(employeeId);
  },
};
