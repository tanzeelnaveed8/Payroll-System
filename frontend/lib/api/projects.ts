import { apiClient } from './client';

export type ProjectStatus = 'draft' | 'connected' | 'pending' | 'archived';
export type TrendDirection = 'up' | 'down' | 'neutral';
export type AuthType = 'api-key' | 'token' | 'oauth';

export interface ProjectKPI {
  users: number;
  revenue: number;
  activity: number;
  growth: number;
}

export interface ProjectHealth {
  uptime: number;
  engagement: number;
  risk: 'low' | 'medium' | 'high';
}

export interface ProjectConnection {
  baseUrl: string;
  authType: AuthType;
  apiKey?: string;
  token?: string;
  tokenExpiresAt?: string;
  lastSyncAt?: string;
}

export interface Project {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  category?: string;
  owner?: string;
  ownerId?: string;
  status: ProjectStatus;
  connection?: ProjectConnection;
  kpi?: ProjectKPI;
  trend?: TrendDirection;
  trendPercentage?: number;
  health?: ProjectHealth;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface CreateProjectData {
  name: string;
  category?: string;
  owner?: string;
  ownerId?: string;
  status: ProjectStatus;
  connection?: ProjectConnection;
  kpi?: ProjectKPI;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {}

export interface ProjectInsights {
  project: Project;
  insights: {
    kpi: ProjectKPI;
    trend: TrendDirection;
    trendPercentage: number;
    health: ProjectHealth;
  };
  chartData?: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }>;
  };
}

export interface AggregatedInsights {
  totalProjects: number;
  connectedProjects: number;
  totalUsers: number;
  totalRevenue: number;
  averageGrowth: number;
  averageUptime: number;
  averageEngagement: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface ConnectionTestResult {
  success: boolean;
  status: number;
  statusText: string;
  message: string;
}

export interface ListProjectsParams {
  status?: ProjectStatus;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListProjectsResponse {
  success: boolean;
  message: string;
  data: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const projectsApi = {
  /**
   * List projects with filtering and pagination
   */
  async getProjects(params: ListProjectsParams = {}): Promise<ListProjectsResponse> {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get<ListProjectsResponse>(`/projects${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get project by ID
   */
  async getProject(id: string): Promise<ApiResponse<{ project: Project }>> {
    return apiClient.get<ApiResponse<{ project: Project }>>(`/projects/${id}`);
  },

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectData): Promise<ApiResponse<{ project: Project }>> {
    return apiClient.post<ApiResponse<{ project: Project }>>('/projects', data);
  },

  /**
   * Update a project
   */
  async updateProject(id: string, data: UpdateProjectData): Promise<ApiResponse<{ project: Project }>> {
    return apiClient.put<ApiResponse<{ project: Project }>>(`/projects/${id}`, data);
  },

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/projects/${id}`);
  },

  /**
   * Get project insights
   */
  async getProjectInsights(id: string, includeChartData = false): Promise<ApiResponse<ProjectInsights>> {
    const query = includeChartData ? '?includeChartData=true' : '';
    return apiClient.get<ApiResponse<ProjectInsights>>(`/projects/${id}/insights${query}`);
  },

  /**
   * Get aggregated insights across all projects
   */
  async getAggregatedInsights(status?: ProjectStatus): Promise<ApiResponse<{ insights: AggregatedInsights }>> {
    const query = status ? `?status=${status}` : '';
    return apiClient.get<ApiResponse<{ insights: AggregatedInsights }>>(`/projects/insights/aggregated${query}`);
  },

  /**
   * Test project connection
   */
  async testConnection(id: string, connection?: ProjectConnection): Promise<ApiResponse<{ connectionTest: ConnectionTestResult }>> {
    return apiClient.post<ApiResponse<{ connectionTest: ConnectionTestResult }>>(`/projects/${id}/connect`, { connection });
  },

  /**
   * Sync project data
   */
  async syncProject(id: string): Promise<ApiResponse<{ project: Project; syncedData: ProjectKPI }>> {
    return apiClient.post<ApiResponse<{ project: Project; syncedData: ProjectKPI }>>(`/projects/${id}/sync`);
  },
};

