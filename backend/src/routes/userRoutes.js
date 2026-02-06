import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  uploadProfilePhoto,
  getUniqueRoles,
  getUniqueDepartments,
  downloadProfilePDF,
  toggleUserStatus,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { uploadProfilePhoto as uploadProfilePhotoMiddleware } from '../middleware/upload.js';
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
router.post('/profile/photo', authenticate, uploadProfilePhotoMiddleware(), uploadProfilePhoto);
router.get('/profile/download', authenticate, downloadProfilePDF);

// Admin/Manager routes
router.get('/roles', authenticate, authorize('admin', 'manager'), getUniqueRoles);
router.get('/departments', authenticate, authorize('admin', 'manager'), getUniqueDepartments);

// User management routes
router.get('/', authenticate, authorize('admin', 'manager'), validateUserQuery, handleValidationErrors, getUsers);
router.get('/:id/download', authenticate, downloadProfilePDF); // Profile download for specific user ID (admin/manager can download any profile)
router.get('/:id', authenticate, authorize('admin', 'manager'), validateUserId, handleValidationErrors, getUserById);
router.post('/', authenticate, authorize('admin', 'manager'), validateCreateUser, handleValidationErrors, createUser);
router.put('/:id', authenticate, validateUpdateUser, handleValidationErrors, updateUser);
router.patch('/:id/status', authenticate, authorize('admin', 'manager'), validateUserId, handleValidationErrors, toggleUserStatus);
router.delete('/:id', authenticate, authorize('admin'), validateUserId, handleValidationErrors, deleteUser);

export default router;

