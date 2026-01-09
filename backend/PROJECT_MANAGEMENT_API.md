# Project Management API Documentation

## Overview

Complete project management system with insights, connection handling, and KPI tracking. Supports multiple connection types, automatic data syncing, and comprehensive analytics.

## API Endpoints

### Project CRUD Operations

#### `GET /api/projects`
List all projects with filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by status (`draft`, `connected`, `pending`, `archived`)
- `category` (optional): Filter by category
- `search` (optional): Search by name or owner
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Access:** All authenticated users

**Response:**
```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### `GET /api/projects/:id`
Get project details by ID.

**Access:** All authenticated users

**Response:**
```json
{
  "success": true,
  "message": "Project retrieved successfully",
  "data": {
    "project": {
      "_id": "...",
      "name": "Project Name",
      "status": "connected",
      "kpi": {...},
      "health": {...},
      ...
    }
  }
}
```

#### `POST /api/projects`
Create a new project.

**Access:** Admin only

**Request Body:**
```json
{
  "name": "Project Name",
  "category": "Category",
  "owner": "Owner Name",
  "ownerId": "user_id",
  "status": "draft",
  "connection": {
    "baseUrl": "https://api.example.com",
    "authType": "api-key",
    "apiKey": "key_here"
  },
  "kpi": {
    "users": 1000,
    "revenue": 50000,
    "activity": 75,
    "growth": 5.5
  }
}
```

#### `PUT /api/projects/:id`
Update an existing project.

**Access:** Admin only

**Request Body:** Same as create (all fields optional)

#### `DELETE /api/projects/:id`
Delete a project.

**Access:** Admin only

### Insights & Analytics

#### `GET /api/projects/:id/insights`
Get project insights including KPIs, trends, and health metrics.

**Query Parameters:**
- `includeChartData` (optional): Include 6-month chart data (`true`/`false`)

**Access:** All authenticated users

**Response:**
```json
{
  "success": true,
  "message": "Project insights retrieved successfully",
  "data": {
    "project": {...},
    "insights": {
      "kpi": {
        "users": 1000,
        "revenue": 50000,
        "activity": 75,
        "growth": 5.5
      },
      "trend": "up",
      "trendPercentage": 5.5,
      "health": {
        "uptime": 95.5,
        "engagement": 75.0,
        "risk": "low"
      }
    },
    "chartData": {
      "labels": ["Jan 2024", "Feb 2024", ...],
      "datasets": [...]
    }
  }
}
```

#### `GET /api/projects/insights/aggregated`
Get aggregated insights across all projects.

**Query Parameters:**
- `status` (optional): Filter by status before aggregation

**Access:** All authenticated users

**Response:**
```json
{
  "success": true,
  "message": "Aggregated insights retrieved successfully",
  "data": {
    "insights": {
      "totalProjects": 10,
      "connectedProjects": 8,
      "totalUsers": 50000,
      "totalRevenue": 5000000,
      "averageGrowth": 5.5,
      "averageUptime": 95.5,
      "averageEngagement": 75.0,
      "riskDistribution": {
        "low": 5,
        "medium": 3,
        "high": 2
      }
    }
  }
}
```

### Connection Management

#### `POST /api/projects/:id/connect`
Test connection to external API.

**Access:** Admin only

**Request Body (optional):**
```json
{
  "connection": {
    "baseUrl": "https://api.example.com",
    "authType": "api-key",
    "apiKey": "key_here"
  }
}
```

If connection is not provided, uses project's existing connection.

**Response:**
```json
{
  "success": true,
  "message": "Connection successful",
  "data": {
    "connectionTest": {
      "success": true,
      "status": 200,
      "statusText": "OK",
      "message": "Connection successful"
    }
  }
}
```

#### `POST /api/projects/:id/sync`
Sync project data from external API.

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "message": "Project data synced successfully",
  "data": {
    "project": {...},
    "syncedData": {
      "users": 1000,
      "revenue": 50000,
      "activity": 75,
      "growth": 5.5
    }
  }
}
```

## Connection Types

### API Key Authentication
```json
{
  "baseUrl": "https://api.example.com",
  "authType": "api-key",
  "apiKey": "your_api_key_here"
}
```

### Token Authentication
```json
{
  "baseUrl": "https://api.example.com",
  "authType": "token",
  "token": "your_bearer_token_here",
  "tokenExpiresAt": "2024-12-31T23:59:59Z"
}
```

### OAuth Authentication
```json
{
  "baseUrl": "https://api.example.com",
  "authType": "oauth",
  "token": "your_oauth_token_here",
  "tokenExpiresAt": "2024-12-31T23:59:59Z"
}
```

## Project Status

- `draft`: Project is being set up
- `connected`: Project is connected and active
- `pending`: Connection is pending verification
- `archived`: Project is archived

## KPI Data Structure

```json
{
  "users": 1000,        // Number of users
  "revenue": 50000,     // Revenue amount
  "activity": 75,       // Activity score/percentage
  "growth": 5.5         // Growth percentage
}
```

## Health Metrics

- **Uptime**: Calculated based on last sync time (0-100)
- **Engagement**: Calculated as (activity / users) * 100
- **Risk**: `low`, `medium`, or `high` based on uptime, engagement, and growth

## Trend Calculation

- **Up**: Growth > 0 or revenue increased
- **Down**: Growth < 0 or revenue decreased
- **Neutral**: No significant change

## Chart Data

6-month trend charts include:
- Users
- Revenue
- Activity
- Growth (%)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ]
}
```

## Security

- All endpoints require authentication
- Admin-only endpoints: Create, Update, Delete, Connect, Sync
- Connection credentials are stored securely in database
- Passwords/tokens are masked in logs

## Database Models

### Project Schema
- `name`: String (required)
- `category`: String
- `owner`: String
- `ownerId`: ObjectId (ref: User)
- `status`: Enum (required)
- `connection`: ConnectionSchema
- `kpi`: KPISchema
- `trend`: Enum
- `trendPercentage`: Number
- `health`: HealthSchema
- `createdBy`: ObjectId (ref: User)
- `createdAt`: Date
- `updatedAt`: Date

## Usage Examples

### Create a Project
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "status": "draft",
    "connection": {
      "baseUrl": "https://api.example.com",
      "authType": "api-key",
      "apiKey": "key123"
    }
  }'
```

### Test Connection
```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/connect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Sync Project Data
```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Insights
```bash
curl http://localhost:5000/api/projects/PROJECT_ID/insights?includeChartData=true \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notes

- External API endpoints are configurable in `projectService.js`
- Default endpoints: `/api/users/count`, `/api/revenue`, `/api/activity`, `/api/growth`
- Adjust endpoints based on your external API structure
- Connection timeout: 10 seconds for testing, 5 seconds per endpoint for syncing
- Insights are automatically calculated when KPI data is updated

