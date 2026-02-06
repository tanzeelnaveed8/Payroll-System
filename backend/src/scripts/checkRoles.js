import dotenv from 'dotenv';
import mongoose from 'mongoose';
import RolePermission from '../models/RolePermission.js';

dotenv.config();

const checkRoles = async () => {
  try {
    console.log('🔍 Checking current roles in RolePermission collection...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payroll', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const roles = await RolePermission.find({});

    if (roles.length === 0) {
      console.log('✅ No roles found in RolePermission collection - ready to seed roles');
    } else {
      console.log('📊 Found existing roles:');
      roles.forEach(role => {
        console.log(`  - ${role.roleId}: ${role.roleName}`);
      });

      // Check for missing roles
      const requiredRoles = ['admin', 'manager', 'dept_lead', 'employee'];
      const missingRoles = requiredRoles.filter(roleId => !roles.some(r => r.roleId === roleId));

      if (missingRoles.length > 0) {
        console.log('\n⚠️ Missing roles:', missingRoles.join(', '));
      } else {
        console.log('\n✅ All required roles exist');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking roles:', error.message);
    process.exit(1);
  }
};

checkRoles();