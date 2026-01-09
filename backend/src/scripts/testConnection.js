import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔄 Testing MongoDB connection...\n');

    // Connect to MongoDB
    await connectDB();

    // Test User model
    console.log('📊 Testing User model...');
    const userCount = await User.countDocuments();
    console.log(`✅ User model connected. Current users: ${userCount}`);

    // Test Department model
    console.log('📊 Testing Department model...');
    const deptCount = await Department.countDocuments();
    console.log(`✅ Department model connected. Current departments: ${deptCount}`);

    // Test creating a test user (optional - can be removed)
    console.log('\n🧪 Testing User creation...');
    const testUser = new User({
      email: 'test@example.com',
      password: 'test123456',
      name: 'Test User',
      role: 'employee',
      employeeId: 'EMP001'
    });
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('ℹ️  Test user already exists, skipping creation');
    } else {
      await testUser.save();
      console.log('✅ Test user created successfully');
      // Clean up test user
      await User.deleteOne({ email: 'test@example.com' });
      console.log('🧹 Test user cleaned up');
    }

    console.log('\n✅ All tests passed! Database is ready.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

testConnection();

