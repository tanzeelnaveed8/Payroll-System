import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatusEndpoint,
  deleteTask,
  getEmployeeTasks,
  getEmployeeCurrentTasks,
  getEmployeeUpcomingTasks,
} from '../controllers/taskController.js';
import {
  validateCreateTask,
  validateUpdateTask,
  validateUpdateTaskStatus,
  validateGetTasks,
  validateEmployeeId,
  handleValidationErrors,
} from '../validators/taskValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', validateGetTasks, handleValidationErrors, getTasks);

router.get('/employee/:employeeId', validateEmployeeId, handleValidationErrors, getEmployeeTasks);
router.get('/employee/:employeeId/current', validateEmployeeId, handleValidationErrors, getEmployeeCurrentTasks);
router.get('/employee/:employeeId/upcoming', validateEmployeeId, handleValidationErrors, getEmployeeUpcomingTasks);

router.post('/', authorize('manager', 'admin'), validateCreateTask, handleValidationErrors, createTask);

router.get('/:id', getTaskById);
router.put('/:id', validateUpdateTask, handleValidationErrors, updateTask);
router.put('/:id/status', validateUpdateTaskStatus, handleValidationErrors, updateTaskStatusEndpoint);
router.delete('/:id', authorize('admin'), deleteTask);

export default router;

