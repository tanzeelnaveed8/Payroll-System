import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  getUniqueRoles,
  getUniqueDepartments,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  validateCreateUser,
  validateUpdateUser,
  validateProfileUpdate,
  validateUserQuery,
  validateUserId,
  handleValidationErrors,
} from '../validators/userValidator.js';

const router = express.Router();

// Public routes (authenticated)
router.get('/profile', authenticate, getCurrentUserProfile);
router.put('/profile', authenticate, validateProfileUpdate, handleValidationErrors, updateCurrentUserProfile);

// Admin routes
router.get('/roles', authenticate, authorize('admin'), getUniqueRoles);
router.get('/departments', authenticate, authorize('admin'), getUniqueDepartments);

// User management routes
router.get('/', authenticate, authorize('admin'), validateUserQuery, handleValidationErrors, getUsers);
router.get('/:id', authenticate, authorize('admin'), validateUserId, handleValidationErrors, getUserById);
router.post('/', authenticate, authorize('admin'), validateCreateUser, handleValidationErrors, createUser);
router.put('/:id', authenticate, validateUpdateUser, handleValidationErrors, updateUser);
router.delete('/:id', authenticate, authorize('admin'), validateUserId, handleValidationErrors, deleteUser);

export default router;

