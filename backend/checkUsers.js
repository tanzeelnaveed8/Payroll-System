const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payroll-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () > {
  console.log('🔍 Connected to MongoDB');
  
  // Get existing users
  const User = require('./src/models/User.js');
  const users = await User.find({}, {email: 1, role: 1, employeeId: 1, name: 1});
  
  console.log('📋 Existing users:');
  console.log(users);
  
  mongoose.connection.close();
}).catch(err > {
  console.error('❌ Database connection error:', err);
});
