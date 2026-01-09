import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  testConnection,
  syncProjectData,
  calculateInsights,
  aggregateInsights,
  generateChartData,
} from '../services/projectService.js';
import { sendSuccess, sendPaginated } from '../utils/responseHandler.js';
import { createPagination } from '../utils/responseHandler.js';
import { logUserAction } from '../utils/auditLogger.js';

/**
 * GET /api/projects - List projects
 */
export const listProjects = async (req, res, next) => {
  try {
    const { status, category, search, page = 1, limit = 10 } = req.query;

    const filters = { status, category, search };
    const pagination = createPagination(page, limit);

    const result = await getProjects(filters, pagination);

    return sendPaginated(res, 'Projects retrieved successfully', result.projects, result.pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id - Get project details
 */
export const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await getProjectById(id);

    return sendSuccess(res, 200, 'Project retrieved successfully', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects - Create project (admin)
 */
export const createProjectEndpoint = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const projectData = req.body;

    const project = await createProject(projectData, userId);

    logUserAction(req, 'create', 'Project', project._id, {
      action: 'create_project',
      projectName: project.name,
    });

    return sendSuccess(res, 201, 'Project created successfully', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/projects/:id - Update project (admin)
 */
export const updateProjectEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const project = await updateProject(id, updateData);

    logUserAction(req, 'update', 'Project', id, {
      action: 'update_project',
      projectName: project.name,
    });

    return sendSuccess(res, 200, 'Project updated successfully', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/projects/:id - Delete project (admin)
 */
export const deleteProjectEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;

    await deleteProject(id);

    logUserAction(req, 'delete', 'Project', id, {
      action: 'delete_project',
    });

    return sendSuccess(res, 200, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id/insights - Get project insights
 */
export const getProjectInsights = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeChartData } = req.query;

    const project = await getProjectById(id);

    // Calculate insights
    const insights = await calculateInsights(project);

    // Update project with insights
    const updatedProject = await updateProject(id, {
      trend: insights.trend,
      trendPercentage: insights.trendPercentage,
      health: insights.health,
    });

    const response = {
      project: updatedProject,
      insights: {
        kpi: project.kpi || {},
        trend: insights.trend,
        trendPercentage: insights.trendPercentage,
        health: insights.health,
      },
    };

    // Include chart data if requested
    if (includeChartData === 'true') {
      const chartData = await generateChartData(project);
      response.chartData = chartData;
    }

    return sendSuccess(res, 200, 'Project insights retrieved successfully', response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/insights/aggregated - Get aggregated insights
 */
export const getAggregatedInsights = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filters = status ? { status } : {};
    const result = await getProjects(filters, { page: 1, limit: 1000 });

    const aggregated = await aggregateInsights(result.projects);

    return sendSuccess(res, 200, 'Aggregated insights retrieved successfully', {
      insights: aggregated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects/:id/connect - Test connection (admin)
 */
export const testProjectConnection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { connection } = req.body;

    const project = await getProjectById(id);

    // Use provided connection or project's connection
    const connectionToTest = connection || project.connection;

    if (!connectionToTest) {
      return next(new Error('Connection configuration not found'));
    }

    const result = await testConnection(connectionToTest);

    logUserAction(req, 'update', 'Project', id, {
      action: 'test_connection',
      success: result.success,
    });

    return sendSuccess(res, 200, result.message, {
      connectionTest: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects/:id/sync - Sync project data (admin)
 */
export const syncProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await getProjectById(id);

    if (project.status !== 'connected') {
      return next(new Error('Project must be connected to sync data'));
    }

    // Get project document (not lean) for syncing
    const Project = (await import('../models/Project.js')).default;
    const projectDoc = await Project.findById(id);

    const syncedData = await syncProjectData(projectDoc);

    // Recalculate insights after sync
    const insights = await calculateInsights(project);
    await updateProject(id, {
      trend: insights.trend,
      trendPercentage: insights.trendPercentage,
      health: insights.health,
    });

    const updatedProject = await getProjectById(id);

    logUserAction(req, 'update', 'Project', id, {
      action: 'sync_project',
      syncedAt: new Date(),
    });

    return sendSuccess(res, 200, 'Project data synced successfully', {
      project: updatedProject,
      syncedData,
    });
  } catch (error) {
    next(error);
  }
};

