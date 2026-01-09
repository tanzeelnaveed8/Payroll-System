import { projectsApi, type Project as ApiProject, type AggregatedInsights as ApiAggregatedInsights, type ProjectInsights as ApiProjectInsights, type CreateProjectData } from '@/lib/api/projects';

// Re-export types for backward compatibility
export type ProjectStatus = 'draft' | 'connected' | 'pending' | 'archived';
export type TrendDirection = 'up' | 'down' | 'neutral';
export type AuthType = 'api-key' | 'token' | 'oauth';

export interface ProjectKPI {
  users: number;
  revenue: number;
  activity: number;
  growth: number;
}

export interface Project {
  id: string;
  name: string;
  category?: string;
  status: ProjectStatus;
  kpi: ProjectKPI;
  trend: TrendDirection;
  trendPercentage: number;
}

export interface ProjectConnection {
  baseUrl: string;
  authType: AuthType;
  apiKey?: string;
  token?: string;
}

export interface AddProjectFormData {
  name: string;
  category?: string;
  owner?: string;
  connection: ProjectConnection;
  status: ProjectStatus;
}

export interface ProjectInsights {
  projectId: string;
  kpi: ProjectKPI;
  health: {
    uptime: number;
    engagement: number;
    risk: 'low' | 'medium' | 'high';
  };
  chartData: {
    labels: string[];
    values: number[];
  };
}

export interface AggregatedInsights {
  totalProjects: number;
  totalUsers: number;
  totalRevenue: number;
  totalActivity: number;
  averageGrowth: number;
}

/**
 * Convert API project to frontend project format
 */
const mapApiProjectToProject = (apiProject: ApiProject): Project => {
  return {
    id: apiProject._id || apiProject.id || '',
    name: apiProject.name,
    category: apiProject.category,
    status: apiProject.status,
    kpi: apiProject.kpi || {
      users: 0,
      revenue: 0,
      activity: 0,
      growth: 0,
    },
    trend: apiProject.trend || 'neutral',
    trendPercentage: apiProject.trendPercentage || 0,
  };
};

/**
 * Convert API insights to frontend insights format
 */
const mapApiInsightsToInsights = (apiInsights: ApiProjectInsights): ProjectInsights => {
  const chartData = apiInsights.chartData;
  const firstDataset = chartData?.datasets?.[0] || { data: [] };
  
  return {
    projectId: apiInsights.project._id || apiInsights.project.id || '',
    kpi: apiInsights.insights.kpi,
    health: apiInsights.insights.health,
    chartData: {
      labels: chartData?.labels || [],
      values: firstDataset.data || [],
    },
  };
};

/**
 * Convert API aggregated insights to frontend format
 */
const mapApiAggregatedToAggregated = (apiAggregated: ApiAggregatedInsights): AggregatedInsights => {
  return {
    totalProjects: apiAggregated.totalProjects,
    totalUsers: apiAggregated.totalUsers,
    totalRevenue: apiAggregated.totalRevenue,
    totalActivity: Math.round(apiAggregated.averageEngagement || 0),
    averageGrowth: apiAggregated.averageGrowth,
  };
};

export const businessService = {
  /**
   * Get all projects
   */
  async getProjects(): Promise<Project[]> {
    try {
      const response = await projectsApi.getProjects({ limit: 100 });
      if (response.success && response.data) {
        return response.data.map(mapApiProjectToProject);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  },

  /**
   * Get project insights
   */
  async getProjectInsights(projectId: string): Promise<ProjectInsights | null> {
    try {
      const response = await projectsApi.getProjectInsights(projectId, true);
      if (response.success && response.data) {
        return mapApiInsightsToInsights(response.data);
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch project insights:', error);
      return null;
    }
  },

  /**
   * Get aggregated insights
   */
  async getAggregatedInsights(): Promise<AggregatedInsights> {
    try {
      const response = await projectsApi.getAggregatedInsights();
      if (response.success && response.data?.insights) {
        return mapApiAggregatedToAggregated(response.data.insights);
      }
      return {
        totalProjects: 0,
        totalUsers: 0,
        totalRevenue: 0,
        totalActivity: 0,
        averageGrowth: 0,
      };
    } catch (error) {
      console.error('Failed to fetch aggregated insights:', error);
      return {
        totalProjects: 0,
        totalUsers: 0,
        totalRevenue: 0,
        totalActivity: 0,
        averageGrowth: 0,
      };
    }
  },

  /**
   * Add a new project
   */
  async addProject(formData: AddProjectFormData): Promise<Project> {
    try {
      const createData: CreateProjectData = {
        name: formData.name,
        category: formData.category,
        owner: formData.owner,
        status: formData.status,
        connection: formData.connection,
      };

      const response = await projectsApi.createProject(createData);
      if (response.success && response.data?.project) {
        return mapApiProjectToProject(response.data.project);
      }
      throw new Error('Failed to create project');
    } catch (error) {
      console.error('Failed to add project:', error);
      throw error;
    }
  },

  /**
   * Test project connection
   * @param projectId - Project ID or 'temp' for testing before creation
   * @param connection - Connection details to test
   */
  async testConnection(projectId: string, connection?: ProjectConnection): Promise<boolean> {
    if (!connection) return false;

    try {
      // If projectId is 'temp', test connection directly without API
      if (projectId === 'temp') {
        const testUrl = connection.baseUrl;
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (connection.authType === 'api-key' && connection.apiKey) {
          headers['X-API-Key'] = connection.apiKey;
        } else if ((connection.authType === 'token' || connection.authType === 'oauth') && connection.token) {
          headers['Authorization'] = `Bearer ${connection.token}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(testUrl, {
            method: 'GET',
            headers,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return response.ok;
        } catch {
          clearTimeout(timeoutId);
          return false;
        }
      }

      // Use API endpoint for existing projects
      const response = await projectsApi.testConnection(projectId, connection);
      return response.success && response.data?.connectionTest?.success === true;
    } catch (error) {
      console.error('Failed to test connection:', error);
      return false;
    }
  },

  /**
   * Sync project data
   */
  async syncProject(projectId: string): Promise<void> {
    try {
      await projectsApi.syncProject(projectId);
    } catch (error) {
      console.error('Failed to sync project:', error);
      throw error;
    }
  },
};
