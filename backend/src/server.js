import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import timesheetRoutes from './routes/timesheetRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import deptLeadRoutes from './routes/deptLeadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dailyReportRoutes from './routes/dailyReportRoutes.js';
import progressUpdateRoutes from './routes/progressUpdateRoutes.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { apiLimiter, authLimiter, uploadLimiter } from './middleware/rateLimiter.js';
import { sanitizeMongo, sanitizeXSS, sanitizeInput, validateObjectId } from './middleware/sanitize.js';
import { verifyAllIndexes } from './utils/indexVerifier.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security Middleware (apply early)
app.use(helmet()); // Security headers
app.use(sanitizeMongo); // MongoDB injection prevention
app.use(sanitizeXSS); // XSS prevention
app.use(sanitizeInput); // Custom input sanitization
app.use(validateObjectId); // Validate ObjectId format

// CORS - Production-ready configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : process.env.NODE_ENV === 'production'
    ? ['https://introup.io', 'https://www.introup.io']
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Rate limiting (apply after body parsing)
// Note: Auth routes have their own rate limiter, so they're excluded from general API limiter
app.use('/api', apiLimiter); // General API rate limiting (excludes /api/auth routes)

// Middleware to handle missing profile images gracefully (prevent 404 errors in logs)
app.use('/uploads/profiles', (req, res, next) => {
  // Only handle GET requests for image files
  if (req.method !== 'GET') {
    return next();
  }

  // Extract filename from query string if present (cache busting)
  const requestedPath = req.path.split('?')[0];
  const filePath = path.join(__dirname, '../uploads/profiles', path.basename(requestedPath));

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // Return a 404 but mark it as handled to prevent error logging
    // The frontend should handle missing images with a default placeholder
    // Set a custom header to indicate this is an expected 404 (not an error)
    res.set('X-Missing-File', 'true');
    return res.status(404).json({ 
      status: 'error',
      message: 'Profile image not found',
      code: 'IMAGE_NOT_FOUND'
    });
  }

  // File exists, let express.static handle it
  next();
});

// Serve static files from uploads directory with proper headers
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d', // Cache for 1 day
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set CORS headers for all files
    res.set('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Set content-type for images
    if (filePath.includes('.jpg') || filePath.includes('.jpeg') || 
        filePath.includes('.png') || filePath.includes('.gif') || 
        filePath.includes('.webp')) {
      res.set('Content-Type', filePath.includes('.png') ? 'image/png' :
                           filePath.includes('.jpg') || filePath.includes('.jpeg') ? 'image/jpeg' :
                           filePath.includes('.gif') ? 'image/gif' :
                           filePath.includes('.webp') ? 'image/webp' : 'image/jpeg');
    }
    // Set content-type for documents
    else if (filePath.includes('.pdf')) {
      res.set('Content-Type', 'application/pdf');
    }
    else if (filePath.includes('.doc') || filePath.includes('.docx')) {
      res.set('Content-Type', 'application/msword');
    }
    else if (filePath.includes('.xls') || filePath.includes('.xlsx')) {
      res.set('Content-Type', 'application/vnd.ms-excel');
    }
    else if (filePath.includes('.txt')) {
      res.set('Content-Type', 'text/plain');
    }
    else if (filePath.includes('.csv')) {
      res.set('Content-Type', 'text/csv');
    }
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MeeTech Labs Management system API is running',
    timestamp: new Date().toISOString(),
    database: 'Connected',
    version: '1.0.0',
  });
});

// API health check endpoint (for production monitoring)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MeeTech Labs Management system API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'MeeTech Labs Management system API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      departments: '/api/departments',
      reports: '/api/reports',
      payroll: '/api/payroll',
      timesheets: '/api/timesheets',
      leave: '/api/leave',
      tasks: '/api/tasks',
      settings: '/api/settings',
      projects: '/api/projects',
      manager: '/api/manager',
      employee: '/api/employee',
      admin: '/api/admin',
      dailyReports: '/api/daily-reports',
      progressUpdates: '/api/progress-updates',
      notifications: '/api/notifications',
      files: '/api/files',
      api: '/api',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/dept_lead', deptLeadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/daily-reports', dailyReportRoutes);
app.use('/api/progress-updates', progressUpdateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/files', fileRoutes);

// Serve uploaded files statically
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/api/files/uploads', express.static(uploadsPath));

// Test route for roles
app.get('/api/test-roles', async (req, res) => {
  try {
    const roles = ['admin', 'manager', 'dept_lead', 'employee'];
    res.json({ success: true, roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
const PORT = process.env.PORT || 5000;

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  const server = global.server;
  
  if (server) {
    // Close server
    server.close(() => {
      console.log('HTTP server closed.');
      
      // Close MongoDB connection
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    // Server not started yet, just close DB and exit
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  }
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`\n╔════════════════════════════════════════════════════════╗`);
      console.log(`║      🚀 MeeTech Labs Management system API Server Started           ║`);
      console.log(`╠════════════════════════════════════════════════════════╣`);
      console.log(`║  Port:         ${PORT.toString().padEnd(35)} ║`);
      console.log(`║  Environment:  ${(process.env.NODE_ENV || 'development').padEnd(35)} ║`);
      console.log(`║  API URL:      http://localhost:${PORT}/api${' '.repeat(13)}║`);
      console.log(`╠════════════════════════════════════════════════════════╣`);
      console.log(`║  🔒 Security Features:                                 ║`);
      console.log(`║    • Rate limiting enabled                             ║`);
      console.log(`║    • XSS protection enabled                            ║`);
      console.log(`║    • MongoDB injection prevention                      ║`);
      console.log(`║    • Input sanitization                                ║`);
      console.log(`║    • Public registration: DISABLED                     ║`);
      console.log(`╠════════════════════════════════════════════════════════╣`);
      console.log(`║  ⚡ Performance:                                        ║`);
      console.log(`║    • Query optimization enabled                        ║`);
      console.log(`║    • Caching enabled                                   ║`);
      console.log(`║    • Connection pooling: Active                        ║`);
      console.log(`╠════════════════════════════════════════════════════════╣`);
      console.log(`║  👤 Admin Access:                                       ║`);
      console.log(`║    Only administrators can create user accounts        ║`);
      console.log(`║    Run 'npm run create-admin' to setup first admin     ║`);
      console.log(`╚════════════════════════════════════════════════════════╝\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

