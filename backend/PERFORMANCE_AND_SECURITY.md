# Performance Optimization & Security Hardening

This document outlines the performance optimizations and security hardening measures implemented in the Payroll System.

## Security Hardening

### 1. Rate Limiting

**Location:** `backend/src/middleware/rateLimiter.js`

- **General API Limiter:** 100 requests per 15 minutes per IP
- **Authentication Limiter:** 5 login attempts per 15 minutes per IP
- **File Upload Limiter:** 20 uploads per hour per IP
- **Password Reset Limiter:** 3 attempts per hour per IP

**Applied to:**
- `/api/*` - All API routes (general limiter)
- `/api/auth/login`, `/api/auth/register` - Authentication endpoints
- `/api/files/upload` - File upload endpoints
- `/api/auth/forgot-password`, `/api/auth/reset-password` - Password reset endpoints

### 2. Input Sanitization

**Location:** `backend/src/middleware/sanitize.js`

- **MongoDB Injection Prevention:** Uses `express-mongo-sanitize` to prevent MongoDB operator injection (`$gt`, `$ne`, `$where`, etc.)
- **XSS Prevention:** Custom middleware using `xss` library to sanitize user input
- **Custom Input Sanitization:** Removes null bytes, control characters, and trims whitespace
- **ObjectId Validation:** Validates MongoDB ObjectId format to prevent injection

**Applied to:** All routes via `server.js`

### 3. Security Headers

**Location:** `backend/src/server.js`

- **Helmet.js:** Automatically sets security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security`
  - And more...

## Performance Optimization

### 1. Database Indexes

**Location:** `backend/src/utils/indexVerifier.js`

**Indexes Created/Verified:**

- **Users:**
  - `email` (unique)
  - `employeeId`
  - `role + status` (compound)
  - `managerId`
  - `department`

- **Timesheets:**
  - `employeeId + date` (compound, descending)
  - `payrollPeriodId`
  - `status`
  - `date` (descending)

- **PayStubs:**
  - `employeeId + payDate` (compound, descending)
  - `payrollPeriodId`
  - `status`

- **LeaveRequests:**
  - `employeeId + startDate` (compound, descending)
  - `status`
  - `leaveType`
  - `startDate + endDate` (compound)

- **LeaveBalances:**
  - `employeeId + year` (compound)
  - `employeeId`

- **PayrollPeriods:**
  - `periodStart + periodEnd` (compound)
  - `status`
  - `department`

- **Tasks:**
  - `employeeId + status` (compound)
  - `assignedBy`
  - `dueDate`
  - `status + priority` (compound)

- **Notifications:**
  - `userId + read + createdAt` (compound, descending)
  - `userId + createdAt` (compound, descending)
  - `type`
  - `expiresAt`

- **FileAttachments:**
  - `entityType + entityId` (compound)
  - `uploadedBy`
  - `status`
  - `createdAt` (descending)

- **Projects:**
  - `status`
  - `ownerId`
  - `createdAt` (descending)

- **PerformanceUpdates:**
  - `managerId + date` (compound, descending)
  - `employeeId + date` (compound, descending)
  - `date` (descending)

**Verification:** Indexes are automatically verified and created on database connection.

### 2. Query Optimization

**Location:** `backend/src/utils/queryOptimizer.js`

**Features:**
- **Lean Queries:** Returns plain JavaScript objects instead of Mongoose documents (faster)
- **Field Selection:** Limits returned fields to only what's needed
- **Pagination:** Built-in skip/limit with max limit protection (1000)
- **Sorting:** Optimized sorting with index hints
- **Population:** Efficient population of related documents
- **Aggregation Pipeline Builder:** Helper for building efficient aggregation pipelines

**Applied to:**
- `employeeService.js` - Dashboard queries
- `notificationService.js` - Notification queries

### 3. Caching Strategy

**Location:** `backend/src/utils/cache.js`

**Features:**
- **In-Memory Caching:** Using `node-cache` for fast access
- **TTL Support:** Configurable time-to-live (default: 5 minutes)
- **Cache Middleware:** Express middleware for automatic caching of GET requests
- **Cache Invalidation:** Manual cache clearing on updates

**Cached Endpoints:**
- `/api/settings` - Settings data (5 minutes TTL)
- `/api/settings/:type` - Specific settings type (5 minutes TTL)

**Cache Management:**
- Automatic cache invalidation on settings updates
- Manual cache clearing via `cacheService.del()` or `clearCache()`

## Implementation Details

### Middleware Order (in `server.js`)

1. **Helmet** - Security headers
2. **MongoDB Sanitization** - Prevent injection
3. **XSS Sanitization** - Prevent XSS attacks
4. **Custom Input Sanitization** - Additional cleaning
5. **ObjectId Validation** - Validate IDs
6. **CORS** - Cross-origin configuration
7. **Body Parsing** - JSON/URL-encoded parsing
8. **Rate Limiting** - Request throttling
9. **Routes** - Application routes

### Best Practices

1. **Always use lean queries** for read-only operations
2. **Select only needed fields** to reduce data transfer
3. **Use indexes** for frequently queried fields
4. **Cache frequently accessed data** that doesn't change often
5. **Validate and sanitize** all user input
6. **Rate limit** sensitive endpoints
7. **Use compound indexes** for multi-field queries

## Monitoring

### Cache Statistics

```javascript
import { getCacheStats } from './utils/cache.js';

const stats = getCacheStats();
console.log(stats);
// {
//   keys: 10,
//   hits: 150,
//   misses: 20,
//   ksize: 1024,
//   vsize: 51200
// }
```

### Index Statistics

```javascript
import { getIndexStats } from './utils/indexVerifier.js';

const stats = await getIndexStats(User);
console.log(stats);
```

## Environment Variables

No additional environment variables required. All optimizations work with existing configuration.

## Testing

1. **Rate Limiting:** Try making more than 100 requests in 15 minutes
2. **Sanitization:** Try injecting MongoDB operators or XSS payloads
3. **Caching:** Check response times on cached vs non-cached endpoints
4. **Indexes:** Use MongoDB explain() to verify index usage

## Future Enhancements

1. **Redis Caching:** Replace in-memory cache with Redis for distributed systems
2. **Query Logging:** Add query performance logging
3. **Slow Query Detection:** Alert on queries taking > 1 second
4. **Connection Pooling:** Optimize MongoDB connection pool settings
5. **CDN Integration:** Cache static assets via CDN

