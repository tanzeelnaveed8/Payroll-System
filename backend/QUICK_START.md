# Quick Start Guide

## Step 1: Whitelist Your IP Address ⚠️ CRITICAL

**This is REQUIRED before connecting to MongoDB Atlas:**

1. Visit: https://cloud.mongodb.com/v2#/security/network/whitelist
2. Click **"Add IP Address"**
3. Click **"Add Current IP Address"** (or use `0.0.0.0/0` for development only)
4. Click **"Confirm"**
5. Wait 1-2 minutes

## Step 2: Create Environment File

Create a file named `.env` in the `backend` folder with this content:

```env
MONGODB_URI=mongodb+srv://Payroll_db_user:KoOS7y7q1DrrdBK8@payroll.r5tcrsk.mongodb.net/payroll_system?retryWrites=true&w=majority
DATABASE_NAME=payroll_system
PORT=5000
NODE_ENV=development
JWT_SECRET=payroll-system-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
```

## Step 3: Test Connection

```bash
cd backend
npm run test-connection
```

Expected output:
```
✅ MongoDB Connected: ...
✅ User model connected. Current users: 0
✅ Department model connected. Current departments: 0
✅ Indexes created successfully
✅ All tests passed! Database is ready.
```

## Step 4: Initialize Database (Create Indexes)

```bash
npm run init-db
```

## Step 5: Start Development Server

```bash
npm run dev
```

Server will start on: http://localhost:5000

## Troubleshooting

### Error: "IP not whitelisted"
→ Go back to Step 1 and whitelist your IP

### Error: "Cannot find module"
→ Run `npm install` in the backend directory

### Error: "MONGODB_URI is not defined"
→ Make sure `.env` file exists in `backend/` directory

## Verify Installation

Check that these files exist:
- ✅ `backend/src/models/User.js`
- ✅ `backend/src/models/Department.js`
- ✅ `backend/src/config/database.js`
- ✅ `backend/.env` (you created this)
- ✅ `backend/package.json`

## Next Steps

After successful connection:
1. Create API routes for CRUD operations
2. Add authentication middleware
3. Create seed data scripts
4. Connect frontend to backend API

