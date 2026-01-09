import Project from '../models/Project.js';
import { ResourceNotFoundError, InvalidInputError } from '../utils/errorHandler.js';

/**
 * Test API connection for a project
 * @param {Object} connection - Connection configuration
 * @returns {Promise<Object>} Connection test result
 */
export const testConnection = async (connection) => {
  const { baseUrl, authType, apiKey, token } = connection;

  if (!baseUrl) {
    throw new InvalidInputError('Base URL is required');
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Set authentication header based on auth type
    if (authType === 'api-key' && apiKey) {
      headers['X-API-Key'] = apiKey;
    } else if (authType === 'token' && token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (authType === 'oauth' && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Test connection with a simple GET request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(baseUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      message: response.ok ? 'Connection successful' : `Connection failed: ${response.statusText}`,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        status: 0,
        statusText: 'Timeout',
        message: 'Connection timeout. Please check the base URL and try again.',
      };
    }

    return {
      success: false,
      status: 0,
      statusText: 'Error',
      message: error.message || 'Failed to connect. Please check your connection settings.',
    };
  }
};

/**
 * Sync project data from external API
 * @param {string|Object} projectIdOrProject - Project ID or Project document
 * @returns {Promise<Object>} Synced KPI data
 */
export const syncProjectData = async (projectIdOrProject) => {
  // Get project document (not lean) so we can save it
  const project = typeof projectIdOrProject === 'string'
    ? await Project.findById(projectIdOrProject)
    : projectIdOrProject;

  if (!project) {
    throw new ResourceNotFoundError('Project');
  }

  const { connection } = project;

  if (!connection || !connection.baseUrl) {
    throw new InvalidInputError('Project connection is not configured');
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Set authentication header
    if (connection.authType === 'api-key' && connection.apiKey) {
      headers['X-API-Key'] = connection.apiKey;
    } else if (connection.authType === 'token' && connection.token) {
      headers['Authorization'] = `Bearer ${connection.token}`;
    } else if (connection.authType === 'oauth' && connection.token) {
      headers['Authorization'] = `Bearer ${connection.token}`;
    }

    // Fetch KPI data from external API
    // Supports multiple API response formats and error handling
    const endpoints = {
      users: '/api/users/count',
      revenue: '/api/revenue',
      activity: '/api/activity',
      growth: '/api/growth',
    };

    const kpiData = {
      users: 0,
      revenue: 0,
      activity: 0,
      growth: 0,
    };

    // Try to fetch from each endpoint with improved error handling
    const fetchPromises = Object.entries(endpoints).map(async ([key, endpoint]) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const url = endpoint.startsWith('http') 
          ? endpoint 
          : `${connection.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            ...headers,
            'Accept': 'application/json',
            'User-Agent': 'Payroll-System/1.0'
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          // Try to parse as text and extract JSON if possible
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            return { key, data };
          } catch {
            // Try to extract numeric value from text
            const numericMatch = text.match(/\d+(\.\d+)?/);
            if (numericMatch) {
              return { key, data: { value: parseFloat(numericMatch[0]) } };
            }
            throw new Error('Response is not valid JSON');
          }
        }

        const data = await response.json();
        return { key, data };
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(`[Project Sync] Timeout fetching ${key} from ${endpoint}`);
        } else {
          console.warn(`[Project Sync] Failed to fetch ${key} from ${endpoint}:`, error.message);
        }
        return { key, data: null };
      }
    });

    // Wait for all requests to complete
    const results = await Promise.all(fetchPromises);

    // Process results with multiple response format support
    results.forEach(({ key, data }) => {
      if (!data) {
        // Keep default value of 0
        return;
      }

      // Support multiple response formats:
      // 1. Direct value: { value: 123 }
      // 2. Key-based: { users: 123, revenue: 456 }
      // 3. Nested: { data: { users: 123 } }
      // 4. Count-based: { count: 123 }
      // 5. Result-based: { result: 123 }
      // 6. Array with count: [{}, {}] -> length
      // 7. Direct number: 123

      let extractedValue = null;

      if (typeof data === 'number') {
        extractedValue = data;
      } else if (Array.isArray(data)) {
        extractedValue = data.length;
      } else if (typeof data === 'object' && data !== null) {
        // Try multiple possible keys
        extractedValue = 
          data.value !== undefined ? data.value :
          data[key] !== undefined ? data[key] :
          data.count !== undefined ? data.count :
          data.result !== undefined ? data.result :
          data.data && data.data[key] !== undefined ? data.data[key] :
          data.data && typeof data.data === 'number' ? data.data :
          data.response && data.response[key] !== undefined ? data.response[key] :
          data.response && typeof data.response === 'number' ? data.response :
          null;
      }

      if (extractedValue !== null && !isNaN(extractedValue)) {
        kpiData[key] = typeof extractedValue === 'number' 
          ? Math.round(extractedValue * 100) / 100 // Round to 2 decimal places
          : parseFloat(extractedValue) || 0;
      }
    });

    // Update project with synced data
    project.kpi = {
      ...project.kpi, // Preserve existing KPI data
      ...kpiData, // Update with new synced data
      lastSynced: new Date() // Track last sync timestamp
    };
    
    if (!project.connection) {
      project.connection = {};
    }
    project.connection.lastSyncAt = new Date();
    project.connection.lastSyncStatus = 'success';
    project.connection.lastSyncError = null;
    
    await project.save();

    return {
      ...kpiData,
      syncedAt: new Date(),
      success: true
    };
  } catch (error) {
    // Update project with error status if project exists
    if (project && project.connection) {
      project.connection.lastSyncStatus = 'error';
      project.connection.lastSyncError = error.message;
      project.connection.lastSyncAt = new Date();
      try {
        await project.save();
      } catch (saveError) {
        console.error('[Project Sync] Failed to save error status:', saveError);
      }
    }
    
    throw new InvalidInputError(`Failed to sync project data: ${error.message}`);
  }
};

/**
 * Calculate project insights (trends, health metrics)
 * @param {Object} project - Project document (can be lean)
 * @param {Array} historicalData - Historical KPI data (optional)
 * @returns {Promise<Object>} Calculated insights
 */
export const calculateInsights = async (project, historicalData = []) => {
  const { kpi } = project;

  if (!kpi) {
    return {
      trend: 'neutral',
      trendPercentage: 0,
      health: {
        uptime: 0,
        engagement: 0,
        risk: 'medium',
      },
    };
  }

  // Calculate trend based on growth
  let trend = 'neutral';
  let trendPercentage = 0;

  if (historicalData.length > 0) {
    // Compare with previous period
    const previous = historicalData[historicalData.length - 1];
    const current = kpi;

    const growthChange = current.growth - (previous.growth || 0);
    const revenueChange = current.revenue - (previous.revenue || 0);

    if (growthChange > 0 || revenueChange > 0) {
      trend = 'up';
      trendPercentage = Math.abs(growthChange);
    } else if (growthChange < 0 || revenueChange < 0) {
      trend = 'down';
      trendPercentage = Math.abs(growthChange);
    }
  } else {
    // Use current growth value
    if (kpi.growth > 0) {
      trend = 'up';
      trendPercentage = Math.abs(kpi.growth);
    } else if (kpi.growth < 0) {
      trend = 'down';
      trendPercentage = Math.abs(kpi.growth);
    }
  }

  // Calculate health metrics
  const uptime = project.connection?.lastSyncAt
    ? Math.min(100, Math.max(0, 100 - (Date.now() - project.connection.lastSyncAt) / (1000 * 60 * 60 * 24))) // Days since last sync
    : 0;

  const engagement = kpi.users > 0 && kpi.activity > 0
    ? Math.min(100, (kpi.activity / kpi.users) * 100)
    : 0;

  // Calculate risk level
  let risk = 'low';
  if (uptime < 50 || engagement < 30 || kpi.growth < -10) {
    risk = 'high';
  } else if (uptime < 75 || engagement < 50 || kpi.growth < 0) {
    risk = 'medium';
  }

  return {
    trend,
    trendPercentage: Math.round(trendPercentage * 10) / 10,
    health: {
      uptime: Math.round(uptime * 10) / 10,
      engagement: Math.round(engagement * 10) / 10,
      risk,
    },
  };
};

/**
 * Aggregate insights across all projects
 * @param {Array} projects - Array of project documents
 * @returns {Object} Aggregated insights
 */
export const aggregateInsights = async (projects) => {
  if (!projects || projects.length === 0) {
    return {
      totalProjects: 0,
      connectedProjects: 0,
      totalUsers: 0,
      totalRevenue: 0,
      averageGrowth: 0,
      averageUptime: 0,
      averageEngagement: 0,
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0,
      },
    };
  }

  const connectedProjects = projects.filter((p) => p.status === 'connected');
  const totalUsers = projects.reduce((sum, p) => sum + (p.kpi?.users || 0), 0);
  const totalRevenue = projects.reduce((sum, p) => sum + (p.kpi?.revenue || 0), 0);

  const growthValues = projects
    .map((p) => p.kpi?.growth || 0)
    .filter((g) => g !== 0);
  const averageGrowth = growthValues.length > 0
    ? growthValues.reduce((sum, g) => sum + g, 0) / growthValues.length
    : 0;

  const uptimeValues = projects
    .map((p) => p.health?.uptime || 0)
    .filter((u) => u > 0);
  const averageUptime = uptimeValues.length > 0
    ? uptimeValues.reduce((sum, u) => sum + u, 0) / uptimeValues.length
    : 0;

  const engagementValues = projects
    .map((p) => p.health?.engagement || 0)
    .filter((e) => e > 0);
  const averageEngagement = engagementValues.length > 0
    ? engagementValues.reduce((sum, e) => sum + e, 0) / engagementValues.length
    : 0;

  const riskDistribution = {
    low: projects.filter((p) => p.health?.risk === 'low').length,
    medium: projects.filter((p) => p.health?.risk === 'medium').length,
    high: projects.filter((p) => p.health?.risk === 'high').length,
  };

  return {
    totalProjects: projects.length,
    connectedProjects: connectedProjects.length,
    totalUsers,
    totalRevenue,
    averageGrowth: Math.round(averageGrowth * 10) / 10,
    averageUptime: Math.round(averageUptime * 10) / 10,
    averageEngagement: Math.round(averageEngagement * 10) / 10,
    riskDistribution,
  };
};

/**
 * Generate chart data for project insights (6-month trends)
 * @param {Object} project - Project document
 * @param {Array} historicalData - Historical KPI data
 * @returns {Object} Chart data
 */
export const generateChartData = async (project, historicalData = []) => {
  const months = [];
  const usersData = [];
  const revenueData = [];
  const activityData = [];
  const growthData = [];

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

    // Use historical data if available, otherwise use current data
    const dataPoint = historicalData[historicalData.length - 1 - i] || project.kpi || {};
    usersData.push(dataPoint.users || 0);
    revenueData.push(dataPoint.revenue || 0);
    activityData.push(dataPoint.activity || 0);
    growthData.push(dataPoint.growth || 0);
  }

  return {
    labels: months,
    datasets: [
      {
        label: 'Users',
        data: usersData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
      {
        label: 'Revenue',
        data: revenueData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
      },
      {
        label: 'Activity',
        data: activityData,
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
      },
      {
        label: 'Growth (%)',
        data: growthData,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
      },
    ],
  };
};

/**
 * Get project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Project document
 */
export const getProjectById = async (projectId) => {
  const project = await Project.findById(projectId)
    .populate('ownerId', 'name email')
    .populate('createdBy', 'name email')
    .lean();

  if (!project) {
    throw new ResourceNotFoundError('Project');
  }

  return project;
};

/**
 * Get all projects with filters
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Projects and pagination info
 */
export const getProjects = async (filters = {}, pagination = {}) => {
  const { status, category, search } = filters;
  const { page = 1, limit = 10 } = pagination;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { owner: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate('ownerId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(query),
  ]);

  return {
    projects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @param {string} userId - User ID creating the project
 * @returns {Promise<Object>} Created project
 */
export const createProject = async (projectData, userId) => {
  const project = new Project({
    ...projectData,
    createdBy: userId,
  });

  // Calculate initial insights if KPI data is provided
  if (projectData.kpi) {
    const insights = await calculateInsights(project);
    project.trend = insights.trend;
    project.trendPercentage = insights.trendPercentage;
    project.health = insights.health;
  }

  await project.save();
  return project.toObject();
};

/**
 * Update a project
 * @param {string} projectId - Project ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated project
 */
export const updateProject = async (projectId, updateData) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ResourceNotFoundError('Project');
  }

  // Update fields
  Object.keys(updateData).forEach((key) => {
    if (key !== '_id' && key !== 'createdAt' && key !== 'createdBy') {
      project[key] = updateData[key];
    }
  });

  // Recalculate insights if KPI data changed
  if (updateData.kpi) {
    const insights = await calculateInsights(project);
    project.trend = insights.trend;
    project.trendPercentage = insights.trendPercentage;
    project.health = insights.health;
  }

  await project.save();
  return project.toObject();
};

/**
 * Delete a project
 * @param {string} projectId - Project ID
 * @returns {Promise<void>}
 */
export const deleteProject = async (projectId) => {
  const project = await Project.findByIdAndDelete(projectId);

  if (!project) {
    throw new ResourceNotFoundError('Project');
  }
};

