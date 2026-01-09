# MongoDB Setup Instructions

## Important: IP Whitelisting Required

Your MongoDB Atlas cluster requires IP whitelisting. The connection will fail until you add your IP address to the whitelist.

### Steps to Whitelist Your IP:

1. **Log in to MongoDB Atlas:**
   - Go to https://cloud.mongodb.com/
   - Sign in with your account

2. **Navigate to Network Access:**
   - Click on "Network Access" in the left sidebar
   - Or go to: https://cloud.mongodb.com/v2#/security/network/whitelist

3. **Add IP Address:**
   - Click "Add IP Address" button
   - Choose one of these options:
     - **"Add Current IP Address"** (recommended for testing)
     - **"Allow Access from Anywhere"** (0.0.0.0/0) - Only for development, NOT recommended for production

4. **Save:**
   - Click "Confirm" to add the IP address
   - Wait 1-2 minutes for the changes to propagate

### After Whitelisting:

Run the connection test:
```bash
npm run test-connection
```

Or initialize the database:
```bash
npm run init-db
```

## Environment Variables

Create a `.env` file in the `backend` directory with:

```env
MONGODB_URI=mongodb+srv://Payroll_db_user:KoOS7y7q1DrrdBK8@payroll.r5tcrsk.mongodb.net/payroll_system?retryWrites=true&w=majority
DATABASE_NAME=payroll_system
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
```

## Testing Connection

After whitelisting your IP, test the connection:

```bash
npm run test-connection
```

This will:
- Connect to MongoDB
- Test User and Department models
- Create indexes
- Display index information

## Initialize Database

To create all indexes:

```bash
npm run init-db
```

## Start Server

```bash
npm run dev
```

The server will start on http://localhost:5000

