import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const DATABASE_NAME = process.env.DATABASE_NAME || 'payroll_system';

// Connection options for better reliability
const connectionOptions = {
  serverSelectionTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000, // 45 seconds
  connectTimeoutMS: 10000, // 10 seconds
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  w: 'majority',
  // Use direct connection if SRV fails
  directConnection: false,
  // Retry configuration
  retryReads: true,
};

const getConnectionString = () => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }
  
  // Validate connection string format
  if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    throw new Error('Invalid MongoDB connection string format. Must start with mongodb:// or mongodb+srv://');
  }
  
  // Check if database name is already in URI
  const hasDatabase = MONGODB_URI.match(/\/[^/?]+(\?|$)/);
  
  if (!hasDatabase && MONGODB_URI.includes('/')) {
    const separator = MONGODB_URI.endsWith('/') ? '' : '/';
    const hasQuery = MONGODB_URI.includes('?');
    const query = hasQuery ? '&' : '?';
    return `${MONGODB_URI}${separator}${DATABASE_NAME}${query}retryWrites=true&w=majority`;
  }
  
  return MONGODB_URI;
};

const getErrorMessage = (error) => {
  const errorMessage = error.message || String(error);
  
  if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('querySrv')) {
    return {
      type: 'DNS_NETWORK_ERROR',
      message: 'Cannot resolve MongoDB hostname or connection refused',
      troubleshooting: [
        'Check your internet connection',
        'Verify MongoDB Atlas cluster is running (not paused)',
        'Check if the connection string is correct',
        'Verify DNS resolution is working',
        'Check firewall settings',
        'Try using direct connection string instead of SRV',
      ],
    };
  }
  
  if (errorMessage.includes('authentication failed') || errorMessage.includes('bad auth')) {
    return {
      type: 'AUTH_ERROR',
      message: 'MongoDB authentication failed',
      troubleshooting: [
        'Verify username and password in connection string',
        'Check if database user exists in MongoDB Atlas',
        'Verify IP whitelist includes your current IP',
        'Check if user has proper permissions',
      ],
    };
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
    return {
      type: 'TIMEOUT_ERROR',
      message: 'Connection timeout',
      troubleshooting: [
        'Check your internet connection',
        'Verify MongoDB Atlas cluster is accessible',
        'Check firewall/network settings',
        'Try increasing connection timeout',
      ],
    };
  }
  
  return {
    type: 'UNKNOWN_ERROR',
    message: errorMessage,
    troubleshooting: [
      'Check MongoDB Atlas cluster status',
      'Verify connection string format',
      'Check network connectivity',
      'Review MongoDB Atlas logs',
    ],
  };
};

const connectDB = async (retries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connectionString = getConnectionString();
      
      // Mask password in logs for security
      const maskedUri = connectionString.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
      
      console.log(`\n🔄 Attempting MongoDB connection (${attempt}/${retries})...`);
      console.log(`📍 Connection string: ${maskedUri}`);
      
      // Set connection options
      mongoose.set('strictQuery', false);
      
      const conn = await mongoose.connect(connectionString, connectionOptions);

      console.log(`\n✅ MongoDB Connected Successfully!`);
      console.log(`   Host: ${conn.connection.host}`);
      console.log(`   Database: ${conn.connection.name}`);
      console.log(`   Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}\n`);
      
      // Verify indexes on connection
      try {
        const { verifyAllIndexes } = await import('../utils/indexVerifier.js');
        await verifyAllIndexes();
      } catch (indexError) {
        console.warn('⚠️  Index verification failed:', indexError.message);
      }
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
        const errorInfo = getErrorMessage(err);
        console.error(`   Error Type: ${errorInfo.type}`);
        console.error(`   Troubleshooting: ${errorInfo.troubleshooting.join(', ')}`);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully');
      });

      // Graceful shutdown
      const shutdown = async (signal) => {
        console.log(`\n${signal} received. Closing MongoDB connection...`);
        await mongoose.connection.close();
        console.log('MongoDB connection closed gracefully');
        process.exit(0);
      };

      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGTERM', () => shutdown('SIGTERM'));

      return conn;
    } catch (error) {
      const errorInfo = getErrorMessage(error);
      
      console.error(`\n❌ MongoDB Connection Failed (Attempt ${attempt}/${retries})`);
      console.error(`   Error Type: ${errorInfo.type}`);
      console.error(`   Message: ${errorInfo.message}`);
      console.error(`   Full Error: ${error.message || String(error)}`);
      
      if (attempt < retries) {
        const waitTime = delay * attempt; // Exponential backoff
        console.error(`\n⏳ Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error(`\n💡 Troubleshooting Steps:`);
        errorInfo.troubleshooting.forEach((step, index) => {
          console.error(`   ${index + 1}. ${step}`);
        });
        console.error(`\n📝 Common Solutions:`);
        console.error(`   1. Check your .env file has MONGODB_URI set correctly`);
        console.error(`   2. Verify MongoDB Atlas cluster is running (not paused)`);
        console.error(`   3. Check Network Access in MongoDB Atlas (IP whitelist)`);
        console.error(`   4. Verify Database User credentials are correct`);
        console.error(`   5. Try using mongodb:// instead of mongodb+srv:// if SRV fails`);
        console.error(`\n❌ Failed to connect after ${retries} attempts. Exiting...\n`);
        process.exit(1);
      }
    }
  }
};

export default connectDB;
