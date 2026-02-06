import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const checkUsers = async () => {
  try {
    console.log('\n🔍 Checking current users in database...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payroll', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const users = await User.find({}).populate('departmentId', 'name');

    if (users.length === 0) {
      console.log('✅ No users found in database - ready to seed users');
    } else {
      console.log(`📊 Found ${users.length} existing users:`);
      console.log('\n' + '='.repeat(80));
      console.log('ID'.padEnd(28) + 'EMAIL'.padEnd(28) + 'ROLE'.padEnd(15) + 'STATUS'.padEnd(10) + 'DEPARTMENT');
      console.log('='.repeat(80));

      users.forEach(user => {
        console.log(
          (user._id.toString().slice(0, 24)).padEnd(28) +
          user.email.padEnd(28) +
          user.role.padEnd(15) +
          user.status.padEnd(10) +
          (user.department ? user.department.name : 'N/A')
        );
      });

      // Check for missing user roles
      const requiredRoles = ['admin', 'manager', 'dept_lead', 'employee'];
      const existingRoles = [...new Set(users.map(u => u.role))];
      const missingRoles = requiredRoles.filter(role => !existingRoles.includes(role));

      if (missingRoles.length > 0) {
        console.log('\n⚠️ Missing user roles:', missingRoles.join(', '));
      } else {
        console.log('\n✅ All required user roles exist');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error checking users:', error.message);
    process.exit(1);
  }
};

checkUsers();
