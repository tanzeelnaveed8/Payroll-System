# MongoDB Connection Troubleshooting Guide

## Common Error: `querySrv ECONNREFUSED`

This error indicates that the application cannot resolve the MongoDB hostname or establish a connection.

### Quick Fixes

1. **Check MongoDB Atlas Cluster Status**
   - Log into MongoDB Atlas: https://cloud.mongodb.com
   - Verify your cluster is **running** (not paused)
   - If paused, click "Resume" to start the cluster

2. **Verify Connection String**
   - Check your `.env` file has `MONGODB_URI` set correctly
   - Format should be: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
   - Or: `mongodb://username:password@host:port/database`

3. **Check Network Access**
   - In MongoDB Atlas, go to **Network Access**
   - Add your current IP address (or use `0.0.0.0/0` for development)
   - Wait a few minutes for changes to propagate

4. **Verify Database User**
   - In MongoDB Atlas, go to **Database Access**
   - Ensure your user exists and has proper permissions
   - Verify username and password match your connection string

5. **Try Direct Connection**
   - If `mongodb+srv://` fails, try `mongodb://` format
   - Get connection string from MongoDB Atlas → Connect → Connect your application
   - Use the "Standard connection string" option

### Environment Variables Setup

Create a `.env` file in the `backend` directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/payroll_system?retryWrites=true&w=majority
DATABASE_NAME=payroll_system

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-secret-key-here

# CORS Origin
CORS_ORIGIN=http://localhost:3000
```

### Testing Connection

Run the test script:
```bash
cd backend
node src/scripts/testConnection.js
```

### Common Issues

#### Issue: Cluster is Paused
**Solution:** Resume the cluster in MongoDB Atlas dashboard

#### Issue: IP Not Whitelisted
**Solution:** Add your IP to Network Access in MongoDB Atlas

#### Issue: Wrong Credentials
**Solution:** Verify username/password in connection string match Database Access settings

#### Issue: DNS Resolution Failure
**Solution:** 
- Check internet connection
- Try using direct connection string (`mongodb://` instead of `mongodb+srv://`)
- Check firewall settings

#### Issue: Connection Timeout
**Solution:**
- Check network connectivity
- Verify cluster is accessible
- Increase timeout in connection options

### Getting Help

If issues persist:
1. Check MongoDB Atlas logs
2. Verify all environment variables are set
3. Test connection using MongoDB Compass
4. Review MongoDB Atlas status page

