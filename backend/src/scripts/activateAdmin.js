import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';

dotenv.config();

/**
 * Script to activate admin account with email m@gmail.com
 * This script will:
 * 1. Check if the account exists
 * 2. Show current status
 * 3. Update status to 'active' if not already active
 * Usage: node src/scripts/activateAdmin.js
 */
const activateAdminAccount = async () => {
  try {
    console.log('🔄 Initializing Admin Account Activation...\n');

    // Connect to MongoDB
    await connectDB();

    // Email to activate
    const targetEmail = 'm@gmail.com';

    // Find the user by email
    console.log(`📝 Searching for admin account with email: ${targetEmail}...`);
    const user = await User.findOne({ email: targetEmail.toLowerCase() });

    if (!user) {
      console.log(`❌ No account found with email: ${targetEmail}\n`);
      console.log('💡 Suggestions:');
      console.log('   1. Check if the email is correct');
      console.log('   2. Verify the user exists in the database');
      console.log('   3. Check for case sensitivity (email is stored lowercase)');
      console.log('   4. Try searching with a different email address\n');
      process.exit(1);
    }

    console.log(`✅ Account found!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Employee ID: ${user.employeeId || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Current Status: ${user.status}`);
    console.log(`   Account Created: ${user.createdAt.toLocaleDateString()}\n`);

    // Check if already active
    if (user.status === 'active') {
      console.log('✅ Account is already active!');
      console.log('   No changes needed. The account is ready to use.\n');
      console.log('💡 Additional Information:');
      console.log(`   Last Login: ${user.lastLogin ? user.lastLogin.toLocaleString() : 'Never'}`);
      console.log(`   Email Verified: ${user.isEmailVerified ? 'Yes' : 'No'}`);
      console.log(`   Profile Completion: ${user.profileCompletion || 0}%\n`);
      process.exit(0);
    }

    // Ask for confirmation before updating
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmation = await new Promise((resolve) => {
      rl.question('
📋 Do you want to activate this account? (yes/no): ', resolve);
    });

    rl.close();

    if (confirmation.toLowerCase() !== 'yes' && confirmation.toLowerCase() !== 'y') {
      console.log('\n🔌 Operation cancelled. No changes made.\n');
      process.exit(0);
    }

    // Update the account status to active
    console.log('\n🔄 Activating account...');
    user.status = 'active';
    user.updatedAt = new Date();

    // Update last active timestamp
    if (!user.lastActiveAt) {
      user.lastActiveAt = new Date();
    }

    await user.save();

    console.log('✅ Account activated successfully!');
    console.log(`   New Status: ${user.status}`);
    console.log(`   Updated At: ${user.updatedAt.toLocaleString()}\n`);

    console.log('💡 Post-Activation Checklist:');
    console.log('   1. Verify the admin can login with their credentials');
    console.log('   2. Check if the admin has proper permissions');
    console.log('   3. Ensure the admin completes their profile');
    console.log('   4. Consider changing the default password for security');
    console.log('   5. Test admin dashboard access\n');

    process.exit(0);

  } catch (error) {
    console.error('\n🚨 Error activating admin account:', error.message);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors || {}).map((e) => e.message);
      console.error(`   Validation errors: ${errors.join(', ')}`);
    }

    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check database connection');
    console.error('   2. Verify MongoDB Atlas cluster is running');
    console.error('   3. Ensure the user exists in the database');
    console.error('   4. Check for network connectivity issues\n');

    process.exit(1);
  }
};

// Run the script
activateAdminAccount();