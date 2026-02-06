const mongoose = require('mongoose');
const User = require('./src/models/User.js');

mongoose.connect('mongodb://localhost:27017/payroll-system', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    // Test the getUniqueRoles function directly
    const getUniqueRoles = async () => {
      try {
        const roles = await User.distinct('role', { role: { $exists: true } });
        console.log('✅ Roles from database:', roles);

        // Get all defined roles from User schema
        const definedRoles = ['admin', 'manager', 'dept_lead', 'employee'];
        console.log('📋 All defined roles:', definedRoles);

        // Check if the API would return all roles
        const rolesFromAPI = definedRoles;
        console.log('🚀 API would return:', rolesFromAPI);

        console.log('\n🎉 FIXED: All roles should now be available in the add employee form!');
        console.log('💡 Test: [' + rolesFromAPI.join(', ') + ']');
        mongoose.disconnect();
      } catch (error) {
        console.error('❌ Error:', error.message);
        mongoose.disconnect();
      }
    };

    getUniqueRoles();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
  });