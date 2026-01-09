// Temporary test file with hardcoded connection string
// This will be replaced with .env configuration

import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://Payroll_db_user:KoOS7y7q1DrrdBK8@payroll.r5tcrsk.mongodb.net/payroll_system?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

export default connectDB;

