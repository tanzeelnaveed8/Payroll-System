import {
  uploadToStorage,
  deleteFromStorage,
  getFileUrl,
  getFileMetadata,
  getFilesByEntity,
  generatePDF
} from '../services/fileService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { logUserAction } from '../utils/auditLogger.js';
import fs from 'fs';
import path from 'path';
import { ResourceNotFoundError } from '../utils/errorHandler.js';

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new Error('No file uploaded'));
    }

    const {
      entityType,
      entityId,
      description,
      tags,
      category,
      isPublic,
      accessRoles,
      accessUsers
    } = req.body;

    const metadata = {
      entityType,
      entityId,
      uploadedBy: req.user._id,
      description,
      tags: tags ? (Array.isArray(JSON.parse(tags)) ? JSON.parse(tags) : [JSON.parse(tags)]) : [],
      category,
      isPublic: isPublic === 'true' || isPublic === true,
      accessRoles: accessRoles ? (Array.isArray(JSON.parse(accessRoles)) ? JSON.parse(accessRoles) : [JSON.parse(accessRoles)]) : [],
      accessUsers: accessUsers ? (Array.isArray(JSON.parse(accessUsers)) ? JSON.parse(accessUsers) : [JSON.parse(accessUsers)]) : []
    };

    const fileAttachment = await uploadToStorage(req.file, metadata);

    logUserAction(req, 'create', 'FileAttachment', fileAttachment._id, {
      action: 'upload_file',
      fileName: fileAttachment.originalFileName,
      entityType: fileAttachment.entityType
    });

    return sendSuccess(res, 201, 'File uploaded successfully', { file: fileAttachment });
  } catch (error) {
    next(error);
  }
};

export const getFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const fileMetadata = await getFileMetadata(id, userId, userRole);

    return sendSuccess(res, 200, 'File metadata retrieved successfully', { file: fileMetadata });
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const fileInfo = await getFileUrl(id, userId, userRole);
    const fileAttachment = await getFileMetadata(id, userId, userRole);

    if (!fileAttachment.filePath || !fs.existsSync(fileAttachment.filePath)) {
      throw new ResourceNotFoundError('File not found on server');
    }

    logUserAction(req, 'read', 'FileAttachment', id, {
      action: 'download_file',
      fileName: fileAttachment.originalFileName
    });

    res.setHeader('Content-Disposition', `attachment; filename="${fileAttachment.originalFileName}"`);
    res.setHeader('Content-Type', fileAttachment.fileType);

    const fileStream = fs.createReadStream(fileAttachment.filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const result = await deleteFromStorage(id, userId, userRole);

    logUserAction(req, 'delete', 'FileAttachment', id, {
      action: 'delete_file'
    });

    return sendSuccess(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

export const getFilesByEntityEndpoint = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!entityType || !entityId) {
      return next(new Error('Entity type and entity ID are required'));
    }

    const files = await getFilesByEntity(entityType, entityId, userId, userRole);

    return sendSuccess(res, 200, 'Files retrieved successfully', { files });
  } catch (error) {
    next(error);
  }
};

export const generatePDFEndpoint = async (req, res, next) => {
  try {
    const { data, filename, content } = req.body;

    const pdfResult = await generatePDF(data, { filename, content });

    return sendSuccess(res, 200, 'PDF generated successfully', pdfResult);
  } catch (error) {
    next(error);
  }
};

