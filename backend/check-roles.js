import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

const connectionOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 50,
  minPoolSize: 5,
  retryWrites: true,
  w: 'majority',
  retryReads: true,
  maxIdleTimeMS: 30000,
};

mongoose.connect(MONGODB_URI, connectionOptions).then(async () => {
  const conn = mongoose.connection;

  console.log('🔍 Additional Role Checks...');
  console.log('===============================');

  // Check for any users with role 'department_lead' that should be normalized to 'dept_lead'
  const departmentLeadUsers = await conn.db.collection('users').find({ role: 'department_lead' }, { projection: { name: 1, email: 1, role: 1 } }).limit(5).toArray();

  if (departmentLeadUsers.length > 0) {
    console.log('✅ No users with role "department_lead" (already normalized)');
  } else {
    console.log('⚠️  Users with role "department_lead" (should be normalized):');
    departmentLeadUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}): ${user.role}`);
    });
  }

  // Check for users with null/empty roles
  const usersWithNoRole = await conn.db.collection('users').find({ role: { $in: [null, '', undefined] } }, { projection: { name: 1, email: 1 } }).limit(5).toArray();

  if (usersWithNoRole.length > 0) {
    console.log('✅ No users with null/empty roles');
  } else {
    console.log('⚠️  Users with null/empty roles:');
    usersWithNoRole.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });
  }

  // Check for users with invalid roles
  const invalidRoles = await conn.db.collection('users').find({ role: { $nin: ['admin', 'manager', 'dept_lead', 'employee'] } }, { projection: { name: 1, email: 1, role: 1 } }).limit(5).toArray();

  if (invalidRoles.length > 0) {
    console.log('✅ No users with invalid roles');
  } else {
    console.log('⚠️  Users with invalid roles:');
    invalidRoles.forEach(user => {
      console.log(`   - ${user.name} (${user.email}): ${user.role}`);
    });
  }

  mongoose.disconnect();
}).catch(err => {
  console.error('❌ Error:', err.message);
});