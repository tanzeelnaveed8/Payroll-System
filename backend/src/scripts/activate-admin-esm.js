import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || ''

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ Connected to MongoDB!')

    // Find admin users
    const users = await mongoose.connection.db.collection('users')
      .find({ role: 'admin' })
      .toArray()

    console.log(`🔧 Admin accounts found: ${users.length}`)

    if (users.length === 0) {
      console.log('❌ No admin account found!')
      console.log('💡 Please check if admin account exists in database.')
      process.exit(1)
    }

    // Activate all admin accounts
    for (const user of users) {
      if (user.status !== 'active') {
        console.log(`🔄 Activating admin: ${user.email}`)
        await mongoose.connection.db.collection('users')
          .updateOne({ _id: user._id }, { $set: { status: 'active', updatedAt: new Date() } })
        console.log(`✅ Admin activated: ${user.email}`)
      } else {
        console.log(`✅ Admin already active: ${user.email}`)
      }
    }

    console.log('🎉 All admin accounts activated successfully!')

    // Show all admin accounts status
    const updatedUsers = await mongoose.connection.db.collection('users')
      .find({ role: 'admin' })
      .toArray()

    console.log(`\n📋 Final admin accounts status:`)
    updatedUsers.forEach(user => {
      console.log(`\n- Email: ${user.email}`)
      console.log(`  Name: ${user.name || 'N/A'}`)
      console.log(`  Status: ${user.status}`)
      console.log(`  Created: ${new Date(user.createdAt).toLocaleDateString()}`)
    })

    mongoose.disconnect()

  })
  .catch(err => {
    console.error('❌ Database connection failed!', err.message)
    console.error('💡 Please check your .env file and MongoDB connection.')
    process.exit(1)
  })