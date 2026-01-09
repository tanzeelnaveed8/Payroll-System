import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { InvalidInputError } from '../utils/errorHandler.js';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allowed file types
const allowedMimeTypes = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ],
  all: []
};

// File size limits (in bytes)
const fileSizeLimits = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  default: 10 * 1024 * 1024 // 10MB
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const entityType = req.body.entityType || 'general';
    const entityDir = path.join(uploadsDir, entityType);
    
    if (!fs.existsSync(entityDir)) {
      fs.mkdirSync(entityDir, { recursive: true });
    }
    
    cb(null, entityDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = req.body.allowedTypes || 'all';
  let validMimeTypes = [];

  if (allowedTypes === 'images') {
    validMimeTypes = allowedMimeTypes.images;
  } else if (allowedTypes === 'documents') {
    validMimeTypes = allowedMimeTypes.documents;
  } else {
    validMimeTypes = [...allowedMimeTypes.images, ...allowedMimeTypes.documents];
  }

  if (validMimeTypes.length === 0 || validMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new InvalidInputError(`File type ${file.mimetype} is not allowed. Allowed types: ${validMimeTypes.join(', ')}`), false);
  }
};

// Get file size limit based on file type
const getFileSizeLimit = (mimetype) => {
  if (mimetype.startsWith('image/')) {
    return fileSizeLimits.image;
  }
  if (allowedMimeTypes.documents.includes(mimetype)) {
    return fileSizeLimits.document;
  }
  return fileSizeLimits.default;
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: fileSizeLimits.default,
    files: 10 // Max 10 files at once
  }
});

// Custom middleware for single file upload with validation
export const uploadSingle = (fieldName = 'file', options = {}) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new InvalidInputError(`File size exceeds the limit of ${fileSizeLimits.default / (1024 * 1024)}MB`));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new InvalidInputError('Too many files uploaded'));
        }
        return next(new InvalidInputError(err.message));
      }
      
      if (err) {
        return next(err);
      }

      // Additional validation
      if (req.file) {
        const fileSizeLimit = getFileSizeLimit(req.file.mimetype);
        if (req.file.size > fileSizeLimit) {
          // Delete the uploaded file
          fs.unlinkSync(req.file.path);
          return next(new InvalidInputError(`File size exceeds the limit of ${fileSizeLimit / (1024 * 1024)}MB`));
        }
      }

      next();
    });
  };
};

// Custom middleware for multiple file upload
export const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new InvalidInputError(`File size exceeds the limit of ${fileSizeLimits.default / (1024 * 1024)}MB`));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new InvalidInputError(`Too many files. Maximum ${maxCount} files allowed`));
        }
        return next(new InvalidInputError(err.message));
      }
      
      if (err) {
        return next(err);
      }

      // Additional validation for each file
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileSizeLimit = getFileSizeLimit(file.mimetype);
          if (file.size > fileSizeLimit) {
            // Delete all uploaded files
            req.files.forEach(f => {
              if (fs.existsSync(f.path)) {
                fs.unlinkSync(f.path);
              }
            });
            return next(new InvalidInputError(`File ${file.originalname} size exceeds the limit of ${fileSizeLimit / (1024 * 1024)}MB`));
          }
        }
      }

      next();
    });
  };
};

export { allowedMimeTypes, fileSizeLimits };

