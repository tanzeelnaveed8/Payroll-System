// Direct connection test with hardcoded credentials
import mongoose from 'mongoose';
import User from '../models/User.js';
import Department from '../models/Department.js';

const MONGODB_URI = 'mongodb+srv://Payroll_db_user:KoOS7y7q1DrrdBK8@payroll.r5tcrsk.mongodb.net/payroll_system?retryWrites=true&w=majority';

const testConnection = async () => {
  try {
    console.log('🔄 Testing MongoDB connection...\n');
    console.log('Connection String:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

    // Connect to MongoDB
    const conn = await mongoose.connect(MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}\n`);

    // Test User model
    console.log('📊 Testing User model...');
    const userCount = await User.countDocuments();
    console.log(`✅ User model connected. Current users: ${userCount}`);

    // Test Department model
    console.log('📊 Testing Department model...');
    const deptCount = await Department.countDocuments();
    console.log(`✅ Department model connected. Current departments: ${deptCount}\n`);

    // Create indexes
    console.log('📊 Creating indexes...');
    await User.createIndexes();
    await Department.createIndexes();
    console.log('✅ Indexes created successfully\n');

    // Verify indexes
    const userIndexes = await User.collection.getIndexes();
    console.log('Users Collection Indexes:');
    Object.keys(userIndexes).forEach(key => {
      console.log(`  - ${key}:`, JSON.stringify(userIndexes[key]));
    });

    const departmentIndexes = await Department.collection.getIndexes();
    console.log('\nDepartments Collection Indexes:');
    Object.keys(departmentIndexes).forEach(key => {
      console.log(`  - ${key}:`, JSON.stringify(departmentIndexes[key]));
    });

    console.log('\n✅ All tests passed! Database is ready.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('authentication')) {
      console.error('💡 Check your MongoDB credentials and connection string');
    }
    console.error(error);
    process.exit(1);
  }
};

testConnection();

