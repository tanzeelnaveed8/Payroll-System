import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

mongoose.connect(MONGODB_URI).then(async () => {
  const conn = mongoose.connection;

  // Get total users count
  const totalUsers = await conn.db.collection('users').countDocuments();
  console.log('\n📊 Total Users:', totalUsers);

  // Get distinct roles
  const distinctRoles = await conn.db.collection('users').distinct('role');
  console.log('🔐 Distinct Roles:', distinctRoles);

  // Check for users with roles other than admin
  const nonAdminUsers = await conn.db.collection('users').find({
    role: { $ne: 'admin' }
  }, { name: 1, email: 1, role: 1 }).toArray();

  console.log('\nUsers with non-admin roles:', nonAdminUsers.length);
  nonAdminUsers.forEach(user => console.log(user));

  // Check for users with role department_lead
  const departmentLeadUsers = await conn.db.collection('users').find({
    role: 'department_lead'
  }, { name: 1, email: 1, role: 1 }).toArray();

  console.log('\nUsers with role department_lead:', departmentLeadUsers.length);
  departmentLeadUsers.forEach(user => console.log(user));

  // Check for users with null/empty roles
  const usersWithNoRole = await conn.db.collection('users').find({
    role: { $in: [null, '', undefined] }
  }, { name: 1, email: 1, role: 1 }).toArray();

  console.log('\nUsers with null/empty roles:', usersWithNoRole.length);
  usersWithNoRole.forEach(user => console.log(user));

  mongoose.disconnect();
}).catch(err => {
  console.error('❌ Error:', err.message);
});