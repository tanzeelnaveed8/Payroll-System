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

  // Get distinct roles directly from the collection
  const distinctRoles = await conn.db.collection('users').distinct('role');
  console.log('Distinct roles from database:', distinctRoles);

  // Check for any users with role 'department_lead' that should be normalized
  const departmentLeadUsers = await conn.db.collection('users').find({ role: 'department_lead' }, { name: 1, email: 1, role: 1 }).limit(5).toArray();
  console.log('Users with role \"department_lead\":', departmentLeadUsers);

  // Check for users with null/empty roles
  const usersWithNoRole = await conn.db.collection('users').find({ role: { $in: [null, '', undefined] } }, { name: 1, email: 1 }).limit(5).toArray();
  console.log('Users with null/empty roles:', usersWithNoRole);

  mongoose.disconnect();
}).catch(err => {
  console.error('❌ Error:', err.message);
});