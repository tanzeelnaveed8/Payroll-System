import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// MongoDB connection options (production-ready)
const connectionOptions = {
  serverSelectionTimeoutMS: 30000, // 30 seconds for production
  socketTimeoutMS: 45000, // 45 seconds
  connectTimeoutMS: 30000, // 30 seconds for production
  maxPoolSize: 50, // Increased for production
  minPoolSize: 5, // Increased for production
  retryWrites: true,
  w: 'majority',
  retryReads: true,
  maxIdleTimeMS: 30000,
};

const getConnectionString = () => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  // Validate connection string format
  if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    throw new Error('Invalid MongoDB connection string format. Must start with mongodb:// or mongodb+srv://');
  }

  return MONGODB_URI;
};

const testDatabaseConnection = async () => {
  console.log('🔍 Testing Database Connection...');
  console.log('================================');

  try {
    const connectionString = getConnectionString();

    // Mask password in logs for security
    const maskedUri = connectionString.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
    console.log(`\n📍 Connecting to: ${maskedUri}`);

    // Connect to MongoDB
    await mongoose.connect(connectionString, connectionOptions);
    const conn = mongoose.connection;

    // Verify connection is established
    if (conn.readyState !== 1) {
      throw new Error('Connection established but readyState is not connected');
    }

    console.log('\n🎉 MongoDB Connected Successfully!');
    console.log(`   Host: ${conn.host || 'N/A'}`);
    console.log(`   Database: ${conn.name || 'N/A'}`);
    console.log(`   Ready State: ${conn.readyState === 1 ? 'Connected' : 'Disconnected'}`);

    // Get database statistics
    const adminDb = conn.db.admin();
    const serverStatus = await adminDb.serverStatus();
    const dbStats = await conn.db.stats();

    console.log('\n📊 Database Statistics:');
    console.log(`   Collections: ${dbStats.collections}`);
    console.log(`   Objects: ${dbStats.objects}`);
    console.log(`   Data Size: ${Math.round(dbStats.dataSize / 1024 / 1024 * 100) / 100} MB`);
    console.log(`   Storage Size: ${Math.round(dbStats.storageSize / 1024 / 1024 * 100) / 100} MB`);

    // Test User collection operations
    console.log('\n👥 Testing User Collection...');

    // Check if users collection exists
    const collections = await conn.db.listCollections().toArray();
    const hasUsersCollection = collections.some(col => col.name === 'users');

    if (!hasUsersCollection) {
      console.log('   ❌ Users collection does not exist');
    } else {
      console.log('   ✅ Users collection exists');

      // Get distinct roles
      console.log('\n🔐 Checking Roles:');
      const distinctRoles = await User.distinct('role');

      if (distinctRoles.length === 0) {
        console.log('   ❌ No roles found in database');
      } else {
        console.log('   ✅ Roles found:');
        distinctRoles.forEach(role => {
          console.log(`     - ${role}`);
        });
      }

      // Count total users
      console.log('\n👥 User Counts:');
      const totalUsers = await User.countDocuments();
      console.log(`   Total users: ${totalUsers}`);

      // Get sample users for each role
      console.log('\n📋 Sample Users by Role:');
      for (const role of distinctRoles) {
        const sampleUsers = await User.find({ role: role }, 'name email employeeId', { limit: 3 });

        if (sampleUsers.length > 0) {
          console.log(`\n   Role: ${role}`);
          sampleUsers.forEach((user, index) => {
            console.log(`     ${index + 1}. ${user.name} (${user.email})`);
            if (user.employeeId) {
              console.log(`       Employee ID: ${user.employeeId}`);
            }
          });
        }
      }

      // Check for any users with null/empty roles
      const usersWithNoRole = await User.find({ role: { $in: [null, '', undefined] } }, 'name email', { limit: 3 });
      if (usersWithNoRole.length > 0) {
        console.log('\n⚠️  Users with no role:');
        usersWithNoRole.forEach((user, index) => {
          console.log(`     ${index + 1}. ${user.name} (${user.email})`);
        });
      }

      // Check for users with role 'department_lead' (should be normalized to 'dept_lead')
      const departmentLeadUsers = await User.find({ role: 'department_lead' }, 'name email', { limit: 3 });
      if (departmentLeadUsers.length > 0) {
        console.log('\n⚠️  Users with role "department_lead" (should be normalized):');
        departmentLeadUsers.forEach((user, index) => {
          console.log(`     ${index + 1}. ${user.name} (${user.email})`);
        });
      }
    }
  } catch (error) {
    console.log('\n❌ Database Connection Failed');
    console.error(`   Error: ${error.message}`);

    // Check if it's a connection error
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 Connection Issues:');
      console.log('   1. Check your internet connection');
      console.log('   2. Verify MongoDB Atlas cluster is running');
      console.log('   3. Check if the connection string is correct');
      console.log('   4. Verify DNS resolution is working');
      console.log('   5. Check firewall settings');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n🔧 Authentication Issues:');
      console.log('   1. Verify username and password in connection string');
      console.log('   2. Check if database user exists in MongoDB Atlas');
      console.log('   3. Verify IP whitelist includes your current IP');
      console.log('   4. Check if user has proper permissions');
    } else {
      console.log('\n🔧 General Troubleshooting:');
      console.log('   1. Check MongoDB Atlas cluster status');
      console.log('   2. Verify connection string format');
      console.log('   3. Check network connectivity');
      console.log('   4. Review MongoDB Atlas logs');
      console.log('   5. Verify MongoDB driver version compatibility');
    }

    process.exit(1);
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n⏹️  Database connection closed');
    }
  }
};

// Run the test
testDatabaseConnection().catch(console.error);