import { apiClient } from './client';

export interface Highlight {
  title: string;
  description: string;
  impact?: string;
  employeeId?: string;
  employeeName?: string;
}

export interface Challenge {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved';
  resolution?: string;
}

export interface ResourceNeed {
  type: 'personnel' | 'budget' | 'equipment' | 'training' | 'other';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NextPeriodGoal {
  title: string;
  description: string;
  targetDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ProgressUpdate {
  _id?: string;
  id?: string;
  deptLeadId: string | { _id: string; name: string; email: string };
  deptLeadName: string;
  departmentId: string | { _id: string; name: string; code?: string };
  department: string;
  updateDate: string;
  periodStart: string;
  periodEnd: string;
  totalEmployees: number;
  activeEmployees: number;
  reportsSubmitted: number;
  reportsPending: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksOverdue: number;
  completionRate: number;
  highlights: Highlight[];
  challenges: Challenge[];
  resourceNeeds: ResourceNeed[];
  nextPeriodGoals: NextPeriodGoal[];
  status: 'draft' | 'submitted' | 'acknowledged';
  recipients: Array<{
    userId: string;
    role: 'admin' | 'manager';
    viewedAt?: string;
  }>;
  acknowledgedBy?: string | { _id: string; name: string; email: string };
  acknowledgedAt?: string;
  acknowledgmentComments?: string;
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const progressUpdatesApi = {
  async createUpdate(update: Partial<ProgressUpdate>): Promise<ApiResponse<ProgressUpdate>> {
    return apiClient.post<ApiResponse<ProgressUpdate>>('/progress-updates', update);
  },

  async getMyUpdates(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ApiResponse<{ updates: ProgressUpdate[] }>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const query = params.toString();
    return apiClient.get<ApiResponse<{ updates: ProgressUpdate[] }>>(
      `/progress-updates/dept-lead${query ? `?${query}` : ''}`
    );
  },

  async getUpdates(filters?: {
    departmentId?: string;
    deptLeadId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ApiResponse<{ updates: ProgressUpdate[] }>> {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.deptLeadId) params.append('deptLeadId', filters.deptLeadId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const query = params.toString();
    return apiClient.get<ApiResponse<{ updates: ProgressUpdate[] }>>(
      `/progress-updates${query ? `?${query}` : ''}`
    );
  },

  async getUpdateById(updateId: string): Promise<ApiResponse<ProgressUpdate>> {
    return apiClient.get<ApiResponse<ProgressUpdate>>(`/progress-updates/${updateId}`);
  },

  async acknowledgeUpdate(updateId: string, comments: string): Promise<ApiResponse<ProgressUpdate>> {
    return apiClient.post<ApiResponse<ProgressUpdate>>(`/progress-updates/${updateId}/acknowledge`, { comments });
  },
};
