import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payroll-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () > {
  console.log('🔍 Connected to MongoDB');
  
  // Get existing users
  const users = await User.find({}, {email: 1, role: 1, employeeId: 1, name: 1});
  
  console.log('📋 Existing users:');
  console.log(users);
  
  mongoose.connection.close();
}).catch(err > {
  console.error('❌ Database connection error:', err);
});
