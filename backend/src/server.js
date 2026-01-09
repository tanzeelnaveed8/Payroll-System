import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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
import notificationRoutes from './routes/notificationRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
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

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Rate limiting (apply after body parsing)
// Note: Auth routes have their own rate limiter, so they're excluded from general API limiter
app.use('/api', apiLimiter); // General API rate limiting (excludes /api/auth routes)

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
    message: 'Payroll System API is running',
    timestamp: new Date().toISOString(),
    database: 'Connected',
    version: '1.0.0',
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Payroll System API',
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
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/files', fileRoutes);

// Serve uploaded files statically
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/api/files/uploads', express.static(uploadsPath));

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`🔒 Security: Rate limiting, XSS protection, MongoDB injection prevention enabled`);
      console.log(`⚡ Performance: Query optimization and caching enabled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

