# Authentication API Documentation

## Endpoints

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "employee"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /api/auth/register
Register a new user (admin only).

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Doe",
  "role": "employee",
  "employeeId": "EMP001",
  "department": "Engineering"
}
```

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/logout
Logout and invalidate session.

**Headers:**
```
Authorization: Bearer <accessToken>
```

### POST /api/auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "newPassword123"
}
```

### GET /api/auth/me
Get current user profile.

**Headers:**
```
Authorization: Bearer <accessToken>
```

## Environment Variables

Required in `.env`:
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Access token expiry (default: 7d)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiry (default: 30d)
- `BCRYPT_SALT_ROUNDS` - Bcrypt salt rounds (default: 12)
- `CORS_ORIGIN` - CORS allowed origin (default: *)

## Usage

All protected routes require:
```
Authorization: Bearer <accessToken>
```

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Session management with UserSessions
- Account locking after 5 failed login attempts
- Token expiration handling
- Refresh token rotation


