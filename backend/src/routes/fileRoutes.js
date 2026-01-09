import express from 'express';
import {
  uploadFile,
  getFile,
  downloadFile,
  deleteFile,
  getFilesByEntityEndpoint,
  generatePDFEndpoint
} from '../controllers/fileController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { uploadSingle } from '../middleware/upload.js';
import {
  validateFileId,
  validateUploadFile,
  validateGetFilesByEntity,
  handleValidationErrors
} from '../validators/fileValidator.js';

const router = express.Router();

router.use(authenticate);

router.post('/upload', uploadLimiter, validateUploadFile, handleValidationErrors, uploadSingle('file'), uploadFile);
router.get('/by-entity', validateGetFilesByEntity, handleValidationErrors, getFilesByEntityEndpoint);
router.get('/:id', validateFileId, handleValidationErrors, getFile);
router.get('/:id/download', validateFileId, handleValidationErrors, downloadFile);
router.delete('/:id', validateFileId, handleValidationErrors, deleteFile);
router.post('/generate-pdf', generatePDFEndpoint);

export default router;

