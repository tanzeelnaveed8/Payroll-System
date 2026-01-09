# Payroll System Backend

Backend API for the Payroll System built with Node.js, Express, and MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update MongoDB connection string and other settings

3. Start the development server:
```bash
npm run dev
```

## Database Models

### Users
- Complete user authentication and profile management
- Role-based access control (admin, manager, employee)
- Employee hierarchy support
- Password hashing with bcrypt

### Departments
- Department management
- Budget tracking
- Employee statistics
- Nested department support

## API Endpoints

- `GET /health` - Health check
- `GET /api` - API information

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `DATABASE_NAME` - Database name
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - JWT secret key
- `BCRYPT_SALT_ROUNDS` - Bcrypt salt rounds (default: 12)

