const mongoose = require("mongoose");

async function activateUser() {
  try {
    console.log("🔍 Searching for user account...");
    
    process.loadEnvFile(".env");
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error("❌ No database connection string found");
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log("✅ Database connected");
    
    const User = require("./src/models/User.js");
    
    // Look for user with email m@gmail.com
    const user = await User.findOne({ email: "m@gmail.com" });
    
    if (!user) {
      console.log("❌ User m@gmail.com not found");
      
      // Show all users limited to avoid overload
      const allUsers = await User.find({}, "name email status role").limit(10);
      console.log("\n📋 Available users in database:");
      allUsers.forEach((u, idx) => {
        console.log((idx + 1) + ".", u.name, "- Email:", u.email, "- Status:", u.status, "- Role:", u.role);
      });
      
      if (allUsers.length === 10) {
        const total = await User.countDocuments();
        console.log("\n⚠️ Showing first 10 of", total, "total users");
      }
    } else {
      console.log("\n👤 User found!");
      console.log("Name:", user.name);
      console.log("Email:", user.email);
      console.log("Role:", user.role);
      console.log("Status:", user.status);
      console.log("ID:", user._id.toString());
      
      if (user.status !== "active") {
        console.log("\n🔄 Account is inactive. Activating...");
        user.status = "active";
        await user.save();
        console.log("✅ User account activated!");
        console.log("📊 New status: active");
      } else {
        console.log("\n✅ Account is already active");
      }
    }
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database disconnected");
  }
}

activateUser();
